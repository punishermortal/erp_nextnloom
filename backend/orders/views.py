from decimal import Decimal
import logging

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from cart.models import Cart, CartItem
from .delivery import create_delivery_order
from .models import Order, OrderItem
from .payment import create_razorpay_order, verify_razorpay_payment
from .serializers import CreateOrderSerializer, OrderSerializer

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # If user is admin, return all orders; otherwise return only user's orders
        if self.request.user.is_staff or getattr(self.request.user, 'role', None) == 'admin':
            return Order.objects.all().select_related('user').prefetch_related('items', 'items__product')
        return Order.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer

    def get_serializer_context(self):
        """Add request to serializer context for admin checks"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        """Override update to allow admin status updates"""
        instance = self.get_object()
        # Check if user is admin or owns the order
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin' or instance.user == request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new order with transaction handling to ensure data integrity"""
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get user's cart
        try:
            cart = Cart.objects.select_related('user').prefetch_related('items__product').get(user=request.user)
            cart_items = cart.items.all()
        except Cart.DoesNotExist:
            logger.warning(f"Cart not found for user {request.user.id}")
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart_items:
            logger.warning(f"Empty cart for user {request.user.id}")
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate totals
        subtotal = sum(item.total_price for item in cart_items)
        shipping_cost = Decimal('50.00')  # Fixed shipping cost, can be made dynamic
        total = subtotal + shipping_cost
        payment_method = serializer.validated_data.get('payment_method', 'cod')

        try:
            # Create order within transaction
            order = Order.objects.create(
                user=request.user,
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                total=total,
                payment_method=payment_method,
                payment_status='pending',
                shipping_address=serializer.validated_data['shipping_address'],
                shipping_city=serializer.validated_data['shipping_city'],
                shipping_state=serializer.validated_data['shipping_state'],
                shipping_zip_code=serializer.validated_data['shipping_zip_code'],
                shipping_phone=serializer.validated_data['shipping_phone'],
                notes=serializer.validated_data.get('notes', ''),
            )
            logger.info(f"Order created: {order.order_number} for user {request.user.id}")

            # Create order items
            order_items_data = []
            for cart_item in cart_items:
                product = cart_item.product
                if not product:
                    logger.error(f"Product not found for cart item {cart_item.id}")
                    continue
                    
                commission_rate = Decimal(str(product.commission_rate if hasattr(product, 'commission_rate') and product.commission_rate else 0))
                vendor = getattr(product, 'vendor', None)

                order_item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=cart_item.quantity,
                    price=product.final_price,
                    vendor=vendor,
                    commission_rate=commission_rate,
                )
                logger.info(f"Order item created: {order_item.id} for order {order.order_number}")

                # Update vendor profile if vendor exists
                if vendor and hasattr(vendor, 'vendor_profile'):
                    try:
                        profile = vendor.vendor_profile
                        profile.total_sales = (profile.total_sales or Decimal('0.00')) + order_item.total
                        profile.total_commission_paid = (profile.total_commission_paid or Decimal('0.00')) + order_item.admin_commission
                        profile.save(update_fields=['total_sales', 'total_commission_paid'])
                        logger.info(f"Updated vendor profile for {vendor.id}")
                    except Exception as e:
                        logger.error(f"Error updating vendor profile: {e}")

                order_items_data.append({
                    'name': product.name,
                    'quantity': cart_item.quantity,
                    'price': float(product.final_price)
                })

            # Handle Razorpay payment
            razorpay_order = None
            if payment_method == 'razorpay':
                try:
                    razorpay_order = create_razorpay_order(
                        amount=total,
                        receipt=order.order_number
                    )
                    if razorpay_order:
                        order.razorpay_order_id = razorpay_order.get('id')
                        order.save(update_fields=['razorpay_order_id'])
                        logger.info(f"Razorpay order created: {order.razorpay_order_id}")
                    else:
                        logger.error(f"Failed to create Razorpay order for {order.order_number}")
                        # Don't delete order, just return error
                        return Response({'error': 'Failed to create payment order'}, 
                                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                except Exception as e:
                    logger.error(f"Razorpay error: {e}")
                    return Response({'error': 'Payment gateway error'}, 
                                  status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Create delivery order with Delhivery (non-blocking)
            try:
                delivery_data = {
                    'order_id': order.order_number,
                    'delivery_address': serializer.validated_data['shipping_address'],
                    'delivery_city': serializer.validated_data['shipping_city'],
                    'delivery_state': serializer.validated_data['shipping_state'],
                    'delivery_pincode': serializer.validated_data['shipping_zip_code'],
                    'customer_name': f"{request.user.first_name or ''} {request.user.last_name or ''}".strip() or request.user.email,
                    'customer_phone': serializer.validated_data['shipping_phone'],
                    'items': order_items_data,
                    'total_amount': float(total),
                    'payment_method': payment_method
                }
                
                delivery_result = create_delivery_order(delivery_data)
                if delivery_result.get('success'):
                    order.delivery_partner_order_id = delivery_result.get('order_id')
                    order.delivery_tracking_id = delivery_result.get('tracking_id')
                    order.delivery_status = delivery_result.get('status', 'Pending')
                    order.save(update_fields=['delivery_partner_order_id', 'delivery_tracking_id', 'delivery_status'])
                    logger.info(f"Delhivery order created: {order.delivery_tracking_id}")
                else:
                    logger.warning(f"Delhivery order creation failed: {delivery_result.get('message')}")
                    order.delivery_status = 'Pending Manual Entry'
                    order.save(update_fields=['delivery_status'])
            except Exception as e:
                logger.error(f"Delhivery error: {e}")
                # Don't fail order creation if Delhivery fails
                order.delivery_status = 'Pending Manual Entry'
                order.save(update_fields=['delivery_status'])

            # For COD, mark as processing and clear cart
            # For Razorpay, cart will be cleared after payment verification
            if payment_method == 'cod':
                order.status = 'processing'
                order.payment_status = 'pending'  # Will be updated when payment is collected
                order.save(update_fields=['status', 'payment_status'])
                cart.items.all().delete()
                logger.info(f"COD order marked as processing: {order.order_number}")

            # Refresh order from database to ensure all data is current
            order.refresh_from_db()

            # Return order details
            order_serializer = OrderSerializer(order)
            response_data = order_serializer.data
            
            # Add Razorpay order details if payment method is Razorpay
            if payment_method == 'razorpay' and razorpay_order:
                from decouple import config
                response_data['razorpay_order_id'] = razorpay_order.get('id')
                response_data['razorpay_key'] = config('RAZORPAY_KEY_ID', default='')
            
            logger.info(f"Order creation successful: {order.order_number}, Total: ₹{total}")
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating order: {e}", exc_info=True)
            return Response({'error': f'Failed to create order: {str(e)}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

