import { api, request } from "@/lib/api";
import type { ApiEnvelope } from "@/types/api";
import type { Booking, PaymentType } from "@/types/domain";
export type CreateBookingInput = { turfId: string; bookingDate: string; startTime: string; endTime: string; durationMins: number; paymentType: PaymentType; notes?: string; playersCount?: number };
export const bookingService = {
  availability: (id: string, date: string) => api<ApiEnvelope<{ openTime: string; closeTime: string; minBookableTime?: string; bookedSlots: { startTime: string; endTime: string; isExpired?: boolean }[]; pricing: Record<string, unknown> }>>(`/api/v3/booking/availability/${id}?date=${encodeURIComponent(date)}`),
  create: (body: CreateBookingInput) => request<ApiEnvelope<Booking>>("/api/v3/booking", "POST", body),
  quickPayAtTurf: (body: Omit<CreateBookingInput, "paymentType"> & { paymentType?: PaymentType }) => request<ApiEnvelope<Booking>>("/api/v3/booking/pay-at-turf", "POST", { ...body, paymentType: "FULL_CASH" }),
  rebook: (id: string, body: Partial<Pick<CreateBookingInput, "bookingDate" | "startTime" | "endTime" | "durationMins" | "paymentType">>) => request<ApiEnvelope<Booking>>(`/api/v3/booking/${id}/rebook`, "POST", body),
  createRazorpayOrder: (id: string) => request<ApiEnvelope<{ orderId: string; amount: number; currency: string; keyId: string; bookingId: string }>>(`/api/v3/booking/${id}/create-order`, "POST"),
  platformFee: () => api<ApiEnvelope<unknown>>("/api/v3/platform-fee-slab/active"),
  fullCashStatus: () => api<ApiEnvelope<unknown>>("/api/v3/booking/customer/full-cash-status"),
  confirmPayment: (id: string, body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => request<ApiEnvelope<Booking>>(`/api/v3/booking/${id}/confirm-payment`, "POST", body),
  failOnlinePayment: (id: string) => request(`/api/v3/booking/${id}/payment-failed`, "POST"),
  cancel: (id: string, reason: string) => request(`/api/v3/booking/${id}/cancel`, "PATCH", { reason }),
  list: () => api<Booking[] | ApiEnvelope<Booking[]>>("/api/v3/booking/my-bookings"),
  active: () => api<ApiEnvelope<Booking[]>>("/api/v3/booking/my-bookings/active"),
  filtered: (params: URLSearchParams) => api<ApiEnvelope<Booking[]>>(`/api/v3/booking/my-bookings/bookings?${params.toString()}`),
  transactionHistory: () => api<ApiEnvelope<unknown[]>>("/api/v3/booking/transaction-history"),
  rate: (id: string, rating: number, review?: string) => request(`/api/v3/booking/my-bookings/${id}/rateTurf`, "POST", { rating, review }),
  get: (id: string) => api<ApiEnvelope<Booking>>(`/api/v3/booking/my-bookings/${id}`),
  invoice: (id: string) => api<ApiEnvelope<unknown>>(`/api/v3/booking/my-bookings/${id}/invoice`),
  invoicePdfUrl: (id: string) => `https://turfsy.onrender.com/api/v3/booking/my-bookings/${id}/invoice/pdf`,
  emailTest: () => api("/api/v3/booking/email-test"),
};
