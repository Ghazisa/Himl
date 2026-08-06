from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.shipments.views import ShipmentRequestViewSet, TripViewSet, shipment_options
from apps.vehicles.views import MyVehicleViewSet, VehicleSearchViewSet, vehicle_options

router = DefaultRouter()
router.register("vehicles/mine", MyVehicleViewSet, basename="my-vehicles")
router.register("vehicles/search", VehicleSearchViewSet, basename="vehicle-search")
router.register("requests", ShipmentRequestViewSet, basename="requests")
router.register("trips", TripViewSet, basename="trips")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/options/vehicles/", vehicle_options, name="vehicle-options"),
    path("api/options/shipments/", shipment_options, name="shipment-options"),
    path("api/", include(router.urls)),
]
