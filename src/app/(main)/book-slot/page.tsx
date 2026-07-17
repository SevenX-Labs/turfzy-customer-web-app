"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { bookingService, turfService, profileService } from "@/services";
import { Button } from "@/components/ui";
import type { PaymentType, Turf } from "@/types/domain";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
  Info,
  MapPin,
  ArrowRight,
  Loader2
} from "lucide-react";

// Platform fee slab type definition
type PlatformFeeSlab = {
  id: string;
  minAmount: number;
  maxAmount: number;
  platformFee: number;
  isActive: boolean;
};

// Main interactive booking component
function BookSlotInner() {
  const params = useSearchParams();
  const router = useRouter();
  const turfId = params.get("turfId") ?? "";

  // Core state variables
  const [step, setStep] = useState<"SLOT" | "CHECKOUT">("SLOT");
  const [turf, setTurf] = useState<Turf | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; phone?: string; email?: string } | null>(null);
  
  // Date and slot selection states
  const [dates, setDates] = useState<{ isoString: string; dayName: string; dayNum: number; monthName: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availability, setAvailability] = useState<{
    openTime: string;
    closeTime: string;
    bookedSlots: { startTime: string; endTime: string; isExpired?: boolean }[];
    pricing: {
      dayPrice: number;
      nightPrice: number;
      nightStartsAt: string;
      isWeekend: boolean;
    };
  } | null>(null);
  
  const [startTimes, setStartTimes] = useState<string[]>([]);
  const [endTimes, setEndTimes] = useState<string[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [sport, setSport] = useState("BOTH");
  
  // Platform fee slabs
  const [slabs, setSlabs] = useState<PlatformFeeSlab[]>([]);

  // Checkout payment selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>("FULL_ONLINE");

  // Loading/Error states
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 1. Generate next 7 days & fetch initial turf details/slabs
  useEffect(() => {
    if (!turfId) {
      setError("No turf ID provided in the URL.");
      setLoading(false);
      return;
    }

    // Generate date array
    const generatedDates = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      generatedDates.push({
        isoString: d.toISOString().slice(0, 10),
        dayName: daysOfWeek[d.getDay()],
        dayNum: d.getDate(),
        monthName: months[d.getMonth()]
      });
    }

    setDates(generatedDates);
    setSelectedDate(generatedDates[0].isoString);

    // Fetch turf details, user profile, and active platform fee slabs
    Promise.all([
      turfService.details(turfId),
      profileService.get().catch(() => null),
      bookingService.platformFee().catch(() => null)
    ])
      .then(([turfRes, profileRes, slabsRes]) => {
        setTurf(turfRes.data);
        if (profileRes?.data) {
          setUserProfile(profileRes.data);
        }
        if (slabsRes?.data) {
          setSlabs(slabsRes.data as PlatformFeeSlab[]);
        }
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load venue details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [turfId]);

  // 2. Fetch slot availability when selected date changes
  useEffect(() => {
    if (!turfId || !selectedDate) return;

    setSlotsLoading(true);
    // Reset selected slots when switching days
    setSelectedStartTime(null);
    setSelectedEndTime(null);

    bookingService.availability(turfId, selectedDate)
      .then((res) => {
        const data = res.data;
        setAvailability({
          openTime: data.openTime,
          closeTime: data.closeTime,
          bookedSlots: data.bookedSlots || [],
          pricing: {
            dayPrice: Number((data.pricing as any)?.dayPrice ?? 0),
            nightPrice: Number((data.pricing as any)?.nightPrice ?? 0),
            nightStartsAt: String((data.pricing as any)?.nightStartsAt ?? "18:00"),
            isWeekend: Boolean((data.pricing as any)?.isWeekend ?? false)
          }
        });
        
        // Generate list of hourly slot start times
        const open = data.openTime || "06:00";
        const close = data.closeTime || "23:00";
        const times = generateStartTimes(open, close);
        setStartTimes(times);
      })
      .catch((err) => {
        setError(err.message ?? "Could not load slot availability.");
      })
      .finally(() => {
        setSlotsLoading(false);
      });
  }, [turfId, selectedDate]);

  // 3. Generate end times when start time selection changes
  useEffect(() => {
    if (!selectedStartTime || !availability) {
      setEndTimes([]);
      setSelectedEndTime(null);
      return;
    }

    const open = availability.openTime || "06:00";
    const close = availability.closeTime || "23:00";
    
    // Find the first booked/disabled slot that starts AFTER the selected start time
    const futureBookings = availability.bookedSlots
      .filter(s => s.startTime > selectedStartTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const nextBookedTime = futureBookings.length > 0 ? futureBookings[0].startTime : close;
    
    // Generate end times from (start + 1 hour) up to the next booked time boundary
    const ends = generateEndTimes(selectedStartTime, nextBookedTime);
    setEndTimes(ends);
    
    // Auto-select the first end time (+1 hour)
    if (ends.length > 0) {
      setSelectedEndTime(ends[0]);
    } else {
      setSelectedEndTime(null);
    }
  }, [selectedStartTime, availability]);

  // 4. Default to first payment preference supported by the turf
  useEffect(() => {
    if (turf && step === "CHECKOUT") {
      const prefs = turf.paymentPreferences || ["FULL_ONLINE", "ADVANCE_PAYMENT", "FULL_CASH"];
      if (prefs.includes("FULL_ONLINE")) {
        setPaymentMethod("FULL_ONLINE");
      } else if (prefs.includes("ADVANCE_PAYMENT")) {
        setPaymentMethod("HALF_ONLINE_HALF_CASH");
      } else if (prefs.includes("FULL_CASH")) {
        setPaymentMethod("FULL_CASH");
      }
    }
  }, [turf, step]);

  // --- Utility functions for hourly slot generation ---
  const generateStartTimes = (open: string, close: string) => {
    const list: string[] = [];
    let [startH] = open.split(":").map(Number);
    let [endH] = close.split(":").map(Number);

    if (open === close) {
      // 24 Hours
      for (let h = 0; h < 24; h++) {
        list.push(`${h.toString().padStart(2, "0")}:00`);
      }
      return list;
    }

    let current = startH;
    const target = close < open ? endH + 24 : endH;

    // Last start slot starts 1 hour before closing
    while (current < target) {
      const h = current % 24;
      list.push(`${h.toString().padStart(2, "0")}:00`);
      current++;
    }
    return list;
  };

  const generateEndTimes = (startStr: string, limitStr: string) => {
    const list: string[] = [];
    let [startH] = startStr.split(":").map(Number);
    let [limitH] = limitStr.split(":").map(Number);

    const target = limitStr < startStr ? limitH + 24 : limitH;
    let current = startH + 1;

    while (current <= target) {
      const h = current % 24;
      list.push(`${h.toString().padStart(2, "0")}:00`);
      current++;
    }
    return list;
  };

  const isSlotBooked = (timeStr: string) => {
    if (!availability?.bookedSlots) return false;
    return availability.bookedSlots.some(slot => {
      return timeStr >= slot.startTime && timeStr < slot.endTime;
    });
  };

  // --- Duration & Price Computations ---
  const getDurationInMinutes = () => {
    if (!selectedStartTime || !selectedEndTime) return 0;
    const [startH] = selectedStartTime.split(":").map(Number);
    const [endH] = selectedEndTime.split(":").map(Number);
    let diff = endH - startH;
    if (diff < 0) diff += 24;
    return diff * 60;
  };

  const getDurationString = () => {
    const mins = getDurationInMinutes();
    if (mins === 0) return "Not selected";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const calculateGroundCharges = () => {
    if (!selectedStartTime || !selectedEndTime || !availability) return 0;
    const durationMins = getDurationInMinutes();
    const [startH] = selectedStartTime.split(":").map(Number);
    const nightStartH = parseInt(availability.pricing.nightStartsAt.split(":")[0], 10);
    
    const isNight = startH >= nightStartH;
    const isWeekend = availability.pricing.isWeekend;

    let rate = 0;
    if (isWeekend) {
      rate = isNight ? availability.pricing.nightPrice : availability.pricing.dayPrice;
    } else {
      rate = isNight ? availability.pricing.nightPrice : availability.pricing.dayPrice;
    }

    return Math.round(rate * (durationMins / 60));
  };

  const groundCharges = calculateGroundCharges();

  // Retrieve active platform fee based on the matching slab range
  const getPlatformFee = () => {
    if (groundCharges === 0) return 0;
    const matched = slabs.find(
      (s) => groundCharges >= s.minAmount && groundCharges <= s.maxAmount
    );
    return matched ? matched.platformFee : 49; // Default to 49 if no slab matches
  };

  const platformFee = getPlatformFee();
  const totalBookingPrice = groundCharges + platformFee;

  // Split configurations (fixed 30% advance on ground charge + 100% platform fee)
  const groundAdvance = Math.round(groundCharges * 0.3);
  
  const getCheckoutAmounts = () => {
    if (paymentMethod === "FULL_ONLINE") {
      return {
        onlineNow: totalBookingPrice,
        payAtVenue: 0
      };
    } else if (paymentMethod === "HALF_ONLINE_HALF_CASH") {
      return {
        onlineNow: groundAdvance + platformFee,
        payAtVenue: groundCharges - groundAdvance
      };
    } else {
      // FULL_CASH
      return {
        onlineNow: 0,
        payAtVenue: totalBookingPrice
      };
    }
  };

  const { onlineNow, payAtVenue } = getCheckoutAmounts();

  // Helper: Format date string for displaying in summary
  const getFormattedDateString = (isoDate: string) => {
    if (!isoDate) return "";
    const matched = dates.find(d => d.isoString === isoDate);
    if (matched) {
      return `${matched.dayName}, ${matched.dayNum} ${matched.monthName}`;
    }
    return isoDate;
  };

  // --- Dynamic Razorpay SDK Loading & Order Checkout ---
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async () => {
    if (!selectedStartTime || !selectedEndTime || !selectedDate || !turf) return;
    
    setBusy(true);
    setError("");

    try {
      const body = {
        turfId: turf.id,
        bookingDate: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        durationMins: getDurationInMinutes(),
        paymentType: paymentMethod
      };

      // 1. If Pay at Turf (FULL_CASH), confirm booking immediately
      if (paymentMethod === "FULL_CASH") {
        const res = await bookingService.quickPayAtTurf(body);
        router.push(`/booking-success?id=${res.data.id}`);
        return;
      }

      // 2. Otherwise (FULL_ONLINE or HALF_ONLINE_HALF_CASH), load online flow
      const res = await bookingService.create(body);
      const booking = res.data;

      // Create Razorpay Order
      const orderRes = await bookingService.createRazorpayOrder(booking.id);
      const { orderId, amount, currency, keyId } = orderRes.data;

      // Load SDK
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay payment SDK. Check your internet connection.");
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Turfzy",
        description: `Booking for ${turf.name}`,
        order_id: orderId,
        prefill: {
          name: userProfile?.name || "",
          contact: userProfile?.phone || "",
          email: userProfile?.email || ""
        },
        theme: {
          color: "#84cc16"
        },
        handler: async function (response: any) {
          try {
            await bookingService.confirmPayment(booking.id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            router.push(`/booking-success?id=${booking.id}`);
          } catch (confirmError: any) {
            setError(confirmError.message ?? "Payment was successful, but confirmation failed. Please contact support.");
            setBusy(false);
          }
        },
        modal: {
          ondismiss: async function () {
            await bookingService.failOnlinePayment(booking.id).catch(() => null);
            setError("Payment cancelled. You can try confirming again.");
            setBusy(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (caughtError: any) {
      setError(caughtError.message ?? "An error occurred while creating booking.");
      setBusy(false);
    }
  };

  // Back button handling
  const handleBack = () => {
    if (step === "CHECKOUT") {
      setStep("SLOT");
    } else {
      router.push(`/turfs/${turfId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-lime-500" />
        <p className="text-sm font-semibold text-zinc-500">Loading booking setup...</p>
      </div>
    );
  }

  if (error && !turf) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center p-6 text-center">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-2xl font-black text-zinc-900">Setup Error</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-lime-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!turf) return null;

  // Retrieve payment preferences configured for this turf
  const allowedPreferences = turf.paymentPreferences || ["FULL_ONLINE", "ADVANCE_PAYMENT", "FULL_CASH"];

  return (
    <div className="mx-auto max-w-3xl p-4 pb-28 md:p-6 md:pb-32">
      {/* 1. Header Toolbar */}
      <header className="flex items-center gap-4 py-4">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-700" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-lime-600">
            {step === "SLOT" ? "BOOKING" : "CHECKOUT"}
          </p>
          <h1 className="text-xl font-black tracking-tight text-zinc-900">
            {step === "SLOT" ? turf.name : "Confirmation"}
          </h1>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          <Info className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* --- STEP 1: SLOT SELECTION --- */}
      {step === "SLOT" && (
        <div className="space-y-6">
          {/* Horizontal Date Picker */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">SELECT DATE</p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {dates.map((dateObj) => {
                const isSelected = selectedDate === dateObj.isoString;
                return (
                  <button
                    key={dateObj.isoString}
                    onClick={() => setSelectedDate(dateObj.isoString)}
                    className={`flex flex-col items-center justify-center min-w-[70px] h-[85px] rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-lime-500 border-lime-500 text-zinc-950 font-black shadow-md shadow-lime-300/30"
                        : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 font-bold"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wide opacity-80">{dateObj.dayName}</span>
                    <span className="text-lg mt-0.5">{dateObj.dayNum}</span>
                    <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-80">{dateObj.monthName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {slotsLoading ? (
            <div className="py-12 text-center text-sm font-semibold text-zinc-500 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-lime-500" />
              <span>Fetching available slots...</span>
            </div>
          ) : (
            <>
              {/* Start Time Grid */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">START TIME</p>
                {startTimes.length === 0 ? (
                  <p className="text-sm text-zinc-500">No operating hours defined for this day.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {startTimes.map((time) => {
                      const isBooked = isSlotBooked(time);
                      const isSelected = selectedStartTime === time;
                      return (
                        <button
                          key={time}
                          disabled={isBooked}
                          onClick={() => setSelectedStartTime(time)}
                          className={`py-3 px-4 rounded-2xl border text-center text-sm transition-all ${
                            isSelected
                              ? "bg-lime-500 border-lime-500 text-zinc-950 font-black shadow-md shadow-lime-300/30"
                              : isBooked
                              ? "bg-zinc-100 border-zinc-100 text-zinc-300 cursor-not-allowed"
                              : "bg-white border-zinc-200 text-zinc-800 font-bold hover:border-zinc-300"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* End Time Grid */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">END TIME</p>
                {!selectedStartTime ? (
                  <p className="text-sm text-zinc-500 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-5 text-center">
                    Select a start time to unlock end times.
                  </p>
                ) : endTimes.length === 0 ? (
                  <p className="text-sm text-zinc-500">No further slots available after this start time.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {endTimes.map((time) => {
                      const isSelected = selectedEndTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedEndTime(time)}
                          className={`py-3 px-4 rounded-2xl border text-center text-sm transition-all ${
                            isSelected
                              ? "bg-lime-500 border-lime-500 text-zinc-950 font-black shadow-md shadow-lime-300/30"
                              : "bg-white border-zinc-200 text-zinc-800 font-bold hover:border-zinc-300"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Duration Display */}
              {selectedStartTime && selectedEndTime && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 flex justify-between items-center text-sm">
                  <span className="font-bold text-zinc-500 uppercase tracking-wide text-xs">DURATION</span>
                  <span className="font-black text-zinc-800">{getDurationString()}</span>
                </div>
              )}

              {/* Select Sport */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">SELECT SPORT</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSport("BOTH")}
                    className="bg-lime-500 border border-lime-500 text-zinc-950 font-black py-3 px-6 rounded-2xl text-sm shadow-md shadow-lime-300/30"
                  >
                    BOTH
                  </button>
                </div>
              </div>

              {/* Booking Summary Card */}
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400 pb-1 border-b border-zinc-100">
                  BOOKING SUMMARY
                </p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-bold">Turf</span>
                    <span className="text-zinc-900 font-black">{turf.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-bold">Sport</span>
                    <span className="text-zinc-900 font-black">{sport}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-bold">Date</span>
                    <span className="text-zinc-900 font-black">{getFormattedDateString(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-bold">Time</span>
                    <span className="text-zinc-900 font-black">
                      {selectedStartTime && selectedEndTime
                        ? `${selectedStartTime} - ${selectedEndTime}`
                        : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-bold">Duration</span>
                    <span className="text-zinc-900 font-black">{getDurationString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-100 mt-3">
                  <span className="text-zinc-900 text-base font-black">Total Ground charges</span>
                  <span className="text-2xl font-black text-lime-600">₹{groundCharges}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- STEP 2: CHECKOUT CONFIRMATION --- */}
      {step === "CHECKOUT" && (
        <div className="space-y-6">
          {/* Booking Summary Ticket Header */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900">{turf.name}</h2>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                <span>{[turf.address, turf.city].filter(Boolean).join(", ")}</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-100 text-sm font-bold text-zinc-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-lime-600" />
                <span>{selectedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-lime-600" />
                <span>{selectedStartTime} - {selectedEndTime}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">PAYMENT METHOD</p>
            <div className="space-y-3">
              {/* Option 1: Full Online Payment */}
              {allowedPreferences.includes("FULL_ONLINE") && (
                <div
                  onClick={() => setPaymentMethod("FULL_ONLINE")}
                  className={`flex items-center justify-between p-5 border rounded-3xl bg-white cursor-pointer transition-all ${
                    paymentMethod === "FULL_ONLINE"
                      ? "border-lime-500 ring-1 ring-lime-500 bg-lime-50/10"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${paymentMethod === "FULL_ONLINE" ? "bg-lime-100 text-lime-700" : "bg-zinc-100 text-zinc-400"}`}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-zinc-800 text-sm">Full Online Payment</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Pay ₹{totalBookingPrice} now. Faster check-in.</p>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "FULL_ONLINE" ? "border-lime-500" : "border-zinc-300"
                  }`}>
                    {paymentMethod === "FULL_ONLINE" && (
                      <div className="h-3 w-3 rounded-full bg-lime-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Option 2: 30% Advance */}
              {allowedPreferences.includes("ADVANCE_PAYMENT") && (
                <div
                  onClick={() => setPaymentMethod("HALF_ONLINE_HALF_CASH")}
                  className={`flex items-center justify-between p-5 border rounded-3xl bg-white cursor-pointer transition-all ${
                    paymentMethod === "HALF_ONLINE_HALF_CASH"
                      ? "border-lime-500 ring-1 ring-lime-500 bg-lime-50/10"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${paymentMethod === "HALF_ONLINE_HALF_CASH" ? "bg-lime-100 text-lime-700" : "bg-zinc-100 text-zinc-400"}`}>
                      <Banknote className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-zinc-800 text-sm">30% Advance &amp; 70% Cash</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Pay ₹{groundAdvance + platformFee} now + ₹{groundCharges - groundAdvance} at turf.
                      </p>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "HALF_ONLINE_HALF_CASH" ? "border-lime-500" : "border-zinc-300"
                  }`}>
                    {paymentMethod === "HALF_ONLINE_HALF_CASH" && (
                      <div className="h-3 w-3 rounded-full bg-lime-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Option 3: Pay at Turf (FULL_CASH) */}
              {allowedPreferences.includes("FULL_CASH") && (
                <div
                  onClick={() => setPaymentMethod("FULL_CASH")}
                  className={`flex items-center justify-between p-5 border rounded-3xl bg-white cursor-pointer transition-all ${
                    paymentMethod === "FULL_CASH"
                      ? "border-lime-500 ring-1 ring-lime-500 bg-lime-50/10"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${paymentMethod === "FULL_CASH" ? "bg-lime-100 text-lime-700" : "bg-zinc-100 text-zinc-400"}`}>
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-zinc-800 text-sm">Pay at Turf</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Pay ₹{totalBookingPrice} at the turf.</p>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "FULL_CASH" ? "border-lime-500" : "border-zinc-300"
                  }`}>
                    {paymentMethod === "FULL_CASH" && (
                      <div className="h-3 w-3 rounded-full bg-lime-500" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bill Details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">BILL DETAILS</p>
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-3.5">
              <div className="flex justify-between items-center text-sm font-bold text-zinc-500">
                <span>Ground Charges ({getDurationString()})</span>
                <span className="text-zinc-800">₹{groundCharges}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-zinc-500">
                <span>Booking &amp; Platform Fee</span>
                <span className="text-zinc-800">₹{platformFee}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-zinc-500">
                <span>Taxes &amp; GST (0%)</span>
                <span className="text-zinc-800">₹0</span>
              </div>
              
              <div className="border-t border-zinc-100 my-2 pt-3 flex justify-between items-center text-zinc-950 font-black">
                <span>Total Booking Price</span>
                <span className="text-lime-600 text-lg">₹{totalBookingPrice}</span>
              </div>

              <div className="border-t border-zinc-100 my-2 pt-3 space-y-2.5 text-sm font-bold text-zinc-500">
                <div className="flex justify-between items-center">
                  <span>Pay Online Now</span>
                  <span className="text-zinc-900">₹{onlineNow}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pay at Venue</span>
                  <span className="text-zinc-900">₹{payAtVenue}</span>
                </div>
              </div>

              {/* Informative Guidance Alert Box */}
              <div className="mt-4 flex gap-2.5 items-start bg-lime-50/60 border border-lime-100 rounded-2xl p-4 text-xs text-zinc-600 leading-5">
                <Info className="h-4 w-4 text-lime-600 mt-0.5 flex-shrink-0" />
                <span>
                  {paymentMethod === "FULL_CASH"
                    ? `You will pay the full amount of ₹${totalBookingPrice} directly at the turf. You do not need to pay anything online now.`
                    : paymentMethod === "HALF_ONLINE_HALF_CASH"
                    ? `You will pay the advance of ₹${onlineNow} online now, and the remaining ₹${payAtVenue} directly at the turf.`
                    : `You will pay the full amount of ₹${totalBookingPrice} online now.`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 3. BOTTOM STICKY CONTROL BAR --- */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-2xl z-30">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            {step === "SLOT" ? "Total Amount" : "TO PAY NOW"}
          </p>
          <p className="text-2xl font-black text-zinc-900">
            ₹{step === "SLOT" ? groundCharges : onlineNow}
          </p>
          {step === "CHECKOUT" && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {onlineNow === 0 ? "Pay nothing online now" : "Online checkout"}
            </p>
          )}
        </div>

        {step === "SLOT" ? (
          selectedStartTime && selectedEndTime ? (
            <button
              onClick={() => setStep("CHECKOUT")}
              className="bg-lime-500 text-zinc-950 hover:bg-lime-400 font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-lime-300/40"
            >
              <span>PROCEED</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled
              className="bg-lime-200 text-lime-600 font-black px-8 py-4 rounded-2xl flex items-center gap-2 cursor-not-allowed opacity-75"
            >
              <span>PROCEED</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )
        ) : (
          <button
            disabled={busy}
            onClick={initiatePayment}
            className="bg-lime-500 text-zinc-950 hover:bg-lime-400 font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-lime-300/40 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <span>CONFIRM</span>
                <ArrowRight className="h-4 w-4 font-black" />
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}

// Wrapper for next.js static-compilation suspense requirements
export default function BookSlotPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-lime-500" />
        <p className="text-sm font-semibold text-zinc-500">Loading booking portal...</p>
      </div>
    }>
      <BookSlotInner />
    </Suspense>
  );
}
