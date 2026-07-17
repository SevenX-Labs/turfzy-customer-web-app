"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { bookingService } from "@/services";
import { Button, Field } from "@/components/ui";
import type { PaymentType } from "@/types/domain";

export default function BookSlotPage() {
  const params = useSearchParams();
  const router = useRouter();
  const turfId = params.get("turfId") ?? "";
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("18:00");
  const [durationMins, setDuration] = useState(60);
  const [type, setType] = useState<PaymentType>("FULL_ONLINE");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!turfId) return setError("A turf must be selected before booking.");
    setBusy(true);
    setError("");
    try {
      await bookingService.availability(turfId, date);
      const [hours, minutes] = startTime.split(":").map(Number);
      const end = new Date(2000, 0, 1, hours, minutes + durationMins);
      const endTime = end.toTimeString().slice(0, 5);
      const body = { turfId, bookingDate: date, startTime, endTime, durationMins, paymentType: type };
      const result = type === "FULL_CASH"
        ? await bookingService.quickPayAtTurf(body)
        : await bookingService.create(body);
      router.push(`/booking-success?id=${result.data.id}`);
    } catch (caughtError: unknown) {
      setError((caughtError as { message?: string }).message ?? "Could not create booking.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-2xl p-5 lg:p-9"><p className="text-sm font-bold uppercase tracking-widest text-lime-700">Booking</p><h1 className="mt-1 text-4xl font-black">Choose your slot</h1><form onSubmit={submit} className="mt-7 space-y-5 rounded-3xl bg-white p-6 shadow-sm"><label className="block text-sm font-bold">Date<Field type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)} className="mt-2" /></label><label className="block text-sm font-bold">Start time<Field type="time" value={startTime} onChange={event => setStartTime(event.target.value)} className="mt-2" /></label><label className="block text-sm font-bold">Duration<select value={durationMins} onChange={event => setDuration(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"><option value={60}>1 hour</option><option value={90}>90 minutes</option><option value={120}>2 hours</option></select></label><label className="block text-sm font-bold">Payment<select value={type} onChange={event => setType(event.target.value as PaymentType)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3"><option value="FULL_ONLINE">Pay online</option><option value="HALF_ONLINE_HALF_CASH">Pay half online, half at turf</option><option value="FULL_CASH">Pay at turf</option></select></label>{error && <p className="text-sm font-bold text-red-600">{error}</p>}<Button disabled={busy} className="w-full">{busy ? "Creating booking..." : "Continue to payment"}</Button></form></div>;
}
