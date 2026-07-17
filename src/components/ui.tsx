"use client";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Brand() {
  return <img src="/logo.png" alt="Turfzy" className="h-auto w-[178px] max-w-full object-contain" />;
}
export function Button({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`rounded-xl bg-lime-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>; }
export function Field(props: InputHTMLAttributes<HTMLInputElement>) { return <input className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-lime-500 focus:ring-4 focus:ring-lime-100" {...props} />; }
export function Spinner() { return <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-lime-500" />; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center"><p className="font-bold">{title}</p>{children && <p className="mt-2 text-sm text-zinc-500">{children}</p>}</div>; }
