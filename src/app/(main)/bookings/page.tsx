"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingService } from "@/services";
import type { Booking } from "@/types/domain";
import { Empty, Spinner } from "@/components/ui";
import { Calendar, Clock, MapPin, X } from "lucide-react";

function normalize(r: Booking[] | { data: Booking[] }) {
  return Array.isArray(r) ? r : r.data ?? [];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function BookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    bookingService
      .list()
      .then((res) => setItems(normalize(res as any)))
      .catch((e: any) => setError(e.message ?? "Failed to load bookings"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-5 lg:p-9">
      <p className="text-sm font-bold uppercase tracking-widest text-lime-700">Your schedule</p>
      <h1 className="mt-1 text-4xl font-black">My bookings</h1>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
          <X className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-16"><Spinner /></div>
      ) : items.length ? (
        <div className="mt-7 space-y-4">
          {items.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="group block rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-black text-zinc-900">{b.turf?.name ?? "Turf booking"}</p>
                    <p className="mt-1 text-sm text-zinc-500">#{b.displayId}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
                    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-2">
                      <Calendar className="h-4 w-4 text-lime-600" />
                      {formatDate(b.bookingDate)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-2">
                      <Clock className="h-4 w-4 text-lime-600" />
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                    </span>
                    {b.turf?.city && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-2">
                        <MapPin className="h-4 w-4 text-lime-600" />
                        {b.turf.city}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    b.bookingStatus === "CANCELLED"
                      ? "bg-red-100 text-red-700"
                      : b.bookingStatus === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : b.bookingStatus === "COMPLETED"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {b.bookingStatus}
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                <p className="text-sm font-black text-zinc-900">₹{b.amount}</p>
                <span className="text-sm font-semibold text-lime-700 group-hover:underline">View details</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8"><Empty title="No bookings yet">Find a turf and reserve your first game.</Empty></div>
      )}
    </div>
  );
}
