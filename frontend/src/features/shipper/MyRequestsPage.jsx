import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Inbox, Send } from "lucide-react";
import { Button, Card, CityPair, EmptyState, PageHeader, Spinner, StatusBadge } from "@/components/ui";
import { readErrors } from "@/lib/api";
import { cancelRequest, fetchMyRequests } from "./api";

export function MyRequestsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: requests, isPending } = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: fetchMyRequests,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requests"] }),
    onError: (error) => toast.error(readErrors(error)[0]),
  });

  if (isPending) return <Spinner />;

  return (
    <>
      <PageHeader icon={Send} title={t("requests.title")} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {requests.length === 0 ? (
          <EmptyState icon={Inbox}>{t("requests.empty")}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {requests.map((request) => (
              <li key={request.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">
                      <CityPair from={request.pickup_city} to={request.dropoff_city} />
                    </h2>
                    <StatusBadge status={request.status} />
                  </div>

                  <p className="text-sm text-gray-600">{request.cargo_description}</p>

                  <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
                    <div>
                      <dt className="font-medium text-gray-900">{t("requests.carrier")}</dt>
                      <dd>{request.transporter_name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">{t("shipper.weight")}</dt>
                      <dd>{request.weight_tons}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">{t("shipper.pickupDate")}</dt>
                      <dd>{request.pickup_date}</dd>
                    </div>
                    {request.offered_price && (
                      <div>
                        <dt className="font-medium text-gray-900">{t("shipper.offeredPrice")}</dt>
                        <dd>
                          {request.offered_price} {t("common.sar")}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {request.status === "pending" && (
                    <div>
                      <Button
                        variant="danger"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(request.id)}
                      >
                        {t("requests.cancel")}
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
