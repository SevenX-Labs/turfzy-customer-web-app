"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { authService } from "@/services";
import { saveToken } from "@/lib/api";
import { Brand, Button, Field } from "@/components/ui";

const RESEND_WAIT_SECONDS = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPhone(sessionStorage.getItem("turfzy_login_phone") ?? ""));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setNotice("");
      setError("Enter the complete 6-digit OTP.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await authService.verifyOtp(phone, otp);
      saveToken(response.accessToken);
      router.replace(response.isNewUser ? "/profile/edit" : "/home");
    } catch (caughtError: unknown) {
      setError((caughtError as { message?: string }).message ?? "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (secondsLeft > 0 || resending) return;

    setResending(true);
    setError("");
    setNotice("");

    try {
      await authService.resendOtp(phone);
      setOtp("");
      setSecondsLeft(RESEND_WAIT_SECONDS);
      setNotice("A fresh code has been sent to your mobile number.");
    } catch {
      setError("Could not resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const formattedTime = `0:${String(secondsLeft).padStart(2, "0")}`;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f8f5] p-4 sm:p-6">
      <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-lime-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-zinc-200/70 blur-3xl" />

      <form onSubmit={submit} className="animate-rise relative w-full max-w-md rounded-[2rem] border border-white bg-white p-7 shadow-[0_24px_70px_rgba(24,31,27,0.14)] sm:p-10">
        <Brand />

        <div className="mt-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-zinc-500">Verification</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Enter your OTP</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            We sent a six-digit code to <span className="font-bold text-zinc-700">+91 {phone || "your mobile number"}</span>.
          </p>
        </div>

        <label htmlFor="otp" className="mt-8 block text-sm font-bold text-zinc-800">6-digit verification code</label>
        <Field
          id="otp"
          className="mt-2 h-15 text-center text-2xl font-black tracking-[0.45em] sm:tracking-[0.55em]"
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="000000"
          aria-describedby="otp-help otp-feedback"
        />
        <p id="otp-help" className="mt-2 text-xs text-zinc-500">Check your SMS inbox for the latest code.</p>

        <div id="otp-feedback" aria-live="polite">
          {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          {notice && <p className="mt-3 rounded-xl bg-lime-50 px-3 py-2 text-sm font-semibold text-zinc-700">{notice}</p>}
        </div>

        <Button className="mt-6 w-full py-3.5" disabled={busy || otp.length !== 6}>
          {busy ? "Verifying…" : "Verify & continue"}
        </Button>

        <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
          {secondsLeft > 0 ? (
            <p className="text-sm text-zinc-500">Resend code available in <span className="font-bold tabular-nums text-zinc-800">{formattedTime}</span></p>
          ) : (
            <button type="button" onClick={resendOtp} disabled={resending} className="text-sm font-bold text-zinc-800 underline decoration-lime-400 decoration-2 underline-offset-4 transition hover:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50">
              {resending ? "Sending a new code…" : "Resend OTP"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
