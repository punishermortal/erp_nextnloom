from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
import random
import re
from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserProfileSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
)
from .models import User, PasswordResetOTP
from .services import send_verification


def _normalize_phone_number(raw_phone):
    if not raw_phone:
        raise ValueError("Phone number is required.")
    phone_number = re.sub(r'[^\d+]', '', raw_phone)
    if not phone_number.startswith('+'):
        if len(phone_number) == 10:
            phone_number = '+91' + phone_number
        else:
            raise ValueError("Invalid phone number format. Please enter a 10-digit number or with country code.")
    return phone_number


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    phone_number = request.data.get('phone_number')
    password = request.data.get('password')
    requested_role = (request.data.get('role') or '').lower()
    
    if not phone_number:
        return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        phone_number = _normalize_phone_number(phone_number)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user with this phone number exists
    user_exists = User.objects.filter(phone_number=phone_number).exists()
    if not user_exists:
        return Response(
            {'error': 'This phone number is not registered. Please sign up first.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Authenticate using phone_number as username (since USERNAME_FIELD is phone_number)
    user = authenticate(username=phone_number, password=password)
    if user:
        if requested_role:
            role_map = {
                'customer': User.role == 'customer',
                'vendor': user.role == 'vendor',
                'admin': user.role == 'admin',
            }
            
            if user.role != requested_role:
                role_name = 'Customer' if requested_role == 'customer' else (
                    'Vendor' if requested_role == 'vendor' else 'Admin'
                )
                return Response(
                    {'error': f'Your account is registered as {user.role.capitalize()}, not {role_name}. Please select the correct portal.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    
    return Response(
        {'error': 'Incorrect password. Please try again or reset your password.'},
        status=status.HTTP_401_UNAUTHORIZED
    )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        phone_number = serializer.validated_data['phone_number']
        
        try:
            user = User.objects.get(phone_number=phone_number)
            # Generate 6-digit OTP
            otp = str(random.randint(100000, 999999))
            
            # Delete old OTPs for this phone number
            PasswordResetOTP.objects.filter(phone_number=phone_number, is_used=False).delete()
            
            # Create new OTP
            otp_obj = PasswordResetOTP.objects.create(
                phone_number=phone_number,
                otp=otp,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
            
            # In production, send OTP via SMS or Email
            # For now, we'll return it in response (remove in production)
            print(f"OTP for {phone_number}: {otp}")  # Remove in production
            
            # Send OTP via email if user has email
            if user.email:
                from django.core.mail import send_mail
                try:
                    send_mail(
                        'Password Reset OTP - NextBloom',
                        f'Your OTP for password reset is: {otp}. This OTP is valid for 10 minutes.',
                        'noreply@nextbloom.com',
                        [user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error sending email: {str(e)}")
            
            return Response({
                'message': 'OTP sent to your registered email',
                'otp': otp  # Remove this in production
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'This phone number is not registered. Please sign up first.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        phone_number = serializer.validated_data['phone_number']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Verify OTP
            otp_obj = PasswordResetOTP.objects.get(
                phone_number=phone_number,
                otp=otp,
                is_used=False,
                expires_at__gt=timezone.now()
            )
            
            # Get user and reset password
            user = User.objects.get(phone_number=phone_number)
            user.set_password(new_password)
            user.save()
            
            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()
            
            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
        except PasswordResetOTP.DoesNotExist:
            return Response({'error': 'Invalid or expired OTP. Please request a new OTP to reset your password.'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User account not found. Please sign up first.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_phone_signup_otp(request):
    phone_number = request.data.get('phone_number')
    if not phone_number:
        return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        phone_number = _normalize_phone_number(phone_number)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        verification = send_verification(phone_number, 'sms')
    except ImproperlyConfigured as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Twilio configuration error: {exc}")
        return Response({'error': 'SMS service is not properly configured. Please contact support.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except ValueError as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error sending SMS OTP: {exc}")
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error sending SMS OTP: {exc}")
        return Response({'error': f'Failed to send SMS OTP: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response_data = {'message': 'OTP sent to phone number'}
    # OTP not included in response (user requested no popup on website)
    if isinstance(verification, dict) and verification.get('status') == 'failed':
        response_data['warning'] = 'SMS delivery failed, but OTP is stored in database'

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_email_signup_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        verification = send_verification(email, 'email')
    except ImproperlyConfigured as exc:
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error sending email OTP: {exc}")
        return Response({'error': f'Failed to send email OTP: {str(exc)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response_data = {'message': 'OTP sent to email'}
    # OTP not included in response (user requested no popup on website)

    return Response(response_data, status=status.HTTP_200_OK)

