import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
import type { UserProfile } from "@/types/domain";
export type ProfileInput = { username: string; name: string; email: string; phone?: string; avatarUrl?: string; dob?: string; gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"; preferredSport?: "FOOTBALL" | "CRICKET"; city?: string; state?: string; pincode?: string; currentLat?: number; currentLng?: number };
export const profileService = {
  checkUsername: (username: string) => api<{ available: boolean; message: string }>(`/api/v3/user-profile/check-availability?username=${encodeURIComponent(username)}`),
  create: (body: ProfileInput) => request<ApiEnvelope<UserProfile>>("/api/v3/user-profile", "POST", body),
  get: () => api<ApiEnvelope<UserProfile>>("/api/v3/user-profile"),
  update: (body: Partial<ProfileInput>) => request<ApiEnvelope<UserProfile>>("/api/v3/user-profile", "PATCH", body),
  updateAddress: (body: { addressLine1?: string; addressLine2?: string; city?: string; state?: string; pincode?: string }) => request("/api/v3/user-profile/address", "PATCH", body),
  updateLocation: (lat: number, lng: number, city?: string) => request("/api/v3/user-profile/location", "POST", { lat, lng, city }),
  savePaymentDetails: (upiId: string, accountHolderName?: string) => request("/api/v3/user-profile/payment-details", "POST", { upiId, accountHolderName }),
  uploadAvatar: (file: File) => { const form = new FormData(); form.append("avatar", file); return request("/api/v3/user-profile/upload-avatar", "POST", form); },
  deleteAvatar: () => request("/api/v3/user-profile/upload-avatar", "DELETE"),
};
