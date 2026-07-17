import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
export const splitService = {
  addPlayers: (bookingId: string, usernames: string[]) => request(`/api/v3/booking/${bookingId}/split/players`, "POST", { usernames }),
  removePlayer: (playerId: string) => request(`/api/v3/booking/split/players/${playerId}`, "DELETE"),
  details: (bookingId: string) => api<ApiEnvelope<unknown>>(`/api/v3/booking/${bookingId}/split`),
  setCustomAmounts: (bookingId: string, amounts: { playerId: string; amount: number }[]) => request(`/api/v3/booking/${bookingId}/split/custom-amounts`, "PATCH", { amounts }),
  trigger: (bookingId: string) => request(`/api/v3/booking/${bookingId}/split/trigger`, "POST"),
  setPlayerStatus: (playerId: string, status: "PAID" | "PENDING") => request(`/api/v3/booking/split/players/${playerId}/status`, "PATCH", { status }),
};
