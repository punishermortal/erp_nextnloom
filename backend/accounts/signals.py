from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, VendorProfile, UserRoles


@receiver(post_save, sender=User)
def create_or_update_vendor_profile(sender, instance: User, created: bool, **kwargs):
    """
    Ensure vendor users always have an attached VendorProfile.
    """
    if instance.role == UserRoles.VENDOR:
        VendorProfile.objects.get_or_create(
            user=instance,
            defaults={
                'business_name': instance.username or (instance.email or instance.phone_number or ''),
                'business_email': instance.email,
                'business_phone': instance.phone_number,
            },
        )

