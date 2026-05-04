"""
agricare/apps/admin_panel/permissions.py

Custom DRF permissions for the admin dashboard.
Only users with is_staff=True OR role='admin' can access these APIs.
"""

from rest_framework.permissions import BasePermission


class IsAdminDashboardUser(BasePermission):
    """
    Grants access only to superusers or users with role='admin'.
    Use this on ALL admin dashboard API views.
    """
    message = "You do not have permission to access the admin dashboard."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', '') == 'admin')
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level: owner can edit their own resource; admin can edit anything.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.is_superuser:
            return True
        return getattr(obj, 'user', None) == request.user or getattr(obj, 'seller', None) == request.user
