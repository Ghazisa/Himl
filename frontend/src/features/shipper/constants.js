export const EMPTY_FILTERS = {
  body_type: "",
  size: "",
  min_capacity_tons: "",
  online_only: false,
  has_tail_lift: false,
};

export const EMPTY_CARGO = {
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

/** Fields the backend requires before a request can be created. */
export const REQUIRED_CARGO_FIELDS = [
  "cargo_description",
  "weight_tons",
  "pickup_city",
  "pickup_address",
  "dropoff_city",
  "dropoff_address",
  "pickup_date",
];
