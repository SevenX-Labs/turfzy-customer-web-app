"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingService, splitService } from "@/services";
import type { Booking } from "@/types/domain";
import { Spinner } from "@/components/ui";
import {
  ArrowLeft, Calendar, Clock, MapPin, Check, QrCode,
  RefreshCw, FileText, Users, Share2, Download, Loader2,
  Plus, X as XIcon, Info
} from "lucide-react";

type QrStatus = "PENDING" | "UPCOMING" | "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
type SplitData = { totalCost: number; collected: number; pending: number; settledPercent: number; players: { id: string; username: string; name?: string; amount: number; status: string }[] } | null;

function getQrStatus(booking: Booking): QrStatus {
  if (booking.bookingStatus === "COMPLETED") return "COMPLETED";
  if (booking.bookingStatus === "CANCELLED") return "CANCELLED";
  if (booking.bookingStatus === "NO_SHOW") return "NO_SHOW";
  if (booking.bookingStatus !== "CONFIRMED") return "PENDING";
  const now = new Date();
  const bd = new Date(booking.bookingDate);
  const [sH, sM] = booking.startTime.split(":").map(Number);
  const [eH, eM] = booking.endTime.split(":").map(Number);
  const slotStart = new Date(bd); slotStart.setHours(sH, sM, 0, 0);
  const slotEnd = new Date(bd); slotEnd.setHours(eH, eM, 0, 0);
  if (slotEnd <= slotStart) slotEnd.setDate(slotEnd.getDate() + 1);
  const windowStart = new Date(slotStart.getTime() - 10 * 60000);
  const windowEnd = new Date(slotEnd.getTime() + 10 * 60000);
  if (now < windowStart) return "UPCOMING";
  if (now >= windowStart && now <= windowEnd) return "ACTIVE";
  return "EXPIRED";
}

function formatDate(s: string) {
  try { return new Date(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch { return s; }
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [splitData, setSplitData] = useState<SplitData>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitUsername, setSplitUsername] = useState("");
  const [splitError, setSplitError] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);

  useEffect(() => {
    bookingService.get(id).then((r) => setBooking(r.data)).catch((e) => setError(e.message ?? "Could not load booking."));
  }, [id]);

  useEffect(() => {
    if (!booking || !["CONFIRMED", "COMPLETED"].includes(booking.bookingStatus)) return;
    setSplitLoading(true);
    splitService.details(id).then((r: any) => {
      const d = r.data;
      if (d && d.players) {
        const players = d.players || [];
        const collected = players.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const total = d.totalCost || booking.amount;
        setSplitData({ totalCost: total, collected, pending: total - collected, settledPercent: total > 0 ? Math.round((collected / total) * 100) : 0, players });
      }
    }).catch(() => {}).finally(() => setSplitLoading(false));
  }, [id, booking]);

  const confirmCancel = async () => {
    setIsSubmittingCancel(true);
    try {
      await bookingService.cancel(id, "Cancelled from web app");
      setShowCancelModal(false);
      router.push("/bookings");
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? "Could not cancel booking.");
      setShowCancelModal(false);
    } finally { setIsSubmittingCancel(false); }
  };

  const handleAddPlayer = async () => {
    if (!splitUsername.trim()) return;
    setAddingPlayer(true); setSplitError("");
    try {
      await splitService.addPlayers(id, [splitUsername.trim()]);
      setSplitUsername("");
      const r: any = await splitService.details(id);
      const d = r.data;
      if (d?.players) {
        const players = d.players;
        const collected = players.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const total = d.totalCost || booking!.amount;
        setSplitData({ totalCost: total, collected, pending: total - collected, settledPercent: total > 0 ? Math.round((collected / total) * 100) : 0, players });
      }
    } catch (e: any) { setSplitError(e.message ?? "Could not add player."); }
    finally { setAddingPlayer(false); }
  };

  const handleRebook = () => { if (booking?.turfId) router.push(`/book-slot?turfId=${booking.turfId}`); };

  if (!booking) return <div className="grid min-h-[60vh] place-items-center">{error ? <p className="text-sm text-red-600 font-bold">{error}</p> : <Spinner />}</div>;

  const qrStatus = getQrStatus(booking);
  const statusColor: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", CONFIRMED: "bg-green-100 text-green-800", COMPLETED: "bg-blue-100 text-blue-800", CANCELLED: "bg-red-100 text-red-800", NO_SHOW: "bg-zinc-200 text-zinc-700" };
  const sClass = statusColor[booking.bookingStatus] || "bg-zinc-100 text-zinc-700";

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-4">
      {/* Header */}
      <header className="flex items-center gap-4 py-3">
        <button onClick={() => router.push("/bookings")} className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition">
          <ArrowLeft className="h-5 w-5 text-zinc-700" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-lime-600">BOOKING DETAILS</p>
          <h1 className="text-lg font-black text-zinc-900">{booking.turf?.name ?? "Booking"}</h1>
        </div>
      </header>

      {error && <div className="mb-4 flex gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs text-red-600"><Info className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}

      {/* Ticket Card */}
      <div className="mt-4">
        <div className="rounded-t-3xl bg-lime-500 px-6 pt-5 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">BOOKING ID</p>
              <h2 className="text-2xl font-black text-zinc-950">#{booking.displayId}</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${sClass}`}>{booking.bookingStatus}</span>
          </div>
        </div>
        <div className="relative flex items-center bg-lime-500">
          <div className="absolute -left-3 h-6 w-6 rounded-full bg-zinc-50" />
          <div className="w-full border-t-2 border-dashed border-lime-400/60" />
          <div className="absolute -right-3 h-6 w-6 rounded-full bg-zinc-50" />
        </div>
        <div className="rounded-b-3xl bg-lime-500 px-6 pt-4 pb-6 space-y-4">
          <h3 className="text-xl font-black text-zinc-950">{booking.turf?.name ?? "Venue"}</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/50"><Calendar className="h-4 w-4 text-zinc-950/60" /></div>
            <div><p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">DATE</p><p className="text-sm font-black text-zinc-950">{formatDate(booking.bookingDate)}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/50"><Clock className="h-4 w-4 text-zinc-950/60" /></div>
            <div><p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">TIME SLOT</p><p className="text-sm font-black text-zinc-950">{booking.startTime} - {booking.endTime}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/50"><MapPin className="h-4 w-4 text-zinc-950/60" /></div>
            <div><p className="text-[10px] font-black uppercase tracking-wider text-lime-900/60">LOCATION</p><p className="text-sm font-black text-zinc-950 truncate max-w-[220px]">{[booking.turf?.address, booking.turf?.city].filter(Boolean).join(", ") || "Venue"}</p></div>
          </div>
          {booking.depositAmount !== undefined && booking.depositAmount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-zinc-950/10 px-4 py-2 w-fit">
              <Check className="h-4 w-4 text-zinc-950" />
              <span className="text-xs font-black text-zinc-950 uppercase tracking-wide">Deposit Paid (₹{booking.depositAmount})</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-zinc-950">₹{booking.amount}</p>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400/40 hover:bg-lime-400/60 transition">
              <Share2 className="h-4 w-4 text-zinc-950/60" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      {booking.bookingStatus === "CONFIRMED" && (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-lime-600" />
            <h3 className="font-black text-zinc-900 text-sm">Check-in QR Code</h3>
          </div>
          {qrStatus === "UPCOMING" && (
            <div className="space-y-2">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-zinc-100 border border-dashed border-zinc-300">
                <QrCode className="h-12 w-12 text-zinc-300" />
              </div>
              <p className="text-xs text-zinc-500">QR will be available 10 minutes before your booking.</p>
            </div>
          )}
          {qrStatus === "ACTIVE" && booking.qrCode && (
            <div className="space-y-2">
              <div className="mx-auto w-fit rounded-2xl border-2 border-lime-500 p-2 bg-white shadow-md">
                <img src={booking.qrCode} alt="Check-in QR" className="h-40 w-40" />
              </div>
              <p className="text-xs font-bold text-lime-700">Show this QR at the turf to check in.</p>
              {booking.checkInPin && (
                <p className="text-xs text-zinc-500">PIN: <span className="font-black text-zinc-800 tracking-widest">{booking.checkInPin}</span></p>
              )}
            </div>
          )}
          {qrStatus === "ACTIVE" && !booking.qrCode && (
            <div className="space-y-2">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-lime-50 border border-lime-200">
                <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
              </div>
              <p className="text-xs text-zinc-500">Generating your QR code...</p>
            </div>
          )}
          {qrStatus === "EXPIRED" && (
            <div className="space-y-2">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
                <QrCode className="h-12 w-12 text-red-300" />
              </div>
              <p className="text-xs font-bold text-red-600">QR Expired</p>
            </div>
          )}
        </div>
      )}

      {/* Team Settlement Card */}
      {splitData && (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-100">
              <Users className="h-5 w-5 text-lime-700" />
            </div>
            <div>
              <p className="font-black text-zinc-900 text-sm">Team Settlement</p>
              <p className="text-xs text-zinc-500">{splitData.players.length} players · ₹{splitData.totalCost}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">{splitData.collected} SETTLED</span>
            <span className={`font-black ${splitData.settledPercent === 100 ? "text-green-600" : "text-lime-600"}`}>{splitData.settledPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${splitData.settledPercent}%` }} />
          </div>

          {/* Add teammate */}
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <span className="text-zinc-400 font-bold">@</span>
              <input value={splitUsername} onChange={(e) => setSplitUsername(e.target.value)} placeholder="Username" className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()} />
            </div>
            <button onClick={handleAddPlayer} disabled={addingPlayer || !splitUsername.trim()} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-100 text-lime-700 hover:bg-lime-200 transition disabled:opacity-50">
              {addingPlayer ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            </button>
          </div>
          {splitError && <p className="text-xs text-red-600 font-bold">{splitError}</p>}

          {/* Player list */}
          {splitData.players.length > 0 && (
            <div className="space-y-2">
              {splitData.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-black text-zinc-700">{(p.name || p.username || "?")[0].toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">{p.name || p.username}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${p.status === "PAID" ? "text-green-600" : "text-amber-600"}`}>{p.status}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-zinc-800">₹{p.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {booking.turfId && (
          <button onClick={handleRebook} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-500 py-4 text-sm font-black text-zinc-950 shadow-lg shadow-lime-300/40 hover:bg-lime-400 transition">
            <RefreshCw className="h-4 w-4" /><span>BOOK AGAIN</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push(`/bookings/${id}/split`)} className="flex items-center justify-center gap-2 rounded-2xl border border-lime-200 bg-lime-50 py-3.5 text-sm font-black text-lime-700 hover:bg-lime-100 transition">
            <Users className="h-4 w-4" /><span>SPLIT</span>
          </button>
          <a href={bookingService.invoicePdfUrl(id)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3.5 text-sm font-black text-zinc-700 hover:bg-zinc-50 transition">
            <FileText className="h-4 w-4" /><span>INVOICE</span>
          </a>
        </div>

        {["PENDING", "CONFIRMED"].includes(booking.bookingStatus) && (
          <button onClick={() => setShowCancelModal(true)} className="w-full rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-black text-red-600 hover:bg-red-100 transition">
            Cancel Booking
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200">
            <h2 className="text-xl font-black text-zinc-900">Cancel Booking?</h2>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-zinc-600 leading-6">Are you sure you want to cancel this booking?</p>
              <p className="text-sm text-zinc-600 leading-6">Refund, if applicable, will be processed based on our cancellation policy and the time remaining before your slot.</p>
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 leading-5">
                Please note: late cancellations may not be eligible for a refund, and repeated late cancellations can temporarily disable the Full Cash payment option.
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button disabled={isSubmittingCancel} onClick={() => setShowCancelModal(false)} className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-200 transition disabled:opacity-50 sm:w-auto">Keep Booking</button>
              <button disabled={isSubmittingCancel} onClick={confirmCancel} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-50 sm:w-auto flex items-center justify-center gap-2">
                {isSubmittingCancel ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Cancelling...</> : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
