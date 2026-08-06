import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const tokenStore = {
  get access() {
    return localStorage.getItem("access");
  },
  get refresh() {
    return localStorage.getItem("refresh");
  },
  save({ access, refresh }) {
    localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
  },
  clear() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One retry on 401 using the refresh token, then give up and sign the user out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retried || !tokenStore.refresh) {
      return Promise.reject(error);
    }
    original._retried = true;
    try {
      const { data } = await axios.post("/api/auth/token/refresh/", {
        refresh: tokenStore.refresh,
      });
      tokenStore.save(data);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshError) {
      tokenStore.clear();
      window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  },
);

/** Flatten DRF error payloads into a list of readable strings. */
export function readErrors(error) {
  const data = error?.response?.data;
  if (!data) return [];
  if (typeof data === "string") return [data];
  return Object.entries(data).flatMap(([field, messages]) => {
    const list = Array.isArray(messages) ? messages : [messages];
    return list.map((message) =>
      field === "detail" || field === "non_field_errors" ? message : `${message}`,
    );
  });
}

export default api;
