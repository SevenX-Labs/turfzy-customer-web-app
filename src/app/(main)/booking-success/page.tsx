"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
export default function BookingSuccessPage() { const id = useSearchParams().get("id"); return <div className="grid min-h-[70vh] place-items-center p-5"><section className="max-w-md rounded-3xl bg-white p-9 text-center shadow-sm"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime-100 text-3xl">✓</div><p className="mt-6 text-sm font-bold uppercase tracking-widest text-lime-700">Booking created</p><h1 className="mt-2 text-3xl font-black">You’re ready to play.</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Your booking is being processed. Complete payment when required from your booking details.</p><Link href={id ? `/bookings/${id}` : "/bookings"}><Button className="mt-7 w-full">View booking</Button></Link></section></div>; }
