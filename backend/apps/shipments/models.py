from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.vehicles.models import BodyType, Vehicle


class CargoType(models.TextChoices):
    GENERAL = "general", _("General goods")
    FOODSTUFF = "foodstuff", _("Foodstuff")
    PERISHABLE = "perishable", _("Perishable / chilled")
    CONSTRUCTION = "construction", _("Construction materials")
    FURNITURE = "furniture", _("Furniture")
    ELECTRONICS = "electronics", _("Electronics")
    LIVESTOCK = "livestock", _("Livestock")
    HAZARDOUS = "hazardous", _("Hazardous materials")
    VEHICLES = "vehicles", _("Vehicles")


class RequestStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    ACCEPTED = "accepted", _("Accepted")
    DECLINED = "declined", _("Declined")
    CANCELLED = "cancelled", _("Cancelled")


class ShipmentRequest(models.Model):
    shipper = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shipment_requests",
        limit_choices_to={"role": "shipper"},
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="shipment_requests"
    )
    transporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="incoming_requests",
        limit_choices_to={"role": "transporter"},
    )

    cargo_type = models.CharField(
        _("cargo type"), max_length=20, choices=CargoType.choices, default=CargoType.GENERAL
    )
    cargo_description = models.TextField(_("cargo description"), max_length=1000)
    weight_tons = models.DecimalField(
        _("weight (tons)"),
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    volume_m3 = models.DecimalField(
        _("volume (m³)"), max_digits=7, decimal_places=2, null=True, blank=True
    )
    required_body_type = models.CharField(
        _("required body type"), max_length=20, choices=BodyType.choices, blank=True
    )

    pickup_city = models.CharField(_("pickup city"), max_length=80)
    pickup_address = models.CharField(_("pickup address"), max_length=255)
    dropoff_city = models.CharField(_("drop-off city"), max_length=80)
    dropoff_address = models.CharField(_("drop-off address"), max_length=255)
    pickup_date = models.DateField(_("preferred pickup date"))

    offered_price = models.DecimalField(
        _("offered price (SAR)"),
        max_digits=9,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    notes = models.CharField(_("notes"), max_length=500, blank=True)

    status = models.CharField(
        _("status"), max_length=12, choices=RequestStatus.choices, default=RequestStatus.PENDING
    )
    decline_reason = models.CharField(_("decline reason"), max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("shipment request")
        verbose_name_plural = _("shipment requests")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["transporter", "status"]),
            models.Index(fields=["shipper", "status"]),
        ]

    def __str__(self):
        return f"{self.pickup_city} → {self.dropoff_city} ({self.get_status_display()})"

    @property
    def is_open(self):
        return self.status == RequestStatus.PENDING


class TripStatus(models.TextChoices):
    SCHEDULED = "scheduled", _("Scheduled")
    IN_TRANSIT = "in_transit", _("In transit")
    DELIVERED = "delivered", _("Delivered")
    CANCELLED = "cancelled", _("Cancelled")


class Trip(models.Model):
    request = models.OneToOneField(
        ShipmentRequest, on_delete=models.CASCADE, related_name="trip"
    )
    status = models.CharField(
        _("status"), max_length=12, choices=TripStatus.choices, default=TripStatus.SCHEDULED
    )
    agreed_price = models.DecimalField(
        _("agreed price (SAR)"), max_digits=9, decimal_places=2, null=True, blank=True
    )
    started_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("trip")
        verbose_name_plural = _("trips")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip #{self.pk} — {self.get_status_display()}"

    def advance_to(self, new_status):
        self.status = new_status
        if new_status == TripStatus.IN_TRANSIT and self.started_at is None:
            self.started_at = timezone.now()
        if new_status == TripStatus.DELIVERED and self.delivered_at is None:
            self.delivered_at = timezone.now()
        self.save(update_fields=["status", "started_at", "delivered_at"])
