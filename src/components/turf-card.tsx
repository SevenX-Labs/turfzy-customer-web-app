import Link from "next/link";
import { turfService } from "@/services";
import type { Turf } from "@/types/domain";

export function TurfCard({ turf }: { turf: Turf }) {
  const image = turf.images?.[0] ?? turf.entranceUrl ?? turf.groundDayUrl;
  const prefetch = () => turfService.prefetch(turf.id);
  return <Link href={`/turfs/${turf.id}`} onMouseEnter={prefetch} onFocus={prefetch} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-xl"><div className="h-40 bg-zinc-200">{image ? <img src={image} alt={turf.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-4xl">⚽</div>}</div><div className="p-4"><div className="flex justify-between gap-3"><h3 className="font-black">{turf.name}</h3><span className="text-sm font-bold">★ {turf.rating ?? "New"}</span></div><p className="mt-1 truncate text-sm text-zinc-500">{[turf.address, turf.city].filter(Boolean).join(", ") || "Premium sports venue"}</p><p className="mt-4 text-sm font-bold text-zinc-800">{turf.sportsType ?? "Multi-sport"}<span className="ml-2 text-zinc-400">·</span><span className="ml-2 text-lime-700">View slots</span></p></div></Link>;
}
