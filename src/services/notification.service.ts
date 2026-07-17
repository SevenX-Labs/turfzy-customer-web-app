import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
import type { Notification } from "@/types/domain";
export const notificationService = {
  savePushToken: (expoPushToken: string) => request("/api/v3/notifications/save-token", "POST", { expoPushToken }),
  inbox: (page = 1, limit = 50) => api<ApiEnvelope<Notification[]>>(`/api/v3/notifications/inbox?page=${page}&limit=${limit}`),
  read: (id: string) => request(`/api/v3/notifications/${id}/read`, "PATCH"),
  readAll: () => request("/api/v3/notifications/read-all", "PATCH"),
  delete: (id: string) => request(`/api/v3/notifications/${id}`, "DELETE"),
  clearAll: () => request("/api/v3/notifications/clear-all", "DELETE"),
  test: () => api("/api/v3/notifications/test"),
};
