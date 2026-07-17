"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingService } from "@/services";
import type { Booking } from "@/types/domain";
import { Empty, Spinner } from "@/components/ui";
import { X } from "lucide-react";

function normalize(r: Booking[] | { data: Booking[] }) {
  return Array.isArray(r) ? r : r.data ?? [];
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
        <div className="mt-7 space-y-3">
          {items.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-5 transition hover:shadow-lg"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{b.turf?.name ?? "Turf booking"}</p>
                  <p className="mt-1 text-sm text-zinc-500">{b.bookingDate} · {b.startTime}–{b.endTime}</p>
                </div>
                <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-800">{b.bookingStatus}</span>
              </div>
              <p className="mt-4 text-sm font-bold">#{b.displayId} <span className="ml-3 text-zinc-500">₹{b.amount}</span></p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8"><Empty title="No bookings yet">Find a turf and reserve your first game.</Empty></div>
      )}
    </div>
  );
}
