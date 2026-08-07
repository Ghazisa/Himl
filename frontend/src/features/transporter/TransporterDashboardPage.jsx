import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Inbox, MapPin, Star, Truck } from "lucide-react";
import { EmptyState, Spinner, Stat } from "@/components/ui";
import { readErrors } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import {
  ACTIVE_TRIP_STATUSES,
  fetchIncomingRequests,
  fetchTrips,
  respondToRequest,
  setTripStatus,
  setWorkMode,
} from "./api";
import { WorkModeCard } from "./components/WorkModeCard";
import { IncomingRequestCard } from "./components/IncomingRequestCard";
import { TripCard } from "./components/TripCard";

const POLL_INTERVAL_MS = 15_000;

export function TransporterDashboardPage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const profile = user?.transporter_profile;
  const isOnline = profile?.is_online ?? false;

  // While online the feed behaves like a live queue, so poll for new requests.
  const requestsQuery = useQuery({
    queryKey: ["requests", "incoming"],
    queryFn: fetchIncomingRequests,
    refetchInterval: isOnline ? POLL_INTERVAL_MS : false,
  });
  const tripsQuery = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  const reportError = (error) => toast.error(readErrors(error)[0]);

  const workModeMutation = useMutation({
    mutationFn: setWorkMode,
    onSuccess: (data) => {
      setUser({ ...user, transporter_profile: { ...profile, ...data } });
      toast.success(data.is_online ? t("transporter.onlineState") : t("transporter.offlineState"));
    },
    onError: reportError,
  });

  const respondMutation = useMutation({
    mutationFn: respondToRequest,
    onSuccess: (_data, { action }) => {
      toast.success(action === "accept" ? t("transporter.accepted") : t("transporter.declined"));
      refreshAll();
    },
    onError: reportError,
  });

  const tripMutation = useMutation({
    mutationFn: setTripStatus,
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

      <WorkModeCard
        name={user.first_name}
        isOnline={isOnline}
        busy={workModeMutation.isPending}
        onToggle={() => workModeMutation.mutate(!isOnline)}
      />

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
                <TripCard trip={trip} onAdvance={tripMutation.mutate} busy={busy} emphasised />
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
                <IncomingRequestCard
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
