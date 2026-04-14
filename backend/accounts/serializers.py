from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ImproperlyConfigured
from rest_framework import serializers
import re
from .models import User, VendorProfile, UserRoles
from .services import check_verification


class VendorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorProfile
        fields = (
            'business_name',
            'business_email',
            'business_phone',
            'logo',
            'description',
            'address',
            'default_commission_rate',
        )


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    phone_otp = serializers.CharField(write_only=True, required=True, max_length=6)
    email_otp = serializers.CharField(write_only=True, required=True, max_length=6)
    role = serializers.ChoiceField(
        choices=[UserRoles.CUSTOMER, UserRoles.VENDOR, UserRoles.ADMIN],
        default=UserRoles.CUSTOMER,
    )
    vendor_profile = VendorProfileSerializer(write_only=True, required=False)
    admin_secret = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'email',
            'username',
            'password',
            'password2',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'phone_otp',
            'email_otp',
            'vendor_profile',
            'admin_secret',
        )

    def validate_phone_number(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        # Normalize phone number
        phone = re.sub(r'[^\d+]', '', value)
        if not phone.startswith('+'):
            if len(phone) == 10:
                phone = '+91' + phone
            else:
                raise serializers.ValidationError("Invalid phone number format. Please enter a 10-digit number or with country code.")
        
        # Check if phone number already exists
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError("This phone number is already registered. Please login or use a different number.")
        
        return phone

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered. Please login or use a different email.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match. Please enter the same password in both fields."})

        phone_verified = self._verify_phone(attrs['phone_number'], attrs['phone_otp'])
        if not phone_verified:
            raise serializers.ValidationError({"phone_otp": "Phone OTP is invalid or expired. Please request a new OTP."})

        email = attrs.get('email')
        if not email:
            raise serializers.ValidationError({"email": "Email is required for signup verification."})

        email_verified = self._verify_email(email, attrs['email_otp'])
        if not email_verified:
            raise serializers.ValidationError({"email_otp": "Email OTP is invalid or expired. Please request a new OTP."})

        role = attrs.get('role', UserRoles.CUSTOMER)
        if role == UserRoles.ADMIN:
            submitted_secret = self.initial_data.get('admin_secret')
            expected_secret = getattr(settings, 'ADMIN_REGISTRATION_CODE', '')
            if not expected_secret or submitted_secret != expected_secret:
                raise serializers.ValidationError({"admin_secret": "Invalid admin access code. Please contact the administrator."})
        
        if role == UserRoles.VENDOR:
            vendor_profile = attrs.get('vendor_profile')
            if vendor_profile:
                business_name = vendor_profile.get('business_name')
                if not business_name:
                    raise serializers.ValidationError({"vendor_profile": {"business_name": "Business name is required for vendor registration."}})

        return attrs

    def create(self, validated_data):
        vendor_payload = validated_data.pop('vendor_profile', None)
        validated_data.pop('admin_secret', None)
        validated_data.pop('password2')
        validated_data.pop('phone_otp', None)
        validated_data.pop('email_otp', None)
        validated_data['is_phone_verified'] = True
        validated_data['is_email_verified'] = True

        user = User.objects.create_user(**validated_data)

        if user.role == UserRoles.ADMIN and not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])

        if user.role == UserRoles.VENDOR:
            defaults = vendor_payload or {}
            defaults.setdefault('business_name', user.first_name or user.username or (user.email or user.phone_number))
            defaults.setdefault('business_email', user.email)
            defaults.setdefault('business_phone', user.phone_number)
            VendorProfile.objects.update_or_create(
                user=user,
                defaults=defaults,
            )

        return user

    def _verify_phone(self, phone_number, otp):
        try:
            return check_verification(phone_number, otp)
        except (ValueError, ImproperlyConfigured) as exc:
            raise serializers.ValidationError({"phone_otp": str(exc)})

    def _verify_email(self, email, otp):
        try:
            return check_verification(email, otp)
        except (ValueError, ImproperlyConfigured) as exc:
            raise serializers.ValidationError({"email_otp": str(exc)})


class UserSerializer(serializers.ModelSerializer):
    vendor_profile = VendorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'address',
            'city',
            'state',
            'zip_code',
            'is_email_verified',
            'is_phone_verified',
            'vendor_profile',
            'created_at',
        )
        read_only_fields = ('id', 'is_email_verified', 'is_phone_verified', 'role', 'created_at', 'vendor_profile')


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'phone_number',
                  'address', 'city', 'state', 'zip_code')
        read_only_fields = ('id', 'email', 'username', 'phone_number')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords do not match. Please enter the same password in both fields."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("The old password you entered is incorrect. Please try again.")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True, max_length=15)

    def validate_phone_number(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        # Normalize phone number
        phone = re.sub(r'[^\d+]', '', value)
        if not phone.startswith('+'):
            if len(phone) == 10:
                phone = '+91' + phone
            else:
                raise serializers.ValidationError("Invalid phone number format. Please enter a 10-digit number or with country code.")
        return phone


class ResetPasswordSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True, max_length=15)
    otp = serializers.CharField(required=True, max_length=6)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate_phone_number(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        # Normalize phone number
        phone = re.sub(r'[^\d+]', '', value)
        if not phone.startswith('+'):
            if len(phone) == 10:
                phone = '+91' + phone
            else:
                raise serializers.ValidationError("Invalid phone number format. Please enter a 10-digit number or with country code.")
        return phone

    def validate_otp(self, value):
        if not value:
            raise serializers.ValidationError("OTP is required.")
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("OTP must be a 6-digit number.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords do not match. Please enter the same password in both fields."})
        return attrs

