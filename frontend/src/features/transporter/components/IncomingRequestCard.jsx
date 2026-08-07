import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button, Card, CityPair, StatusBadge } from "@/components/ui";

export function IncomingRequestCard({ request, onRespond, busy }) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">
          <CityPair from={request.pickup_city} to={request.dropoff_city} />
        </h3>
        <StatusBadge status={request.status} />
      </div>

      <p className="text-sm text-gray-600">{request.cargo_description}</p>

      <dl className="grid grid-cols-2 gap-3 text-xs text-gray-600 sm:grid-cols-4">
        <div>
          <dt className="font-medium text-gray-900">{t("transporter.shipper")}</dt>
          <dd>{request.shipper_company || request.shipper_name}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">{t("transporter.weight")}</dt>
          <dd>
            {request.weight_tons} {t("shipper.tons")}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">{t("transporter.date")}</dt>
          <dd>{request.pickup_date}</dd>
        </div>
        {request.offered_price && (
          <div>
            <dt className="font-medium text-gray-900">{t("transporter.price")}</dt>
            <dd className="font-semibold text-sa-800">
              {request.offered_price} {t("common.sar")}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-3">
        <Button icon={Check} disabled={busy} onClick={() => onRespond(request.id, "accept")}>
          {t("transporter.accept")}
        </Button>
        <Button
          icon={X}
          variant="danger"
          disabled={busy}
          onClick={() => onRespond(request.id, "decline")}
        >
          {t("transporter.decline")}
        </Button>
      </div>
    </Card>
  );
}
