"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { turfService } from "@/services";
import type { Turf } from "@/types/domain";
import { Empty, Spinner } from "@/components/ui";
import { TurfCard } from "@/components/turf-card";

function normalize(value: Turf[] | { data: Turf[] }) { return Array.isArray(value) ? value : value.data ?? []; }
export default function HomePage() { const [turfs, setTurfs] = useState<Turf[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { turfService.list().then(normalize).then(setTurfs).catch(() => setTurfs([])).finally(() => setLoading(false)); }, []); return <div className="mx-auto max-w-7xl p-5 lg:p-9"><section className="rounded-3xl bg-[#111714] px-6 py-10 text-white sm:px-10"><p className="text-sm font-bold uppercase tracking-[.2em] text-lime-400">Turfzy customer</p><h1 className="mt-3 max-w-xl text-4xl font-black tracking-[-.06em] sm:text-6xl">Make every game count.</h1><p className="mt-4 max-w-lg text-zinc-300">Discover the right turf, pick your slot and focus on the game—not the logistics.</p><Link href="/turfs" className="mt-7 inline-block rounded-xl bg-lime-400 px-5 py-3 text-sm font-black text-zinc-950">Explore turfs</Link></section><section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-lime-700">Discover</p><h2 className="text-2xl font-black">Popular near you</h2></div><Link href="/turfs" className="text-sm font-bold underline">See all</Link></div>{loading ? <div className="grid place-items-center py-16"><Spinner /></div> : turfs.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{turfs.slice(0, 6).map(t => <TurfCard key={t.id} turf={t} />)}</div> : <Empty title="No turfs found">Try again once the venue service is available.</Empty>}</section></div>; }
