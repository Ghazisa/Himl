import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Inbox, MapPin, Package, Star, Truck, X } from "lucide-react";
import api, { readErrors } from "../api";
import { useAuth } from "../auth";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Route,
  Spinner,
  Stat,
  StatusBadge,
} from "../ui";

const ACTIVE_TRIP_STATUSES = ["scheduled", "in_transit"];

const fetchIncoming = () => api.get("/requests/incoming/").then((r) => r.data.results);
const fetchTrips = () => api.get("/trips/").then((r) => r.data.results);

function reportError(error) {
  const messages = readErrors(error);
  toast.error(messages[0] || "Request failed");
}

function RequestCard({ request, onRespond, busy }) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">
          <Route from={request.pickup_city} to={request.dropoff_city} />
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

export function TransporterDashboard() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const profile = user?.transporter_profile;
  const isOnline = profile?.is_online ?? false;

  // While online the feed behaves like a live queue, so poll for new requests.
  const requestsQuery = useQuery({
    queryKey: ["requests", "incoming"],
    queryFn: fetchIncoming,
    refetchInterval: isOnline ? 15_000 : false,
  });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  const onlineMutation = useMutation({
    mutationFn: (next) => api.post("/auth/me/online/", { is_online: next }).then((r) => r.data),
    onSuccess: (data) => {
      setUser({ ...user, transporter_profile: { ...profile, ...data } });
      toast.success(data.is_online ? t("transporter.onlineState") : t("transporter.offlineState"));
    },
    onError: reportError,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }) => api.post(`/requests/${id}/${action}/`),
    onSuccess: (_data, { action }) => {
      toast.success(action === "accept" ? t("transporter.accepted") : t("transporter.declined"));
      refreshAll();
    },
    onError: reportError,
  });

  const tripMutation = useMutation({
    mutationFn: ({ id, status }) => api.post(`/trips/${id}/set_status/`, { status }),
    onSuccess: refreshAll,
    onError: reportError,
  });

  if (requestsQuery.isPending || tripsQuery.isPending) return <Spinner />;

  const requests = requestsQuery.data ?? [];
  const activeTrips = (tripsQuery.data ?? []).filter((trip) =>
    ACTIVE_TRIP_STATUSES.includes(trip.status),
  );
  const busy = respondMutation.isPending || tripMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* The work-mode card carries the visual weight, so the page still needs a
          programmatic <h1> for screen readers and the document outline. */}
      <h1 className="sr-only">{t("nav.dashboard")}</h1>

      {/* Work mode is the centrepiece: one control, one unambiguous state. */}
      <section
        className={`rounded-2xl p-6 text-center transition-colors ${
          isOnline ? "bg-sa-800 text-white" : "bg-gray-900 text-white"
        }`}
      >
        <p className="text-sm text-gray-200">
          {t("transporter.greeting", { name: user.first_name })}
        </p>

        <button
          type="button"
          onClick={() => onlineMutation.mutate(!isOnline)}
          disabled={onlineMutation.isPending}
          aria-pressed={isOnline}
          className={`mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full text-lg font-bold transition-transform disabled:opacity-60 ${
            isOnline
              ? "bg-sa-300 text-sa-950 pulse-online"
              : "bg-white text-gray-900 hover:scale-105"
          }`}
        >
          {isOnline ? t("transporter.goOffline") : t("transporter.goOnline")}
        </button>

        <p
          className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold"
          aria-live="polite"
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-sa-300" : "bg-gray-400"}`}
          />
          {isOnline ? t("transporter.statusOnline") : t("transporter.statusOffline")}
        </p>
        <p className="mt-1 text-xs text-gray-200">
          {isOnline ? t("transporter.tapToStop") : t("transporter.tapToGo")}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat
          icon={Truck}
          label={t("transporter.statCompleted")}
          value={profile?.completed_trips ?? 0}
        />
        <Stat
          icon={MapPin}
          label={t("transporter.statActive")}
          value={activeTrips.length}
          tone="brand"
        />
        <Stat icon={Star} label={t("transporter.statRating")} value={profile?.rating ?? "—"} />
      </div>

      {activeTrips.length > 0 && (
        <section className="mt-6" aria-labelledby="active-trip-heading">
          <h2 id="active-trip-heading" className="text-lg font-bold text-gray-900">
            {t("transporter.activeTrip")}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {activeTrips.map((trip) => (
              <li key={trip.id}>
                <Card className="flex flex-col gap-3 border-s-4 border-s-sa-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      <Route from={trip.request.pickup_city} to={trip.request.dropoff_city} />
                    </h3>
                    <StatusBadge status={trip.status} />
                  </div>
                  <p className="text-sm text-gray-600">{trip.request.cargo_description}</p>
                  {trip.agreed_price && (
                    <p className="text-sm font-semibold text-sa-800">
                      {t("trips.agreedPrice")}: {trip.agreed_price} {t("common.sar")}
                    </p>
                  )}
                  <div>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        tripMutation.mutate({
                          id: trip.id,
                          status: trip.status === "scheduled" ? "in_transit" : "delivered",
                        })
                      }
                    >
                      {trip.status === "scheduled" ? t("trips.start") : t("trips.deliver")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6" aria-labelledby="requests-heading">
        <h2 id="requests-heading" className="text-lg font-bold text-gray-900">
          {requests.length > 0 ? t("transporter.awaiting") : t("transporter.title")}
        </h2>
        {requests.length > 0 && (
          <p className="mt-1 text-sm text-gray-600">{t("transporter.awaitingHint")}</p>
        )}

        {requests.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Inbox}>
              {isOnline ? t("transporter.onlineEmpty") : t("transporter.offlineEmpty")}
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {requests.map((request) => (
              <li key={request.id}>
                <RequestCard
                  request={request}
                  busy={busy}
                  onRespond={(id, action) => respondMutation.mutate({ id, action })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function MyTrips() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips, isPending } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });

  const tripMutation = useMutation({
    mutationFn: ({ id, status }) => api.post(`/trips/${id}/set_status/`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
    onError: reportError,
  });

  if (isPending) return <Spinner />;

  return (
    <>
      <PageHeader icon={Truck} title={t("trips.title")} />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {trips.length === 0 ? (
          <EmptyState icon={Package}>{t("trips.empty")}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">
                      <Route from={trip.request.pickup_city} to={trip.request.dropoff_city} />
                    </h2>
                    <StatusBadge status={trip.status} />
                  </div>
                  <p className="text-sm text-gray-600">{trip.request.cargo_description}</p>
                  {trip.agreed_price && (
                    <p className="text-sm text-gray-900">
                      {t("trips.agreedPrice")}: {trip.agreed_price} {t("common.sar")}
                    </p>
                  )}
                  {user?.role === "transporter" && trip.status !== "delivered" && (
                    <div>
                      <Button
                        disabled={tripMutation.isPending}
                        onClick={() =>
                          tripMutation.mutate({
                            id: trip.id,
                            status: trip.status === "scheduled" ? "in_transit" : "delivered",
                          })
                        }
                      >
                        {trip.status === "scheduled" ? t("trips.start") : t("trips.deliver")}
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
