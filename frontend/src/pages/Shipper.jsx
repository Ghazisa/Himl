import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api, { readErrors } from "../api";
import { Filter, Inbox, PackageSearch, RotateCcw, Search, Send } from "lucide-react";
import { Alert, Button, Card, EmptyState, Field, PageHeader, Route, Spinner, StatusBadge } from "../ui";

const EMPTY_FILTERS = {
  body_type: "",
  size: "",
  min_capacity_tons: "",
  online_only: false,
  has_tail_lift: false,
};

const EMPTY_CARGO = {
  cargo_type: "general",
  cargo_description: "",
  weight_tons: "",
  volume_m3: "",
  pickup_city: "",
  pickup_address: "",
  dropoff_city: "",
  dropoff_address: "",
  pickup_date: "",
  offered_price: "",
  notes: "",
};

export function ShipperDashboard() {
  const { t } = useTranslation();
  const [cargo, setCargo] = useState(EMPTY_CARGO);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [options, setOptions] = useState({ body_types: [], sizes: [], cargo_types: [] });
  const [vehicles, setVehicles] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/options/vehicles/"), api.get("/options/shipments/")]).then(
      ([vehicleRes, shipmentRes]) =>
        setOptions({ ...vehicleRes.data, ...shipmentRes.data }),
    );
  }, []);

  const search = async (overrideFilters) => {
    setLoading(true);
    setErrors([]);
    const params = { ...(overrideFilters ?? filters) };
    if (cargo.weight_tons) params.min_capacity_tons = cargo.weight_tons;
    if (cargo.pickup_city) params.pickup_city = cargo.pickup_city;
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === false) delete params[key];
    });
    try {
      const { data } = await api.get("/vehicles/search/", { params });
      setVehicles(data.results);
      setCount(data.count);
    } catch (error) {
      setErrors(readErrors(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
    // Initial listing only; later searches are driven by the Search button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargoReady =
    cargo.cargo_description &&
    cargo.weight_tons &&
    cargo.pickup_city &&
    cargo.pickup_address &&
    cargo.dropoff_city &&
    cargo.dropoff_address &&
    cargo.pickup_date;

  async function sendRequest(vehicleId) {
    setErrors([]);
    setNotice("");
    if (!cargoReady) {
      setErrors([t("shipper.cargoNeeded")]);
      document.getElementById("cargo-form")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setPendingId(vehicleId);
    const payload = { vehicle_id: vehicleId, ...cargo };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") delete payload[key];
    });
    try {
      await api.post("/requests/", payload);
      setNotice(t("shipper.requestSent"));
    } catch (error) {
      setErrors(readErrors(error));
    } finally {
      setPendingId(null);
    }
  }

  const hasFilters = Object.keys(EMPTY_FILTERS).some(
    (key) => filters[key] !== EMPTY_FILTERS[key],
  );

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    search(EMPTY_FILTERS);
  }

  const updateCargo = (key) => (event) => setCargo({ ...cargo, [key]: event.target.value });
  const updateFilter = (key) => (event) =>
    setFilters({
      ...filters,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    });

  return (
    <>
      <PageHeader icon={PackageSearch} title={t("shipper.title")} subtitle={t("shipper.subtitle")} />
      <div className="mx-auto max-w-6xl px-4 py-8">
      <Card className="-mt-4" id="cargo-form">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("shipper.cargoType")}>
              <select value={cargo.cargo_type} onChange={updateCargo("cargo_type")}>
                {options.cargo_types?.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(`options.cargoType.${item.value}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t("shipper.weight")}
              required
              type="number"
              min="0.01"
              step="0.01"
              value={cargo.weight_tons}
              onChange={updateCargo("weight_tons")}
            />
            <Field
              label={t("shipper.volume")}
              type="number"
              min="0"
              step="0.01"
              value={cargo.volume_m3}
              onChange={updateCargo("volume_m3")}
            />
            <Field
              label={t("shipper.pickupCity")}
              required
              value={cargo.pickup_city}
              onChange={updateCargo("pickup_city")}
            />
            <Field
              label={t("shipper.pickupAddress")}
              required
              value={cargo.pickup_address}
              onChange={updateCargo("pickup_address")}
            />
            <Field
              label={t("shipper.dropoffCity")}
              required
              value={cargo.dropoff_city}
              onChange={updateCargo("dropoff_city")}
            />
            <Field
              label={t("shipper.dropoffAddress")}
              required
              value={cargo.dropoff_address}
              onChange={updateCargo("dropoff_address")}
            />
            <Field
              label={t("shipper.pickupDate")}
              required
              type="date"
              value={cargo.pickup_date}
              onChange={updateCargo("pickup_date")}
            />
            <Field
              label={t("shipper.offeredPrice")}
              type="number"
              min="0"
              step="0.01"
              value={cargo.offered_price}
              onChange={updateCargo("offered_price")}
            />
          </div>
          <Field
            label={t("shipper.description")}
            required
            value={cargo.cargo_description}
            onChange={updateCargo("cargo_description")}
          >
            <textarea rows={2} value={cargo.cargo_description} onChange={updateCargo("cargo_description")} />
          </Field>
          <div>
            <Button icon={Search} type="submit">{t("shipper.search")}</Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900"><Filter aria-hidden="true" className="h-4 w-4 text-gray-500" />{t("shipper.filters")}</h2>
          <div className="mt-4 flex flex-col gap-4">
            <Field label={t("shipper.bodyType")}>
              <select value={filters.body_type} onChange={updateFilter("body_type")}>
                <option value="">—</option>
                {options.body_types?.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(`options.bodyType.${item.value}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("shipper.size")}>
              <select value={filters.size} onChange={updateFilter("size")}>
                <option value="">—</option>
                {options.sizes?.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(`options.size.${item.value}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t("shipper.minCapacity")}
              type="number"
              min="0"
              step="0.5"
              value={filters.min_capacity_tons}
              onChange={updateFilter("min_capacity_tons")}
            />
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={filters.online_only}
                onChange={updateFilter("online_only")}
              />
              {t("shipper.onlineOnly")}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={filters.has_tail_lift}
                onChange={updateFilter("has_tail_lift")}
              />
              {t("shipper.tailLift")}
            </label>
            <div className="flex flex-col gap-2">
              <Button icon={Search} type="button" onClick={() => search()}>
                {t("shipper.search")}
              </Button>
              <Button icon={RotateCcw} type="button" variant="ghost" onClick={resetFilters} disabled={!hasFilters}>
                {t("shipper.reset")}
              </Button>
            </div>
          </div>
        </Card>

        <section aria-labelledby="results-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="results-heading" className="text-base font-semibold text-gray-900">
              {t("shipper.results")}
            </h2>
            <p className="text-sm text-gray-500" aria-live="polite">
              {t("shipper.resultCount", { count })}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <Alert>{errors}</Alert>
            {notice && <Alert tone="success">{notice}</Alert>}
          </div>

          {loading ? (
            <Spinner />
          ) : vehicles.length === 0 ? (
            <div className="mt-4"><EmptyState icon={Inbox}>{t("shipper.noResults")}</EmptyState></div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {vehicle.make} {vehicle.model_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {t(`options.bodyType.${vehicle.body_type}`)} ·{" "}
                          {t(`options.size.${vehicle.size}`)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          vehicle.owner.is_online
                            ? "bg-sa-100 text-sa-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {vehicle.owner.is_online ? t("shipper.online") : t("shipper.offline")}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-xs text-gray-500">
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
                        <dt className="font-medium text-gray-900">{vehicle.owner.full_name}</dt>
                        <dd>
                          ★ {vehicle.owner.rating} · {vehicle.owner.completed_trips}{" "}
                          {t("shipper.trips")}
                        </dd>
                      </div>
                    </dl>

                    <Button
                      className="mt-auto"
                      onClick={() => sendRequest(vehicle.id)}
                      disabled={pendingId === vehicle.id}
                    >
                      {pendingId === vehicle.id ? t("shipper.requesting") : t("shipper.request")}
                    </Button>
                  </Card>
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

export function MyRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get("/requests/").then(({ data }) => {
      setRequests(data.results);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    await api.post(`/requests/${id}/cancel/`);
    load();
  }

  if (loading) return <Spinner />;

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
                    <Route from={request.pickup_city} to={request.dropoff_city} />
                  </h2>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-sm text-gray-500">{request.cargo_description}</p>
                <dl className="grid grid-cols-2 gap-2 text-xs text-gray-500 sm:grid-cols-4">
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
                    <Button variant="danger" onClick={() => cancel(request.id)}>
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
