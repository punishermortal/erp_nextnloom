import logging

from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .payment import verify_razorpay_payment
from cart.models import Cart

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """
    Verify Razorpay payment and update order status
    """
    order_id = request.data.get('order_id')
    razorpay_order_id = request.data.get('razorpay_order_id')
    razorpay_payment_id = request.data.get('razorpay_payment_id')
    razorpay_signature = request.data.get('razorpay_signature')

    if not all([order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return Response({'error': 'Missing payment details'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

    # Verify payment signature
    try:
        is_valid = verify_razorpay_payment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        order.payment_status = 'failed'
        order.save(update_fields=['payment_status'])
        return Response({
            'success': False,
            'error': f'Payment verification error: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    if is_valid:
        # Update order payment status within transaction
        try:
            with transaction.atomic():
                order.payment_status = 'paid'
                order.razorpay_payment_id = razorpay_payment_id
                order.razorpay_signature = razorpay_signature
                order.status = 'processing'
                order.save(update_fields=['payment_status', 'razorpay_payment_id', 'razorpay_signature', 'status'])

                # Clear cart
                try:
                    cart = Cart.objects.get(user=request.user)
                    cart.items.all().delete()
                    logger.info(f"Cart cleared for user {request.user.id} after payment")
                except Cart.DoesNotExist:
                    pass

                logger.info(f"Payment verified successfully for order {order.order_number}")
                return Response({
                    'success': True,
                    'message': 'Payment verified successfully',
                    'order_id': order.id,
                    'order_number': order.order_number
                })
        except Exception as e:
            logger.error(f"Error updating order after payment: {e}")
            return Response({
                'success': False,
                'error': 'Failed to update order status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        logger.warning(f"Payment verification failed for order {order.order_number}")
        order.payment_status = 'failed'
        order.save(update_fields=['payment_status'])
        return Response({
            'success': False,
            'error': 'Payment verification failed'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_razorpay_key(request):
    """
    Get Razorpay key ID for frontend
    """
    from decouple import config
    razorpay_key = config('RAZORPAY_KEY_ID', default='')
    return Response({'key': razorpay_key})

