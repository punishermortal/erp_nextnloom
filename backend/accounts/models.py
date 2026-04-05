from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
import re


class UserRoles(models.TextChoices):
    CUSTOMER = 'customer', 'Customer'
    VENDOR = 'vendor', 'Vendor'
    ADMIN = 'admin', 'Admin'


class User(AbstractUser):
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRoles.choices, default=UserRoles.CUSTOMER)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.phone_number or self.email or self.username

    def clean(self):
        super().clean()
        if self.phone_number:
            # Remove any non-digit characters except +
            phone = re.sub(r'[^\d+]', '', self.phone_number)
            if not phone.startswith('+'):
                # Assume Indian number if no country code
                if len(phone) == 10:
                    phone = '+91' + phone
            self.phone_number = phone

    def save(self, *args, **kwargs):
        if self.is_superuser or self.is_staff:
            self.role = UserRoles.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_vendor(self):
        return self.role == UserRoles.VENDOR

    @property
    def is_admin_role(self):
        return self.role == UserRoles.ADMIN


class PasswordResetOTP(models.Model):
    phone_number = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number', 'otp']),
        ]

    def __str__(self):
        return f"OTP for {self.phone_number}"


class SignupOTP(models.Model):
    CHANNEL_CHOICES = (
        ('sms', 'SMS'),
        ('email', 'Email'),
    )

    identifier = models.CharField(max_length=255)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    otp = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['identifier', 'channel']),
        ]

    def __str__(self):
        return f"{self.channel.upper()} OTP for {self.identifier}"


class VendorProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )
    business_name = models.CharField(max_length=255)
    business_email = models.EmailField(blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    logo = models.ImageField(upload_to='vendors/logos/', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    default_commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name or self.user.get_full_name() or f"Vendor {self.user_id}"

    def touch_updated(self):
        self.updated_at = timezone.now()
        self.save(update_fields=['updated_at'])

