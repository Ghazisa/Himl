import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Button, Card, Field } from "@/components/ui";

/** The cargo details that a request is built from, and the primary search trigger. */
export function CargoForm({ cargo, onChange, onSearch, cargoTypes }) {
  const { t } = useTranslation();
  const update = (key) => (event) => onChange({ ...cargo, [key]: event.target.value });

  return (
    <Card className="-mt-4" id="cargo-form">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("shipper.cargoType")}>
            <select value={cargo.cargo_type} onChange={update("cargo_type")}>
              {cargoTypes.map((item) => (
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
            onChange={update("weight_tons")}
          />
          <Field
            label={t("shipper.volume")}
            type="number"
            min="0"
            step="0.01"
            value={cargo.volume_m3}
            onChange={update("volume_m3")}
          />
          <Field
            label={t("shipper.pickupCity")}
            required
            value={cargo.pickup_city}
            onChange={update("pickup_city")}
          />
          <Field
            label={t("shipper.pickupAddress")}
            required
            value={cargo.pickup_address}
            onChange={update("pickup_address")}
          />
          <Field
            label={t("shipper.dropoffCity")}
            required
            value={cargo.dropoff_city}
            onChange={update("dropoff_city")}
          />
          <Field
            label={t("shipper.dropoffAddress")}
            required
            value={cargo.dropoff_address}
            onChange={update("dropoff_address")}
          />
          <Field
            label={t("shipper.pickupDate")}
            required
            type="date"
            value={cargo.pickup_date}
            onChange={update("pickup_date")}
          />
          <Field
            label={t("shipper.offeredPrice")}
            type="number"
            min="0"
            step="0.01"
            value={cargo.offered_price}
            onChange={update("offered_price")}
          />
        </div>

        <Field label={t("shipper.description")} required>
          <textarea rows={2} value={cargo.cargo_description} onChange={update("cargo_description")} />
        </Field>

        <div>
          <Button icon={Search} type="submit">
            {t("shipper.search")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
