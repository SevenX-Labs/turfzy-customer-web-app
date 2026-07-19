"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authService } from "@/services";
import { Brand, Button, Field } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) {
      clean = clean.slice(2);
    } else if (clean.length === 11 && clean.startsWith("0")) {
      clean = clean.slice(1);
    }
    if (clean.length <= 10) {
      setPhone(clean);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) return setError("Enter a valid 10-digit phone number.");
    setBusy(true);
    setError("");
    try {
      await authService.login(clean);
      sessionStorage.setItem("turfzy_login_phone", clean);
      router.push("/verify-otp");
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#111714] lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-lime-400 p-12 lg:flex">
        <Brand />
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em]">Your game, your time</p>
          <h1 className="mt-5 max-w-md text-6xl font-black leading-none tracking-[-.07em]">Find your next turf.</h1>
        </div>
        <p className="text-sm font-medium">Premium venues. Seamless bookings. More time playing.</p>
      </section>
      <section className="flex items-center justify-center p-5">
        <form onSubmit={submit} className="animate-rise w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
          <div className="lg:hidden">
            <Brand />
          </div>
          <p className="mt-8 text-sm font-bold uppercase tracking-[.18em] text-lime-700">Welcome to Turfzy</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Sign in to play.</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Enter your mobile number. We’ll send a secure one-time password.</p>
          
          <label className="mt-8 block text-sm font-bold">Mobile number</label>
          <div className="mt-2 flex rounded-xl border border-zinc-200 bg-white focus-within:border-lime-500 focus-within:ring-4 focus-within:ring-lime-100">
            <span className="border-r border-zinc-200 px-4 py-3 text-sm font-bold">+91</span>
            <Field
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="98765 43210"
              className="border-0 focus:ring-0"
            />
          </div>
          
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          <Button disabled={busy} className="mt-6 w-full">{busy ? "Sending OTP…" : "Continue with OTP"}</Button>
          <p className="mt-6 text-center text-xs leading-5 text-zinc-500">By continuing, you agree to our <Link href="/terms" className="font-bold underline">Terms</Link> and <Link href="/privacy-policy" className="font-bold underline">Privacy Policy</Link>.</p>
        </form>
      </section>
    </main>
  );
}

