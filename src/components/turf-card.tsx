import Link from "next/link";
import { turfService } from "@/services";
import type { Turf } from "@/types/domain";
import { ArrowRight, Star } from "lucide-react";

export function TurfCard({ turf }: { turf: Turf }) {
  const image = turf.images?.[0] ?? turf.entranceUrl ?? turf.groundDayUrl;
  const prefetch = () => turfService.prefetch(turf.id);
  return (
    <div className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-2xl">
      <Link href={`/turfs/${turf.id}`} onMouseEnter={prefetch} onFocus={prefetch} className="block">
        <div className="relative h-44 bg-zinc-200">
          {image ? (
            <img src={image} alt={turf.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-4xl">⚽</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-zinc-900 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {turf.rating ?? "New"}
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-zinc-900">{turf.name}</h3>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-500">{[turf.address, turf.city].filter(Boolean).join(", ") || "Premium sports venue"}</p>
          <p className="mt-3 text-sm font-semibold text-zinc-700">{turf.sportsType ?? "Multi-sport"}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/turfs/${turf.id}`}
            onMouseEnter={prefetch}
            onFocus={prefetch}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lime-500 px-4 py-3 text-sm font-black text-zinc-950 shadow-sm shadow-lime-200 transition hover:bg-lime-400"
          >
            Book now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/book-slot?turfId=${turf.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            View slots
          </Link>
        </div>
      </div>
    </div>
  );
}
