"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { bookingService } from "@/services";
import type { Booking } from "@/types/domain";
import {
  Check,
  X,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  ArrowRight,
} from "lucide-react";

function BookingSuccessInner() {
  const params = useSearchParams();
  const bookingId = params.get("id");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    bookingService
      .get(bookingId)
      .then((r) => setBooking(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-lime-500" />
        <p className="text-sm font-semibold text-zinc-500">Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-lg px-5 pt-6 pb-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl" />

      {/* Close button */}
      <div className="flex justify-end relative z-10">
        <Link
          href="/bookings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition"
        >
          <X className="h-5 w-5 text-zinc-700" />
        </Link>
      </div>

      {/* Success Icon + Text */}
      <div className="relative z-10 mt-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-lime-400 shadow-lg shadow-lime-300/40">
          <Check className="h-10 w-10 text-zinc-950 stroke-[3]" />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-zinc-900">
          Booking<br />Confirmed!
        </h1>
        <p className="mt-2 text-sm text-zinc-500">You&apos;re all set to play.</p>
      </div>

      {/* Ticket Card */}
      {booking ? (
        <div className="relative z-10 mt-8">
          {/* Ticket top (lime green) */}
          <div className="rounded-t-3xl bg-lime-500 px-6 pt-6 pb-8">
            <p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">
              BOOKING ID
            </p>
            <div className="mt-1 flex items-center justify-between">
              <h2 className="text-2xl font-black text-zinc-950">
                #{booking.displayId}
              </h2>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400/50">
                <svg className="h-5 w-5 text-zinc-950/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Ticket tear line with circles */}
          <div className="relative flex items-center bg-lime-500">
            <div className="absolute -left-3 h-6 w-6 rounded-full bg-zinc-50" />
            <div className="w-full border-t-2 border-dashed border-lime-400/60" />
            <div className="absolute -right-3 h-6 w-6 rounded-full bg-zinc-50" />
          </div>

          {/* Ticket bottom (details) */}
          <div className="rounded-b-3xl bg-lime-500 px-6 pt-4 pb-6 space-y-5">
            <h3 className="text-xl font-black text-zinc-950">
              {booking.turf?.name ?? "Your Venue"}
            </h3>

            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/50">
                <Calendar className="h-4 w-4 text-zinc-950/60" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">
                  DATE
                </p>
                <p className="text-sm font-black text-zinc-950">
                  {formatDate(booking.bookingDate)}
                </p>
              </div>
            </div>

            {/* Time Slot */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/50">
                <Clock className="h-4 w-4 text-zinc-950/60" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">
                  TIME SLOT
                </p>
                <p className="text-sm font-black text-zinc-950">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/50">
                <MapPin className="h-4 w-4 text-zinc-950/60" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">
                  LOCATION
                </p>
                <p className="text-sm font-black text-zinc-950 truncate max-w-[220px]">
                  {[booking.turf?.address, booking.turf?.city].filter(Boolean).join(", ") || "Venue address"}
                </p>
              </div>
            </div>

            {/* Deposit + Total */}
            {booking.depositAmount !== undefined && booking.depositAmount > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-zinc-950/10 px-4 py-2 w-fit">
                <Check className="h-4 w-4 text-zinc-950" />
                <span className="text-xs font-black text-zinc-950 uppercase tracking-wide">
                  Deposit Paid (₹{booking.depositAmount})
                </span>
              </div>
            )}

            <p className="text-3xl font-black text-zinc-950">₹{booking.amount}</p>
          </div>
        </div>
      ) : (
        /* Fallback if booking data didn't load */
        <div className="relative z-10 mt-8 rounded-3xl bg-lime-500 p-8 text-center">
          <p className="text-sm font-bold text-zinc-950/70">
            Your booking has been created successfully.
          </p>
        </div>
      )}

      {/* View Booking Button */}
      <div className="relative z-10 mt-6">
        <Link
          href={bookingId ? `/bookings/${bookingId}` : "/bookings"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-500 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-lime-300/40 hover:bg-lime-400 transition"
        >
          <span>View Booking Details</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-lime-500" />
          <p className="text-sm font-semibold text-zinc-500">Loading...</p>
        </div>
      }
    >
      <BookingSuccessInner />
    </Suspense>
  );
}
