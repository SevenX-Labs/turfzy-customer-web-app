"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingService } from "@/services";
import type { Booking } from "@/types/domain";
import { Button, Spinner } from "@/components/ui";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    bookingService
      .get(id)
      .then((r) => setBooking(r.data))
      .catch((e) => setError(e.message ?? "Could not load booking."));
  }, [id]);

  const confirmCancel = async () => {
    setIsSubmittingCancel(true);
    try {
      await bookingService.cancel(id, "Cancelled from web app");
      setShowCancelModal(false);
      router.push("/bookings");
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? "Could not cancel booking.");
      setShowCancelModal(false);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  if (!booking) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        {error || <Spinner />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-5 lg:p-9 relative">
      <p className="text-sm font-bold uppercase tracking-widest text-lime-700">
        Booking #{booking.displayId}
      </p>
      <h1 className="mt-1 text-4xl font-black text-zinc-900">
        {booking.turf?.name ?? "Your game"}
      </h1>

      <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-500">Date & time</dt>
            <dd className="mt-1 font-black text-zinc-800">
              {booking.bookingDate} · {booking.startTime}–{booking.endTime}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Status</dt>
            <dd className="mt-1 font-black text-zinc-800">
              {booking.bookingStatus} / {booking.paymentStatus}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Amount</dt>
            <dd className="mt-1 font-black text-zinc-800">₹{booking.amount}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Outstanding</dt>
            <dd className="mt-1 font-black text-zinc-800">₹{booking.amountToPay}</dd>
          </div>
        </dl>

        {error && <p className="mt-5 text-sm font-bold text-red-600">{error}</p>}

        {["PENDING", "CONFIRMED"].includes(booking.bookingStatus) && (
          <Button
            onClick={() => setShowCancelModal(true)}
            className="mt-7 bg-red-100 text-red-700 hover:bg-red-200"
          >
            Cancel booking
          </Button>
        )}
      </section>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-zinc-900">Cancel Booking?</h2>
            
            <div className="mt-4 space-y-3">
              <p className="text-sm text-zinc-600 leading-6">
                Are you sure you want to cancel this booking?
              </p>
              <p className="text-sm text-zinc-600 leading-6">
                Refund, if applicable, will be processed based on our cancellation policy and the time remaining before your slot.
              </p>
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 leading-5">
                Please note: late cancellations may not be eligible for a refund, and repeated late cancellations can temporarily disable the Full Cash payment option.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                disabled={isSubmittingCancel}
                onClick={() => setShowCancelModal(false)}
                className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-200 transition disabled:opacity-50 sm:w-auto"
              >
                Keep Booking
              </button>
              <button
                disabled={isSubmittingCancel}
                onClick={confirmCancel}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-50 sm:w-auto flex items-center justify-center gap-2"
              >
                {isSubmittingCancel ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Booking"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
