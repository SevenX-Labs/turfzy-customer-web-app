import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
import type { UserProfile } from "@/types/domain";
type OtpResponse = { success: boolean; message: string; expiresIn?: number };
type VerifyOtpResponse = OtpResponse & { accessToken: string; role: "USER"; isNewUser: boolean; auth: { id: string; phone: string; role: "USER" } };
export const authService = {
  login: (phone: string) => request<OtpResponse>("/api/v3/auth/user/login", "POST", { phone }),
  verifyOtp: (phone: string, otp: string) => request<VerifyOtpResponse>("/api/v3/auth/user/verify-otp", "POST", { phone, otp }),
  resendOtp: (phone: string) => request<OtpResponse>("/api/v3/auth/user/resend-otp", "POST", { phone }),
  getMe: () => api<ApiEnvelope<{ id: string; phone: string; role: "USER"; profile?: UserProfile; payment?: unknown }>>("/api/v3/auth/get-me"),
  logout: () => api<{ success: boolean; message?: string }>("/api/v3/auth/logout"),
  deleteAccount: (sessionToken: string) => request<{ success: boolean; message: string }>("/api/v3/auth/delete-account", "DELETE", { sessionToken }),
  requestPhoneChange: (newPhone: string) => request("/api/v3/auth/request-phone-change", "POST", { newPhone }),
  verifyPhoneChange: (body: { sessionToken: string; newPhone: string; otp: string }) => request("/api/v3/auth/verify-phone-change", "POST", body),
  createMpin: (mpin: string) => request("/api/v3/auth/create-mpin", "POST", { mpin }),
  verifyMpin: (mpin: string) => request("/api/v3/auth/verify-mpin", "POST", { mpin }),
  changeMpin: (oldMpin: string, newMpin: string) => request("/api/v3/auth/change-mpin", "PATCH", { oldMpin, newMpin }),
  resetMpin: (phone: string, otp: string, newMpin: string) => request("/api/v3/auth/reset-mpin", "POST", { phone, otp, newMpin }),
};
