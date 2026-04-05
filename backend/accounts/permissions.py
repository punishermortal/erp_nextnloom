from rest_framework.permissions import BasePermission

from .models import UserRoles


class IsVendorUser(BasePermission):
    message = "Vendor access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == UserRoles.VENDOR)


class IsAdminUser(BasePermission):
    message = "Admin access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role == UserRoles.ADMIN or user.is_staff or user.is_superuser)
        )

