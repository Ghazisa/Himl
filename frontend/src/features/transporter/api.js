import api from "@/lib/api";

export const fetchIncomingRequests = () =>
  api.get("/requests/incoming/").then((r) => r.data.results);

export const fetchTrips = () => api.get("/trips/").then((r) => r.data.results);

export const setWorkMode = (isOnline) =>
  api.post("/auth/me/online/", { is_online: isOnline }).then((r) => r.data);

export const respondToRequest = ({ id, action }) => api.post(`/requests/${id}/${action}/`);

export const setTripStatus = ({ id, status }) => api.post(`/trips/${id}/set_status/`, { status });

/** A trip the driver is still responsible for. */
export const ACTIVE_TRIP_STATUSES = ["scheduled", "in_transit"];

/** The single next action for a trip — drivers should never choose between two. */
export const nextTripStatus = (status) => (status === "scheduled" ? "in_transit" : "delivered");
