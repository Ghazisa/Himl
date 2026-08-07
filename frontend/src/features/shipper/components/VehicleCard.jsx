import { useTranslation } from "react-i18next";
import { Button, Card } from "@/components/ui";

export function VehicleCard({ vehicle, onRequest, pending }) {
  const { t } = useTranslation();
  const { owner } = vehicle;

  return (
    <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">
            {vehicle.make} {vehicle.model_name}
          </h3>
          <p className="text-xs text-gray-600">
            {t(`options.bodyType.${vehicle.body_type}`)} · {t(`options.size.${vehicle.size}`)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            owner.is_online ? "bg-sa-100 text-sa-900" : "bg-gray-200 text-gray-800"
          }`}
        >
          {owner.is_online ? t("shipper.online") : t("shipper.offline")}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <dt className="font-medium text-gray-900">{t("shipper.capacity")}</dt>
          <dd>
            {vehicle.capacity_tons} {t("shipper.tons")}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">{t("shipper.pickupCity")}</dt>
          <dd>{vehicle.base_city}</dd>
        </div>
        {vehicle.price_per_km && (
          <div>
            <dt className="font-medium text-gray-900">{t("shipper.perKm")}</dt>
            <dd>{vehicle.price_per_km}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-gray-900">{owner.full_name}</dt>
          <dd>
            ★ {owner.rating} · {owner.completed_trips} {t("shipper.trips")}
          </dd>
        </div>
      </dl>

      <Button className="mt-auto" onClick={() => onRequest(vehicle.id)} disabled={pending}>
        {pending ? t("shipper.requesting") : t("shipper.request")}
      </Button>
    </Card>
  );
}
