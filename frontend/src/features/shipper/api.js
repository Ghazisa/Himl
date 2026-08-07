import api from "@/lib/api";

/** Strips empty values so they are never sent as blank query params or fields. */
export function compact(source) {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== "" && value !== false && value != null),
  );
}

export const fetchOptions = async () => {
  const [vehicles, shipments] = await Promise.all([
    api.get("/options/vehicles/"),
    api.get("/options/shipments/"),
  ]);
  return { ...vehicles.data, ...shipments.data };
};

export const searchVehicles = (params) =>
  api.get("/vehicles/search/", { params: compact(params) }).then((r) => r.data);

export const fetchMyRequests = () => api.get("/requests/").then((r) => r.data.results);

export const createRequest = (payload) => api.post("/requests/", compact(payload));

export const cancelRequest = (id) => api.post(`/requests/${id}/cancel/`);
