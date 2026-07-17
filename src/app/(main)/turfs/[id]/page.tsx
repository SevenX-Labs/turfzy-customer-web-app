"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { turfService } from "@/services";
import type { Turf } from "@/types/domain";
import { Button } from "@/components/ui";

function TurfDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse p-5 lg:p-9">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-64 rounded-3xl bg-zinc-200 md:h-[450px]" />
        <div className="hidden h-64 rounded-3xl bg-zinc-200 md:block md:h-[450px]" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_330px]">
        <div className="space-y-4">
          <div className="h-4 w-28 rounded bg-zinc-200" />
          <div className="h-10 max-w-md rounded bg-zinc-200" />
          <div className="h-5 max-w-sm rounded bg-zinc-100" />
          <div className="mt-8 h-20 max-w-xl rounded bg-zinc-100" />
        </div>
        <div className="h-44 rounded-3xl bg-zinc-100" />
      </div>
    </div>
  );
}

export default function TurfPage() {
  const { id } = useParams<{ id: string }>();
  const [loadedTurf, setLoadedTurf] = useState<{ id: string; turf: Turf } | null>(() => {
    const cachedTurf = turfService.cached(id);
    return cachedTurf ? { id, turf: cachedTurf } : null;
  });
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      const cachedTurf = turfService.cached(id);
      setError("");
      turfService
        .details(id)
        .then((response) => {
          setLoadedTurf({ id, turf: response.data });
        })
        .catch((caughtError: unknown) => {
          if (cachedTurf) setLoadedTurf({ id, turf: cachedTurf });
          else setError((caughtError as { message?: string }).message ?? "Could not load this turf.");
        });
    })();
  }, [id]);

  const turf = loadedTurf?.id === id ? loadedTurf.turf : turfService.cached(id) ?? null;

  // Gather media assets
  const images = turf?.images?.length
    ? turf.images
    : turf
    ? ([turf.entranceUrl, turf.groundDayUrl, turf.groundNightUrl].filter(Boolean) as string[])
    : [];

  // Auto-slide effect for images
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [images]);

  if (!turf && error) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center p-6 text-center">
        <div>
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-2xl font-black">Turf details unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-zinc-950"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!turf) return <TurfDetailSkeleton />;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutesStr} ${ampm}`;
  };

  // Amenities mapping
  const amenitiesList = [
    turf.floodLights && { label: "Floodlights", icon: "💡" },
    turf.parking && { label: "Parking Available", icon: "🚗" },
    turf.washroom && { label: "Washrooms", icon: "🧼" },
    turf.changingRoom && { label: "Changing Rooms", icon: "👕" },
    turf.drinkingWater && { label: "Drinking Water", icon: "🥤" },
    turf.seatingArea && { label: "Seating Area", icon: "🪑" },
    turf.cafeteria && { label: "Cafeteria", icon: "☕" },
  ].filter(Boolean) as { label: string; icon: string }[];

  const finalAmenities = amenitiesList.length
    ? amenitiesList
    : [
        { label: "Verified Venue", icon: "🛡️" },
        { label: "Secure Booking", icon: "🔒" },
        { label: "Sport-ready Ground", icon: "🌱" },
      ];

  // Pricing helper
  const prices = {
    weekdayDay: turf.weekdayDayPrice ?? turf.dayPrice ?? 0,
    weekdayNight: turf.weekdayNightPrice ?? turf.nightPrice ?? 0,
    weekendDay: turf.weekendDayPrice ?? turf.dayPrice ?? 0,
    weekendNight: turf.weekendNightPrice ?? turf.nightPrice ?? 0,
  };

  const startingPrice = Math.min(...Object.values(prices).filter(p => p > 0));

  // Default rules
  const rulesList = turf.rules?.length
    ? turf.rules
    : [
        "No smoking inside the turf.",
        "Wear proper non-marking sports shoes.",
        "Please arrive 10 minutes before your slot.",
        "Management is not responsible for loss of personal belongings.",
      ];

  // Helper for reviews stars
  const renderStars = (ratingNum: number) => {
    const filled = Math.round(ratingNum);
    return (
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-lg">
            {i < filled ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-5 lg:p-9">
      {/* 1. Media Section: Auto-sliding Image Carousel */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 shadow-inner h-[280px] sm:h-[380px] md:h-[480px]">
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={`${turf.name} ${currentImageIndex + 1}`}
            className="h-full w-full object-cover transition-opacity duration-700"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            No photos available
          </div>
        )}

        {/* Slide Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  idx === currentImageIndex ? "bg-lime-400 scale-110" : "bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Main Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Left Column: Details */}
        <article className="space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-lime-800">
                {turf.sportsType ?? "Venue"}
              </span>
              {turf.rating !== undefined && turf.rating > 0 && (
                <span className="flex items-center gap-1 text-sm font-bold text-amber-700">
                  ★ {turf.rating.toFixed(1)}
                  {turf.reviewCount !== undefined && turf.reviewCount > 0 && (
                    <span className="text-zinc-400 font-normal">({turf.reviewCount} reviews)</span>
                  )}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">{turf.name}</h1>
            <p className="mt-2 text-sm text-zinc-500">
              📍 {[turf.address, turf.city, turf.pincode].filter(Boolean).join(", ")}
            </p>
            {turf.openTime && turf.closeTime && (
              <p className="mt-2 text-sm font-semibold text-zinc-700">
                🕒 Timings: {formatTime(turf.openTime)} - {formatTime(turf.closeTime)}
              </p>
            )}
          </div>

          {/* Mobile Booking Card (Only visible on screens smaller than lg) */}
          <div className="block lg:hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-md">
            <div className="space-y-1">
              <span className="text-sm text-zinc-500">Starting from</span>
              <p className="text-3xl font-black text-zinc-900">
                ₹{startingPrice}
                <span className="text-sm font-normal text-zinc-500"> / hour</span>
              </p>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 space-y-3">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>📅 Instant confirmation</span>
                  <span className="font-bold text-green-700">⚡ Available</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>⚽ Size</span>
                  <span className="font-bold">{turf.turfSize}</span>
                </div>
              </div>

              <Link href={`/book-slot?turfId=${turf.id}`} className="block">
                <Button className="w-full py-4 text-base font-black shadow-lg shadow-lime-300/40">
                  Book Slot
                </Button>
              </Link>
            </div>
          </div>

          <hr className="border-zinc-200" />

          {/* Description */}
          <div>
            <h2 className="text-xl font-black text-zinc-900">About the Venue</h2>
            <p className="mt-3 leading-7 text-zinc-600 whitespace-pre-line">
              {turf.description ?? "A premium venue ready for your next game. Ideal for team training, friendly matches, or league tournaments."}
            </p>
          </div>

          <hr className="border-zinc-200" />

          {/* Pricing Grid */}
          <div>
            <h2 className="text-xl font-black text-zinc-900">Pricing structure</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="font-bold text-zinc-800">Weekdays (Mon - Fri)</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">☀️ Day Slot (Before Sunset)</span>
                    <span className="font-bold">₹{prices.weekdayDay}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">🌙 Night Slot (After Sunset)</span>
                    <span className="font-bold">₹{prices.weekdayNight}/hr</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="font-bold text-zinc-800">Weekends (Sat - Sun)</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">☀️ Day Slot (Before Sunset)</span>
                    <span className="font-bold">₹{prices.weekendDay}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">🌙 Night Slot (After Sunset)</span>
                    <span className="font-bold">₹{prices.weekendNight}/hr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promo Video (Placed above Amenities, clean and properly sized) */}
          {turf.videoUrl && (
            <>
              <hr className="border-zinc-200" />
              <div>
                <h2 className="text-xl font-black text-zinc-900">Promo Video</h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-sm max-w-md aspect-video">
                  <video
                    src={turf.videoUrl}
                    controls
                    preload="metadata"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </>
          )}

          <hr className="border-zinc-200" />

          {/* Amenities */}
          <div>
            <h2 className="text-xl font-black text-zinc-900">Amenities offered</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {finalAmenities.map((amenity) => (
                <div
                  key={amenity.label}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 bg-white"
                >
                  <span className="text-xl">{amenity.icon}</span>
                  <span className="text-sm font-semibold text-zinc-700">{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-zinc-200" />

          {/* Rules */}
          <div>
            <h2 className="text-xl font-black text-zinc-900">Rules & Guidelines</h2>
            <ul className="mt-4 space-y-2.5">
              {rulesList.map((rule, index) => (
                <li key={index} className="flex items-start gap-3 text-sm leading-6 text-zinc-600">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lime-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <hr className="border-zinc-200" />

          {/* Cancellation Policy */}
          <div>
            <h2 className="text-xl font-black text-zinc-900">Cancellation Policy</h2>
            <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <p className="text-sm font-semibold text-zinc-600">
                Refunds are calculated based on the time remaining before your slot start time:
              </p>
              
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-green-50/70 border border-green-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-green-700">72+ hours before</p>
                  <p className="mt-1 text-lg font-black text-green-900">100% Refund</p>
                  <p className="mt-0.5 text-xs text-zinc-500">of turf portion</p>
                </div>
                <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">24 to 72 hours before</p>
                  <p className="mt-1 text-lg font-black text-amber-900">50% Refund</p>
                  <p className="mt-0.5 text-xs text-zinc-500">of turf portion</p>
                </div>
                <div className="rounded-2xl bg-red-50/70 border border-red-100 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-700">Less than 24 hours</p>
                  <p className="mt-1 text-lg font-black text-red-900">No Refund</p>
                  <p className="mt-0.5 text-xs text-zinc-500">late cancellation</p>
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-500 space-y-2 leading-5">
                <p>💡 <strong>Pending Approval:</strong> If a booking is still pending owner approval, it will receive a <strong>100% refund</strong> upon cancellation.</p>
                <p>💵 <strong>Full Cash Bookings:</strong> Cancellations made less than 24 hours before the slot are marked as late cancellations. Getting 3 late cancellations within 90 days will temporarily disable the Full Cash option for 30 days.</p>
                <p>🎟️ <em>Please note: Platform fees are non-refundable.</em></p>
              </div>
            </div>
          </div>

          {/* Owner details */}
          {turf.owner && (
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <h3 className="font-black text-zinc-900">Hosted by</h3>
              <div className="mt-4 flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-lime-400 text-xl font-black text-zinc-950">
                  {turf.owner.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{turf.owner.name}</p>
                  <p className="text-sm text-zinc-500">📞 {turf.owner.contactNumber}</p>
                </div>
              </div>
            </div>
          )}

          <hr className="border-zinc-200" />

          {/* Reviews List */}
          <div>
            <h2 className="text-xl font-black text-zinc-900">Reviews & Ratings</h2>
            {turf.customerReviews && turf.customerReviews.length > 0 ? (
              <div className="mt-5 space-y-6">
                {turf.customerReviews.map((review) => (
                  <div key={review.id} className="space-y-2 border-b border-zinc-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900">{review.reviewerName}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    {review.comment && <p className="text-sm leading-6 text-zinc-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">No reviews yet. Be the first to review after your game!</p>
            )}
          </div>
        </article>

        {/* Right Column: Sticky Booking Widget */}
        <aside className="hidden lg:block h-fit lg:sticky lg:top-24">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="space-y-1">
              <span className="text-sm text-zinc-500">Starting from</span>
              <p className="text-3xl font-black text-zinc-900">
                ₹{startingPrice}
                <span className="text-sm font-normal text-zinc-500"> / hour</span>
              </p>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 space-y-3">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>📅 Instant confirmation</span>
                  <span className="font-bold text-green-700">⚡ Available</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>⚽ Size</span>
                  <span className="font-bold">{turf.turfSize}</span>
                </div>
              </div>

              <Link href={`/book-slot?turfId=${turf.id}`} className="block">
                <Button className="w-full py-4 text-base font-black shadow-lg shadow-lime-300/40">
                  Book Slot
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
