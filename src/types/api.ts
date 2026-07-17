export type ApiEnvelope<T> = { success: boolean; message?: string; data: T; meta?: Record<string, unknown> };
export type ApiError = { success: false; message: string; status?: number; statusCode?: number; data?: unknown };
