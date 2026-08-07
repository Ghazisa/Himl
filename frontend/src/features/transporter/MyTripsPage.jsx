import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Package, Truck } from "lucide-react";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { readErrors } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchTrips, setTripStatus } from "./api";
import { TripCard } from "./components/TripCard";

export function MyTripsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips, isPending } = useQuery({ queryKey: ["trips"], queryFn: fetchTrips });

  const tripMutation = useMutation({
    mutationFn: setTripStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
    onError: (error) => toast.error(readErrors(error)[0]),
  });

  if (isPending) return <Spinner />;

  const isTransporter = user?.role === "transporter";

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
                <TripCard
                  trip={trip}
                  busy={tripMutation.isPending}
                  onAdvance={isTransporter ? tripMutation.mutate : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
