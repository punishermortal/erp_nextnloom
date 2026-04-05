from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Order, OrderItem
from .delivery import get_delivery_status, cancel_delivery_order


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price', 'total', 'item_total_display')
    can_delete = False
    
    def item_total_display(self, obj):
        return format_html('₹{}', obj.total)
    item_total_display.short_description = 'Total'


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status_badge', 'payment_status_badge', 'payment_method', 'total_display', 'delivery_tracking_link', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'created_at', 'delivery_status')
    search_fields = ('order_number', 'user__email', 'user__username', 'delivery_tracking_id', 'razorpay_order_id', 'razorpay_payment_id', 'shipping_phone', 'shipping_city', 'shipping_address')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'total_display', 'delivery_tracking_link')
    inlines = [OrderItemInline]
    date_hierarchy = 'created_at'
    list_per_page = 25
    actions = ['mark_processing', 'mark_shipped', 'mark_delivered', 'mark_cancelled', 'refresh_delivery_status']
    
    def get_queryset(self, request):
        """Ensure all orders are visible in admin panel"""
        qs = super().get_queryset(request)
        # Return all orders - no filtering
        # Use select_related and prefetch_related for better performance
        return qs.select_related('user').prefetch_related('items', 'items__product', 'items__vendor')
    
    def changelist_view(self, request, extra_context=None):
        """Override to ensure all orders are shown"""
        extra_context = extra_context or {}
        # Get total count of orders
        total_orders = Order.objects.count()
        extra_context['total_orders'] = total_orders
        return super().changelist_view(request, extra_context=extra_context)
    
    def has_add_permission(self, request):
        """Allow admins to add orders manually if needed"""
        return request.user.is_staff
    
    def has_change_permission(self, request, obj=None):
        """Allow admins to change orders"""
        return request.user.is_staff
    
    def has_delete_permission(self, request, obj=None):
        """Allow admins to delete orders"""
        return request.user.is_staff
    
    def has_view_permission(self, request, obj=None):
        """Allow admins to view all orders"""
        return request.user.is_staff
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'user', 'status', 'created_at', 'updated_at')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'payment_status', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')
        }),
        ('Order Totals', {
            'fields': ('subtotal', 'shipping_cost', 'total_display')
        }),
        ('Shipping Information', {
            'fields': ('shipping_address', 'shipping_city', 'shipping_state', 'shipping_zip_code', 'shipping_phone')
        }),
        ('Delivery Information', {
            'fields': ('delivery_partner_order_id', 'delivery_tracking_link', 'delivery_tracking_id', 'delivery_status')
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj:  # editing an existing object
            readonly.extend(['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'])
        return readonly
    
    def status_badge(self, obj):
        colors = {
            'pending': 'gray',
            'processing': 'blue',
            'shipped': 'purple',
            'delivered': 'green',
            'cancelled': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def payment_status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'paid': 'green',
            'failed': 'red',
            'refunded': 'gray'
        }
        color = colors.get(obj.payment_status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_payment_status_display()
        )
    payment_status_badge.short_description = 'Payment'
    
    def total_display(self, obj):
        return format_html('₹{}', obj.total)
    total_display.short_description = 'Total'
    
    def delivery_tracking_link(self, obj):
        if obj.delivery_tracking_id:
            return format_html(
                '<a href="https://www.delhivery.com/track/package/{}" target="_blank" style="color: blue;">{}</a>',
                obj.delivery_tracking_id, obj.delivery_tracking_id
            )
        return '-'
    delivery_tracking_link.short_description = 'Tracking ID'
    
    # Admin Actions
    def mark_processing(self, request, queryset):
        updated = queryset.update(status='processing')
        self.message_user(request, f'{updated} orders marked as processing.')
    mark_processing.short_description = 'Mark selected orders as processing'
    
    def mark_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'{updated} orders marked as shipped.')
    mark_shipped.short_description = 'Mark selected orders as shipped'
    
    def mark_delivered(self, request, queryset):
        updated = queryset.update(status='delivered', payment_status='paid')
        self.message_user(request, f'{updated} orders marked as delivered.')
    mark_delivered.short_description = 'Mark selected orders as delivered'
    
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} orders marked as cancelled.')
    mark_cancelled.short_description = 'Mark selected orders as cancelled'
    
    def refresh_delivery_status(self, request, queryset):
        updated = 0
        for order in queryset:
            if order.delivery_tracking_id:
                status_data = get_delivery_status(order.delivery_tracking_id)
                if status_data:
                    order.delivery_status = status_data.get('status', order.delivery_status)
                    order.save()
                    updated += 1
        self.message_user(request, f'Refreshed delivery status for {updated} orders.')
    refresh_delivery_status.short_description = 'Refresh delivery status from Delhivery'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_link', 'product_link', 'quantity', 'price_display', 'total_display', 'created_at')
    list_filter = ('order__created_at', 'order__status', 'order__payment_status', 'product__category')
    search_fields = ('order__order_number', 'product__name')
    readonly_fields = ('order', 'product', 'quantity', 'price', 'total')
    list_per_page = 25
    
    def order_link(self, obj):
        url = reverse('admin:orders_order_change', args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_link.short_description = 'Order'
    
    def product_link(self, obj):
        url = reverse('admin:products_product_change', args=[obj.product.id])
        return format_html('<a href="{}">{}</a>', url, obj.product.name)
    product_link.short_description = 'Product'
    
    def price_display(self, obj):
        return format_html('₹{}', obj.price)
    price_display.short_description = 'Price'
    
    def total_display(self, obj):
        return format_html('₹{}', obj.total)
    total_display.short_description = 'Total'
    
    def created_at(self, obj):
        return obj.order.created_at
    created_at.short_description = 'Order Date'

