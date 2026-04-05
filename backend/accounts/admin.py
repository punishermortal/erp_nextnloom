from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from .models import User, PasswordResetOTP, SignupOTP, VendorProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'phone_number',
        'email',
        'username',
        'role',
        'full_name',
        'order_count',
        'is_staff',
        'is_active',
        'created_at',
    )
    list_filter = ('role', 'is_staff', 'is_active', 'is_email_verified', 'is_phone_verified', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            'Additional Information',
            {
                'fields': (
                    'role',
                    'phone_number',
                    'address',
                    'city',
                    'state',
                    'zip_code',
                    'is_email_verified',
                    'is_phone_verified',
                )
            },
        ),
    )
    
    def full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else '-'
    full_name.short_description = 'Full Name'
    
    def order_count(self, obj):
        count = obj.orders.count()
        if count > 0:
            url = reverse('admin:orders_order_changelist') + f'?user__id__exact={obj.id}'
            return format_html('<a href="{}">{} Orders</a>', url, count)
        return '0 Orders'
    order_count.short_description = 'Orders'


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'otp', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('phone_number', 'otp')
    readonly_fields = ('phone_number', 'otp', 'created_at', 'expires_at')
    date_hierarchy = 'created_at'
    list_per_page = 25


@admin.register(SignupOTP)
class SignupOTPAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'channel', 'otp', 'is_used', 'expires_at', 'created_at')
    list_filter = ('channel', 'is_used', 'created_at')
    search_fields = ('identifier', 'otp')
    readonly_fields = ('identifier', 'channel', 'otp', 'created_at', 'expires_at')
    date_hierarchy = 'created_at'
    list_per_page = 25


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'user', 'default_commission_rate', 'total_sales', 'total_commission_paid', 'created_at')
    search_fields = ('business_name', 'user__email', 'user__phone_number')
    list_filter = ('created_at',)
    readonly_fields = ('total_sales', 'total_commission_paid', 'created_at', 'updated_at')

