from rest_framework import serializers
from products.serializers import ProductListSerializer
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    vendor = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            'id',
            'product',
            'quantity',
            'price',
            'total',
            'vendor',
            'commission_rate',
            'admin_commission',
            'vendor_earnings',
        )

    def get_vendor(self, obj):
        if not obj.vendor:
            return None
        profile = getattr(obj.vendor, 'vendor_profile', None)
        return {
            'id': obj.vendor.id,
            'business_name': profile.business_name if profile else obj.vendor.get_full_name(),
        }


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.SerializerMethodField()
    delivery_tracking_link = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'order_number', 'user', 'status', 'payment_status', 
                  'payment_method', 'subtotal', 'shipping_cost', 'total', 
                  'shipping_address', 'shipping_city', 'shipping_state', 
                  'shipping_zip_code', 'shipping_phone', 'delivery_tracking_id',
                  'delivery_status', 'notes', 'items', 'created_at', 'updated_at',
                  'razorpay_order_id', 'razorpay_payment_id', 'delivery_tracking_link')
        read_only_fields = ('order_number', 'created_at', 'updated_at',
                           'delivery_tracking_id', 'delivery_status', 'delivery_tracking_link',
                           'razorpay_order_id', 'razorpay_payment_id')

    def get_user(self, obj):
        """Return user details"""
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'username': obj.user.username,
            'phone_number': obj.user.phone_number,
        }

    def get_delivery_tracking_link(self, obj):
        """Return Delhivery tracking link if tracking ID exists"""
        if obj.delivery_tracking_id:
            return f"https://www.delhivery.com/track/package/{obj.delivery_tracking_id}"
        return None

    def validate_status(self, value):
        """Allow status updates for admin users"""
        request = self.context.get('request')
        if request and (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return value
        # For non-admin users, status is read-only
        return self.instance.status if self.instance else value

    def validate_payment_status(self, value):
        """Allow payment_status updates for admin users"""
        request = self.context.get('request')
        if request and (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            return value
        # For non-admin users, payment_status is read-only
        return self.instance.payment_status if self.instance else value


class CreateOrderSerializer(serializers.ModelSerializer):
    payment_method = serializers.ChoiceField(choices=['razorpay', 'cod'], default='cod')

    class Meta:
        model = Order
        fields = ('shipping_address', 'shipping_city', 'shipping_state', 
                  'shipping_zip_code', 'shipping_phone', 'payment_method', 'notes')

