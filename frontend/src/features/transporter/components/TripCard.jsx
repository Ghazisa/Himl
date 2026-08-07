import { useTranslation } from "react-i18next";
import { Button, Card, CityPair, StatusBadge } from "@/components/ui";
import { nextTripStatus } from "../api";

export function TripCard({ trip, onAdvance, busy, emphasised = false }) {
  const { t } = useTranslation();
  const canAdvance = Boolean(onAdvance) && trip.status !== "delivered";

  return (
    <Card className={`flex flex-col gap-3 ${emphasised ? "border-s-4 border-s-sa-700" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">
          <CityPair from={trip.request.pickup_city} to={trip.request.dropoff_city} />
        </h3>
        <StatusBadge status={trip.status} />
      </div>

      <p className="text-sm text-gray-600">{trip.request.cargo_description}</p>

      {trip.agreed_price && (
        <p className="text-sm font-semibold text-sa-800">
          {t("trips.agreedPrice")}: {trip.agreed_price} {t("common.sar")}
        </p>
      )}

      {canAdvance && (
        <div>
          <Button
            disabled={busy}
            onClick={() => onAdvance({ id: trip.id, status: nextTripStatus(trip.status) })}
          >
            {trip.status === "scheduled" ? t("trips.start") : t("trips.deliver")}
          </Button>
        </div>
      )}
    </Card>
  );
}
