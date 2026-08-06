from rest_framework.permissions import BasePermission

from .models import Role


class IsVerified(BasePermission):
    message = "Please verify your email address before continuing."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_email_verified)


class IsShipper(IsVerified):
    message = "Only shipper accounts can perform this action."

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == Role.SHIPPER


class IsTransporter(IsVerified):
    message = "Only transporter accounts can perform this action."

    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == Role.TRANSPORTER
