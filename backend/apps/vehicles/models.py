from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class BodyType(models.TextChoices):
    STANDARD = "standard", _("Standard (dry van)")
    REFRIGERATED = "refrigerated", _("Refrigerated")
    FLATBED = "flatbed", _("Flatbed")
    LOWBED = "lowbed", _("Lowbed")
    TANKER = "tanker", _("Tanker")
    CONTAINER = "container", _("Container carrier")
    CURTAIN_SIDE = "curtain_side", _("Curtain side")
    TIPPER = "tipper", _("Tipper / dump")
    CAR_CARRIER = "car_carrier", _("Car carrier")
    LIVESTOCK = "livestock", _("Livestock")


class VehicleSize(models.TextChoices):
    SMALL = "small", _("Small (up to 3 tons)")
    MEDIUM = "medium", _("Medium (3 to 10 tons)")
    LARGE = "large", _("Large (10 to 25 tons)")
    HEAVY = "heavy", _("Heavy trailer (25+ tons)")


class Vehicle(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vehicles",
        limit_choices_to={"role": "transporter"},
    )
    body_type = models.CharField(_("body type"), max_length=20, choices=BodyType.choices)
    size = models.CharField(_("size class"), max_length=10, choices=VehicleSize.choices)

    make = models.CharField(_("make"), max_length=60)
    model_name = models.CharField(_("model"), max_length=60)
    manufacture_year = models.PositiveSmallIntegerField(
        _("year"), validators=[MinValueValidator(1990), MaxValueValidator(2100)]
    )
    plate_number = models.CharField(_("plate number"), max_length=20, unique=True)

    capacity_tons = models.DecimalField(
        _("payload capacity (tons)"),
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0.1)],
    )
    capacity_volume_m3 = models.DecimalField(
        _("load volume (m³)"),
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.1)],
    )
    bed_length_m = models.DecimalField(
        _("bed length (m)"), max_digits=5, decimal_places=2, null=True, blank=True
    )

    has_tail_lift = models.BooleanField(_("tail lift"), default=False)
    has_gps_tracking = models.BooleanField(_("GPS tracking"), default=False)
    min_temperature_c = models.SmallIntegerField(
        _("minimum temperature (°C)"),
        null=True,
        blank=True,
        help_text=_("Refrigerated vehicles only."),
    )
    max_temperature_c = models.SmallIntegerField(
        _("maximum temperature (°C)"), null=True, blank=True
    )

    base_city = models.CharField(_("base city"), max_length=80)
    operating_regions = models.CharField(
        _("operating regions"),
        max_length=255,
        blank=True,
        help_text=_("Comma separated list of cities or regions served."),
    )
    price_per_km = models.DecimalField(
        _("indicative price per km (SAR)"),
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(_("listed"), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("vehicle")
        verbose_name_plural = _("vehicles")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["body_type", "size"]),
            models.Index(fields=["base_city"]),
        ]

    def __str__(self):
        return f"{self.make} {self.model_name} ({self.plate_number})"

    @property
    def is_refrigerated(self):
        return self.body_type == BodyType.REFRIGERATED
