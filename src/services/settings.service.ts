import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
export type NotificationSettings = { bookingAlerts: boolean; promotions: boolean; reminderAlerts?: boolean };
export const settingsService = {
  payment: () => api<ApiEnvelope<{ upiId: string | null; defaultPaymentMethod: "UPI" | "NET_BANKING" | "CARD" }>>("/api/v3/user-settings/payment"),
  updatePayment: (body: { upiId?: string; defaultPaymentMethod?: "UPI" | "NET_BANKING" | "CARD" }) => request("/api/v3/user-settings/payment", "PATCH", body),
  requestPhoneChange: (newPhone: string) => request<ApiEnvelope<{ sessionToken?: string }>>("/api/v3/user-settings/change-phone", "POST", { newPhone }),
  changePassword: (body: { oldPassword: string; newPassword: string }) => request("/api/v3/user-settings/change-password", "POST", body),
  preferences: () => api<ApiEnvelope<unknown>>("/api/v3/user-settings/preferences"),
  updatePreferences: (body: unknown) => request("/api/v3/user-settings/preferences", "PATCH", body),
  notifications: () => api<ApiEnvelope<NotificationSettings>>("/api/v3/user-settings/notifications"),
  updateNotifications: (body: Partial<NotificationSettings>) => request("/api/v3/user-settings/notifications", "PATCH", body),
};
