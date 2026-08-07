import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Inbox, PackageSearch } from "lucide-react";
import { Alert, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { readErrors } from "@/lib/api";
import { createRequest, fetchOptions, searchVehicles } from "./api";
import { EMPTY_CARGO, EMPTY_FILTERS, REQUIRED_CARGO_FIELDS } from "./constants";
import { CargoForm } from "./components/CargoForm";
import { VehicleFilters } from "./components/VehicleFilters";
import { VehicleCard } from "./components/VehicleCard";

export function ShipperDashboardPage() {
  const { t } = useTranslation();
  const [cargo, setCargo] = useState(EMPTY_CARGO);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Held separately from `filters` so results only change when Search is pressed.
  const [appliedParams, setAppliedParams] = useState(EMPTY_FILTERS);
  const [errors, setErrors] = useState([]);

  const optionsQuery = useQuery({
    queryKey: ["options"],
    queryFn: fetchOptions,
    staleTime: Infinity,
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", appliedParams],
    queryFn: () => searchVehicles(appliedParams),
  });

  const requestMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      setErrors([]);
      toast.success(t("shipper.requestSent"));
    },
    onError: (error) => setErrors(readErrors(error)),
  });

  function applySearch(nextFilters = filters) {
    const params = { ...nextFilters };
    // Cargo details narrow the search without the shipper re-typing them.
    if (cargo.weight_tons) params.min_capacity_tons = cargo.weight_tons;
    if (cargo.pickup_city) params.pickup_city = cargo.pickup_city;
    setAppliedParams(params);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    applySearch(EMPTY_FILTERS);
  }

  function sendRequest(vehicleId) {
    const missing = REQUIRED_CARGO_FIELDS.some((field) => !cargo[field]);
    if (missing) {
      setErrors([t("shipper.cargoNeeded")]);
      document.getElementById("cargo-form")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    requestMutation.mutate({ vehicle_id: vehicleId, ...cargo });
  }

  const options = optionsQuery.data ?? { body_types: [], sizes: [], cargo_types: [] };
  const vehicles = vehiclesQuery.data?.results ?? [];
  const count = vehiclesQuery.data?.count ?? 0;

  return (
    <>
      <PageHeader icon={PackageSearch} title={t("shipper.title")} subtitle={t("shipper.subtitle")} />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <CargoForm
          cargo={cargo}
          onChange={setCargo}
          onSearch={() => applySearch()}
          cargoTypes={options.cargo_types ?? []}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <VehicleFilters
            filters={filters}
            onChange={setFilters}
            onSearch={() => applySearch()}
            onReset={resetFilters}
            bodyTypes={options.body_types ?? []}
            sizes={options.sizes ?? []}
          />

          <section aria-labelledby="results-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="results-heading" className="text-base font-semibold text-gray-900">
                {t("shipper.results")}
              </h2>
              <p className="text-sm text-gray-600" aria-live="polite">
                {t("shipper.resultCount", { count })}
              </p>
            </div>

            <div className="mt-3">
              <Alert>{errors}</Alert>
            </div>

            {vehiclesQuery.isPending ? (
              <Spinner />
            ) : vehicles.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={Inbox}>{t("shipper.noResults")}</EmptyState>
              </div>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id}>
                    <VehicleCard
                      vehicle={vehicle}
                      onRequest={sendRequest}
                      pending={
                        requestMutation.isPending &&
                        requestMutation.variables?.vehicle_id === vehicle.id
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
