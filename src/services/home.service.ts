import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
export const homeService = {
  get: (params?: Record<string, string | number>) => api<ApiEnvelope<unknown>>(`/api/v3/user-home${params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}` : ""}`),
  section: (section: string) => api<ApiEnvelope<unknown>>(`/api/v3/user-home/${section}`),
  topRecommended: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/top-recommended"),
  mostRated: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/most-rated"),
  budgetFriendly: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/budget-friendly"),
  nearby: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/nearby"),
  mostDemanded: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/most-demanded"),
  newlyOpened: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/newly-opened"),
  recentlyViewed: () => api<ApiEnvelope<unknown>>("/api/v3/user-home/recently-viewed"),
};
