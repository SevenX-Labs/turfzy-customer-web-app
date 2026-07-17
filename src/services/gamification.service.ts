import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
export const gamificationService = {
  overall: () => api<ApiEnvelope<unknown>>("/api/v3/user-gamification/overall"),
  streak: () => api<ApiEnvelope<unknown>>("/api/v3/user-gamification/streak"),
  nudge: () => api<ApiEnvelope<unknown>>("/api/v3/user-gamification/nudge"),
  leaderboard: (sortBy = "points") => api<ApiEnvelope<unknown>>(`/api/v3/user-gamification/leaderboard?sortBy=${encodeURIComponent(sortBy)}`),
  leaderboardByPoints: () => api<ApiEnvelope<unknown>>("/api/v3/user-gamification/leaderboard/points"),
  leaderboardByMatches: () => api<ApiEnvelope<unknown>>("/api/v3/user-gamification/leaderboard/total-matches-played"),
  leaderboardByHours: () => api<ApiEnvelope<unknown>>("/api/v3/user-gamification/leaderboard/total-hours-played"),
  triggerCompletion: (bookingId: string) => request<ApiEnvelope<unknown>>(`/api/v3/user-gamification/debug/trigger-completion/${bookingId}`, "POST"),
};
