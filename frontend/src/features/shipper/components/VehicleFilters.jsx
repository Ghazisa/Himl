import { useTranslation } from "react-i18next";
import { Filter, RotateCcw, Search } from "lucide-react";
import { Button, Card, Field } from "@/components/ui";
import { EMPTY_FILTERS } from "../constants";

export function VehicleFilters({ filters, onChange, onSearch, onReset, bodyTypes, sizes }) {
  const { t } = useTranslation();

  const update = (key) => (event) =>
    onChange({
      ...filters,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    });

  const isDirty = Object.keys(EMPTY_FILTERS).some((key) => filters[key] !== EMPTY_FILTERS[key]);

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <Filter aria-hidden="true" className="h-4 w-4 text-gray-500" />
        {t("shipper.filters")}
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        <Field label={t("shipper.bodyType")}>
          <select value={filters.body_type} onChange={update("body_type")}>
            <option value="">—</option>
            {bodyTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {t(`options.bodyType.${item.value}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("shipper.size")}>
          <select value={filters.size} onChange={update("size")}>
            <option value="">—</option>
            {sizes.map((item) => (
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
          onChange={update("min_capacity_tons")}
        />

        <label className="flex items-center gap-2 text-sm text-gray-900">
          <input type="checkbox" checked={filters.online_only} onChange={update("online_only")} />
          {t("shipper.onlineOnly")}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-900">
          <input type="checkbox" checked={filters.has_tail_lift} onChange={update("has_tail_lift")} />
          {t("shipper.tailLift")}
        </label>

        <div className="flex flex-col gap-2">
          <Button icon={Search} type="button" onClick={onSearch}>
            {t("shipper.search")}
          </Button>
          <Button
            icon={RotateCcw}
            type="button"
            variant="ghost"
            onClick={onReset}
            disabled={!isDirty}
          >
            {t("shipper.reset")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
