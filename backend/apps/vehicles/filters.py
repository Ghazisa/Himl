import django_filters as filters
from django.db.models import Q

from .models import BodyType, Vehicle, VehicleSize


class VehicleSearchFilter(filters.FilterSet):
    """Filters backing the shipper's cargo search form and sidebar facets."""

    body_type = filters.MultipleChoiceFilter(choices=BodyType.choices)
    size = filters.MultipleChoiceFilter(choices=VehicleSize.choices)
    min_capacity_tons = filters.NumberFilter(field_name="capacity_tons", lookup_expr="gte")
    max_capacity_tons = filters.NumberFilter(field_name="capacity_tons", lookup_expr="lte")
    min_volume_m3 = filters.NumberFilter(field_name="capacity_volume_m3", lookup_expr="gte")
    pickup_city = filters.CharFilter(method="filter_serves_city")
    has_tail_lift = filters.BooleanFilter()
    has_gps_tracking = filters.BooleanFilter()
    online_only = filters.BooleanFilter(method="filter_online_only")
    max_price_per_km = filters.NumberFilter(field_name="price_per_km", lookup_expr="lte")

    class Meta:
        model = Vehicle
        fields = ["body_type", "size", "has_tail_lift", "has_gps_tracking"]

    def filter_serves_city(self, queryset, name, value):
        """A vehicle serves a city if it is based there or lists it as a region."""
        if not value:
            return queryset
        return queryset.filter(
            Q(base_city__icontains=value) | Q(operating_regions__icontains=value)
        )

    def filter_online_only(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(owner__transporter_profile__is_online=True)
