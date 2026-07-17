import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
import type { Turf } from "@/types/domain";

const query = (params: Record<string, string | number | undefined>) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])).toString();
const turfCache = new Map<string, Turf>();
const detailRequests = new Map<string, Promise<ApiEnvelope<Turf>>>();
const CACHE_KEY = "turfzy_turf_cache";

if (typeof window !== "undefined") {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, Turf>;
    Object.entries(saved).forEach(([id, turf]) => turfCache.set(id, turf));
  } catch {
    sessionStorage.removeItem(CACHE_KEY);
  }
}

function cacheTurfs(response: ApiEnvelope<Turf[]> | Turf[]) {
  const turfs = Array.isArray(response) ? response : response.data ?? [];
  turfs.forEach((turf) => turfCache.set(turf.id, turf));
  if (typeof window !== "undefined") {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(turfCache))); } catch { /* storage is optional */ }
  }
  return response;
}

function fetchDetails(id: string) {
  const activeRequest = detailRequests.get(id);
  if (activeRequest) return activeRequest;
  const detailRequest = api<ApiEnvelope<Turf> | Turf>(`/api/v3/turfs/${id}`).then((response) => {
    const turf = "data" in response && response.data ? response.data : response as Turf;
    turfCache.set(id, turf);
    if (typeof window !== "undefined") {
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(turfCache))); } catch { /* storage is optional */ }
    }
    return { success: true as const, data: turf };
  }).finally(() => detailRequests.delete(id));
  detailRequests.set(id, detailRequest);
  return detailRequest;
}

export const turfService = {
  list: async (page = 1, limit = 24) => cacheTurfs(await api<ApiEnvelope<Turf[]> | Turf[]>(`/api/v3/turfs?${query({ page, limit })}`)),
  details: fetchDetails,
  cached: (id: string) => turfCache.get(id),
  prefetch: (id: string) => void fetchDetails(id).catch(() => undefined),
  nearby: (params: Record<string, string | number | undefined>) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/nearby?${query({ ...params, page: params.page ?? 1, limit: params.limit ?? 15 })}`),
  search: async (q: string, page = 1, limit = 24) => cacheTurfs(await api<ApiEnvelope<Turf[]> | Turf[]>(`/api/v3/turfs/search?${query({ q, page, limit })}`)),
  filter: (params: Record<string, string | number | undefined>) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/filter?${query({ ...params, page: params.page ?? 1, limit: params.limit ?? 15 })}`),
  mostRated: (params: Record<string, string | number | undefined> = {}) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/most-rated?${query(params)}`),
  budgetFriendly: (params: Record<string, string | number | undefined> = {}) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/budget-friendly?${query(params)}`),
  mostDemanded: (params: Record<string, string | number | undefined> = {}) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/most-demanded?${query(params)}`),
  newlyJoined: (params: Record<string, string | number | undefined> = {}) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/newly-joined?${query(params)}`),
  recentlyViewed: (params: Record<string, string | number | undefined> = {}) => api<ApiEnvelope<Turf[]>>(`/api/v3/turfs/recently-viewed?${query(params)}`),
  getSaved: () => api<ApiEnvelope<{ turfDetails: Turf }[]>>("/api/v3/saved-turfs"),
  save: (id: string, notes?: string) => request(`/api/v3/saved-turfs/${id}`, "POST", { notes }),
  unsave: (id: string) => request(`/api/v3/saved-turfs/${id}`, "DELETE"),
};
