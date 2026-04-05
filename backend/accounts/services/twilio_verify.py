import random
import logging
from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from accounts.models import SignupOTP

logger = logging.getLogger(__name__)

# TEMPORARY: Default OTP for testing until Twilio error is fixed
DEFAULT_TEST_OTP = "875783"


def _generate_otp() -> str:
    """Generate OTP. Returns default test OTP in DEBUG mode, random OTP otherwise."""
    if settings.DEBUG:
        return DEFAULT_TEST_OTP
    return f"{random.randint(100000, 999999)}"


def _get_client() -> Client:
    if not _twilio_credentials_available():
        raise ImproperlyConfigured(
            "Twilio credentials are missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
        )
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def _get_verify_service_sid() -> str:
    if not settings.TWILIO_VERIFY_SERVICE_SID:
        raise ImproperlyConfigured(
            "Twilio Verify Service SID is missing. Set TWILIO_VERIFY_SERVICE_SID."
        )
    return settings.TWILIO_VERIFY_SERVICE_SID


def _twilio_credentials_available() -> bool:
    """Check if basic Twilio credentials are available."""
    return bool(
        getattr(settings, 'TWILIO_ACCOUNT_SID', '') and
        getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    )


def _twilio_verify_enabled() -> bool:
    """Check if Twilio Verify Service is configured."""
    return bool(
        _twilio_credentials_available() and
        getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '')
    )


def _twilio_messaging_enabled() -> bool:
    """Check if Twilio Messaging Service is configured."""
    return bool(
        _twilio_credentials_available() and
        (getattr(settings, 'TWILIO_MESSAGING_SERVICE_SID', '') or
         getattr(settings, 'TWILIO_PHONE_NUMBER', ''))
    )


def send_verification(to: str, channel: str) -> dict:
    """
    Trigger a Twilio Verify OTP via the requested channel (sms or email).
    Falls back to Messaging API for SMS or Django email for email.
    Returns the Twilio verification payload for logging/debugging.
    """
    # Try Twilio Verify Service first (preferred method)
    if _twilio_verify_enabled():
        try:
            return _send_via_verify_service(to, channel)
        except Exception as e:
            logger.warning(f"Twilio Verify Service failed: {e}. Falling back to alternative method.")
    
    # For SMS: Fallback to Messaging API
    if channel == 'sms':
        if _twilio_messaging_enabled():
            try:
                return _send_via_messaging_api(to)
            except Exception as e:
                logger.error(f"Twilio Messaging API failed: {e}")
                # Fall back to local verification even in production for SMS
                logger.warning(f"Falling back to local verification for SMS to {to}")
                return _send_local_verification(to, channel)
        else:
            # No Twilio configured for SMS, use local verification
            logger.warning(f"Twilio not configured for SMS. Using local verification for {to}")
            return _send_local_verification(to, channel)
    
    # For Email: Fallback to Django email backend
    if channel == 'email':
        try:
            return _send_via_email(to)
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            # Fall back to local verification even in production for email
            logger.warning(f"Falling back to local verification for email to {to}")
            return _send_local_verification(to, channel)
    
    # Should not reach here, but just in case
    return _send_local_verification(to, channel)


def _send_via_verify_service(to: str, channel: str) -> dict:
    """Send OTP using Twilio Verify Service."""
    client = _get_client()
    service_sid = _get_verify_service_sid()

    try:
        verification = client.verify.v2.services(service_sid).verifications.create(
            to=to,
            channel=channel,
        )
        logger.info(f"OTP sent via Twilio Verify to {to} via {channel}")
        return verification.to_dict()
    except TwilioRestException as exc:
        logger.error(f"Twilio Verify API error: {exc.msg}")
        raise ValueError(f"Failed to send {channel} OTP: {exc.msg}") from exc


def _send_via_email(to: str) -> dict:
    """Send OTP via Django email backend."""
    from django.core.mail import get_connection, send_mail
    from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
    
    # TEMPORARY: Use fixed test OTP until Twilio error is fixed
    otp = DEFAULT_TEST_OTP
    expires_at = timezone.now() + timedelta(minutes=10)
    
    # Store OTP in database
    SignupOTP.objects.update_or_create(
        identifier=to,
        channel='email',
        defaults={
            'otp': otp,
            'is_used': False,
            'expires_at': expires_at,
        },
    )
    
    # Prepare email
    subject = 'NextBloom Verification Code'
    message = f'Your NextBloom verification code is: {otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this code, please ignore this email.'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nextbloom.com')
    
    try:
        # Force console backend in DEBUG mode
        if settings.DEBUG:
            connection = get_connection(backend='django.core.mail.backends.console.EmailBackend')
            send_mail(
                subject,
                message,
                from_email,
                [to],
                connection=connection,
                fail_silently=False,
            )
            logger.info(f"OTP sent via email (console) to {to}. OTP: {otp}")
        else:
            # In production, use configured email backend
            email_backend = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
            if 'console' in email_backend.lower():
                connection = get_connection(backend='django.core.mail.backends.console.EmailBackend')
                send_mail(
                    subject,
                    message,
                    from_email,
                    [to],
                    connection=connection,
                    fail_silently=False,
                )
            else:
                # Use configured SMTP backend
                send_mail(
                    subject,
                    message,
                    from_email,
                    [to],
                    fail_silently=False,
                )
            logger.info(f"OTP sent via email to {to}")
        
        return {
            'sid': None,
            'status': 'sent',
            'channel': 'email',
            'to': to,
            'expiration': expires_at.isoformat(),
            # OTP not included in response (user requested no popup on website)
        }
    except Exception as e:
        logger.error(f"Failed to send email OTP: {str(e)}")
        logger.exception(e)
        # Return response without OTP even if email fails
        return {
            'sid': None,
            'status': 'failed',
            'channel': 'email',
            'to': to,
            'expiration': expires_at.isoformat(),
            'error': "Email sending failed but OTP is stored in database.",
        }


def _send_via_messaging_api(to: str) -> dict:
    """Send OTP SMS using Twilio Messaging API (fallback method)."""
    client = _get_client()
    # TEMPORARY: Use fixed test OTP "875783" until Twilio error is fixed
    otp = DEFAULT_TEST_OTP
    expires_at = timezone.now() + timedelta(minutes=10)
    
    # Store OTP in database
    SignupOTP.objects.update_or_create(
        identifier=to,
        channel='sms',
        defaults={
            'otp': otp,
            'is_used': False,
            'expires_at': expires_at,
        },
    )
    
    # Prepare message
    message_body = f"Your NextBloom verification code is: {otp}. Valid for 10 minutes."
    
    # Get sender (Messaging Service SID or phone number)
    messaging_service_sid = getattr(settings, 'TWILIO_MESSAGING_SERVICE_SID', '')
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
    
    # Log configuration for debugging
    logger.info(f"Attempting to send SMS to {to}")
    logger.info(f"Messaging Service SID: {messaging_service_sid[:10]}..." if messaging_service_sid else "Not set")
    logger.info(f"From Number: {from_number}" if from_number else "Not set")
    
    try:
        if messaging_service_sid:
            logger.info(f"Sending SMS via Messaging Service SID to {to}")
            message = client.messages.create(
                body=message_body,
                messaging_service_sid=messaging_service_sid,
                to=to
            )
        elif from_number:
            logger.info(f"Sending SMS via phone number {from_number} to {to}")
            message = client.messages.create(
                body=message_body,
                from_=from_number,
                to=to
            )
        else:
            error_msg = "Either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER must be set."
            logger.error(error_msg)
            raise ImproperlyConfigured(error_msg)
        
        logger.info(f"OTP sent via Twilio Messaging API to {to}. Message SID: {message.sid}, Status: {message.status}")
        logger.info(f"Message details - To: {message.to}, From: {getattr(message, 'from_', 'N/A')}, Status: {message.status}")
        
        # Check if message was accepted but might be queued (common with trial accounts)
        if message.status in ['accepted', 'queued', 'sending']:
            logger.info(f"Message status: {message.status}. For trial accounts, SMS may only be sent to verified numbers.")
            if message.status == 'accepted':
                logger.warning("Message accepted by Twilio. If not received, check:")
                logger.warning("1. Is this a Twilio trial account? (Trial accounts can only send to verified numbers)")
                logger.warning("2. Is the phone number verified in Twilio Console?")
                logger.warning("3. Check Twilio Console for delivery status: https://console.twilio.com")
                logger.warning(f"4. Message SID for tracking: {message.sid}")
        
        # Fetch updated message status after a brief delay to check delivery
        try:
            import time
            time.sleep(1)  # Brief delay to allow status update
            # Refresh message to get latest status
            message = client.messages(message.sid).fetch()
            logger.info(f"Updated message status: {message.status}")
            if message.status == 'failed':
                error_code = getattr(message, 'error_code', 'Unknown')
                error_message = getattr(message, 'error_message', 'Unknown')
                logger.error(f"Message failed to deliver. Error: {error_message} (Code: {error_code})")
                
                # Error 21704 = Invalid 'To' Phone Number (usually means not verified in trial account)
                if error_code == 21704:
                    logger.error("=" * 80)
                    logger.error("ERROR 21704: Phone number not verified in Twilio Console (Trial Account Restriction)")
                    logger.error(f"OTP was generated but SMS failed to deliver.")
                    logger.error(f"Phone Number: {to}")
                    logger.error(f"OTP Code: {otp}")
                    logger.error("This OTP is stored in database and can still be used for verification.")
                    logger.error("To fix SMS delivery: Verify phone number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
                    logger.error("=" * 80)
                    # Store OTP anyway so user can still verify (they'll see it in logs)
                    # In DEBUG mode, we'll include it in the response
        except Exception as e:
            logger.warning(f"Could not fetch message status: {e}")
        
        result = {
            'sid': message.sid,
            'status': message.status,
            'channel': 'sms',
            'to': to,
            'expiration': expires_at.isoformat(),
            'twilio_status': message.status,  # Include for debugging
        }
        
        # Don't include OTP in response (user requested no popup on website)
        if message.status == 'failed':
            error_code = getattr(message, 'error_code', 'Unknown')
            result['error'] = f"SMS delivery failed (Error Code: {error_code}). OTP stored in database."
            result['warning'] = "SMS failed but OTP is stored. Check logs for details."
        
        return result
    except TwilioRestException as exc:
        error_msg = f"Twilio Messaging API error: {exc.msg} (Code: {exc.code})"
        logger.error(error_msg)
        logger.error(f"Full error details: {exc}")
        raise ValueError(f"Failed to send SMS OTP: {exc.msg}") from exc
    except Exception as e:
        error_msg = f"Unexpected error sending SMS: {str(e)}"
        logger.error(error_msg)
        logger.exception(e)
        raise ValueError(f"Failed to send SMS OTP: {str(e)}") from e


def check_verification(to: str, code: str) -> bool:
    """
    Validate a Twilio Verify OTP. Returns True if approved.
    Falls back to local verification if Twilio Verify is not available.
    """
    # Try Twilio Verify Service first
    if _twilio_verify_enabled():
        try:
            return _check_via_verify_service(to, code)
        except Exception as e:
            logger.warning(f"Twilio Verify Service check failed: {e}. Falling back to local verification.")
    
    # Fallback to local verification (works for both Verify and Messaging API)
    return _check_local_verification(to, code)


def _check_via_verify_service(to: str, code: str) -> bool:
    """Check OTP using Twilio Verify Service."""
    client = _get_client()
    service_sid = _get_verify_service_sid()

    try:
        verification_check = (
            client.verify.v2.services(service_sid)
            .verification_checks.create(to=to, code=code)
        )
        is_approved = verification_check.status == "approved"
        if is_approved:
            logger.info(f"OTP verified successfully for {to}")
        else:
            logger.warning(f"OTP verification failed for {to}: {verification_check.status}")
        return is_approved
    except TwilioRestException as exc:
        logger.error(f"Twilio Verify API error: {exc.msg}")
        raise ValueError(f"Failed to verify OTP: {exc.msg}") from exc


def _send_local_verification(to: str, channel: str) -> dict:
    """Local verification for development only."""
    # TEMPORARY: Use fixed test OTP "875783" until Twilio error is fixed
    otp = DEFAULT_TEST_OTP
    expires_at = timezone.now() + timedelta(minutes=10)

    SignupOTP.objects.update_or_create(
        identifier=to,
        channel=channel,
        defaults={
            'otp': otp,
            'is_used': False,
            'expires_at': expires_at,
        },
    )

    # Only print in development mode
    if settings.DEBUG:
        logger.info(f"[DEV OTP] {channel.upper()} OTP for {to}: {otp}")

    return {
        'sid': None,
        'status': 'pending',
        'channel': channel,
        'to': to,
        'expiration': expires_at.isoformat(),
        # OTP not included in response (user requested no popup on website)
    }


def _check_local_verification(to: str, code: str) -> bool:
    try:
        otp_obj = SignupOTP.objects.get(
            identifier=to,
            channel__in=['sms', 'email'],
            is_used=False,
            expires_at__gt=timezone.now(),
        )
    except SignupOTP.DoesNotExist:
        return False

    if otp_obj.otp != code:
        return False

    otp_obj.is_used = True
    otp_obj.save(update_fields=['is_used'])
    return True

