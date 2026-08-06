from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import EmailOTP, ShipperProfile, TransporterProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "get_full_name", "phone", "role", "is_email_verified", "is_active")
    list_filter = ("role", "is_email_verified", "is_active", "is_staff")
    search_fields = ("email", "phone", "first_name", "last_name")
    ordering = ("-date_joined",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "phone", "preferred_language")}),
        (_("Role & status"), {"fields": ("role", "is_email_verified", "is_active", "is_staff", "is_superuser")}),
        (_("Permissions"), {"fields": ("groups", "user_permissions")}),
        (_("Dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "phone", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )


@admin.register(ShipperProfile)
class ShipperProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "city")
    search_fields = ("company_name", "user__email")


@admin.register(TransporterProfile)
class TransporterProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "is_online", "completed_trips", "rating")
    list_filter = ("is_online",)
    search_fields = ("user__email", "city")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "created_at", "expires_at", "consumed_at", "attempts")
    list_filter = ("purpose",)
    readonly_fields = ("code_hash",)
