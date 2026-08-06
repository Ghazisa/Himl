import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Role(models.TextChoices):
    SHIPPER = "shipper", _("Shipper")
    TRANSPORTER = "transporter", _("Transporter")


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Users must have an email address.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_email_verified", True)
        extra.setdefault("role", Role.SHIPPER)
        if extra["is_staff"] is not True or extra["is_superuser"] is not True:
            raise ValueError("Superuser must have is_staff and is_superuser set to True.")
        return self._create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_("email address"), unique=True)
    phone = models.CharField(_("phone number"), max_length=20, unique=True)
    first_name = models.CharField(_("first name"), max_length=60)
    last_name = models.CharField(_("last name"), max_length=60)
    role = models.CharField(_("role"), max_length=20, choices=Role.choices)
    preferred_language = models.CharField(
        _("preferred language"), max_length=5, choices=settings.LANGUAGES, default="ar"
    )

    is_email_verified = models.BooleanField(_("email verified"), default=False)
    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone", "first_name", "last_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    @property
    def is_shipper(self):
        return self.role == Role.SHIPPER

    @property
    def is_transporter(self):
        return self.role == Role.TRANSPORTER


class ShipperProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shipper_profile"
    )
    company_name = models.CharField(_("company name"), max_length=150, blank=True)
    commercial_registration = models.CharField(
        _("commercial registration number"), max_length=30, blank=True
    )
    city = models.CharField(_("city"), max_length=80, blank=True)

    def __str__(self):
        return self.company_name or self.user.get_full_name()


class TransporterProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transporter_profile",
    )
    national_id = models.CharField(_("national ID / Iqama"), max_length=20, blank=True)
    license_number = models.CharField(
        _("driving licence number"), max_length=30, blank=True
    )
    city = models.CharField(_("base city"), max_length=80, blank=True)
    years_of_experience = models.PositiveSmallIntegerField(
        _("years of experience"), default=0
    )
    is_online = models.BooleanField(_("available for work"), default=False)
    last_online_at = models.DateTimeField(_("last went online"), null=True, blank=True)
    rating = models.DecimalField(_("rating"), max_digits=3, decimal_places=2, default=0)
    completed_trips = models.PositiveIntegerField(_("completed trips"), default=0)

    def __str__(self):
        return self.user.get_full_name()

    def set_online(self, online: bool):
        self.is_online = online
        if online:
            self.last_online_at = timezone.now()
        self.save(update_fields=["is_online", "last_online_at"])


class OTPPurpose(models.TextChoices):
    VERIFY_EMAIL = "verify_email", _("Verify email")
    RESET_PASSWORD = "reset_password", _("Reset password")


class EmailOTPManager(models.Manager):
    def issue(self, user, purpose):
        """Invalidate any outstanding codes for this purpose, then mint a fresh one."""
        self.filter(user=user, purpose=purpose, consumed_at__isnull=True).update(
            consumed_at=timezone.now()
        )
        upper_bound = 10**settings.OTP_LENGTH
        raw_code = f"{secrets.randbelow(upper_bound):0{settings.OTP_LENGTH}d}"
        otp = self.create(
            user=user,
            purpose=purpose,
            code_hash=EmailOTP.hash_code(raw_code),
            expires_at=timezone.now() + timedelta(minutes=settings.OTP_TTL_MINUTES),
        )
        return otp, raw_code


class EmailOTP(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otps"
    )
    purpose = models.CharField(max_length=20, choices=OTPPurpose.choices)
    code_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    objects = EmailOTPManager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "purpose", "consumed_at"])]

    def __str__(self):
        return f"{self.get_purpose_display()} for {self.user.email}"

    @staticmethod
    def hash_code(raw_code: str) -> str:
        salted = f"{settings.SECRET_KEY}:{raw_code}".encode()
        return hashlib.sha256(salted).hexdigest()

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_usable(self):
        return (
            self.consumed_at is None
            and not self.is_expired
            and self.attempts < settings.OTP_MAX_ATTEMPTS
        )

    def verify(self, raw_code: str) -> bool:
        if not self.is_usable:
            return False
        self.attempts += 1
        if secrets.compare_digest(self.code_hash, self.hash_code(raw_code)):
            self.consumed_at = timezone.now()
            self.save(update_fields=["attempts", "consumed_at"])
            return True
        self.save(update_fields=["attempts"])
        return False
