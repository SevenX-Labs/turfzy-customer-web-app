"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, Trophy, Flame, Coins } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning" | "gamification_decay" | "gamification_penalty" | "gamification_success";

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, description?: string, duration?: number) => void;
  dismiss: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", description?: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, description, type, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
      {toasts.map((t) => {
        let bgColor = "bg-white border-zinc-200 text-zinc-900";
        let Icon = Info;
        let iconColor = "text-zinc-500";

        if (t.type === "success") {
          bgColor = "bg-emerald-50 border-emerald-200 text-emerald-950";
          Icon = CheckCircle;
          iconColor = "text-emerald-500";
        } else if (t.type === "error") {
          bgColor = "bg-rose-50 border-rose-200 text-rose-950";
          Icon = AlertCircle;
          iconColor = "text-rose-500";
        } else if (t.type === "warning") {
          bgColor = "bg-amber-50 border-amber-200 text-amber-950";
          Icon = AlertCircle;
          iconColor = "text-amber-500";
        } else if (t.type === "gamification_success") {
          bgColor = "bg-lime-50 border-lime-300 text-zinc-950 shadow-lime-100/50";
          Icon = Trophy;
          iconColor = "text-lime-600";
        } else if (t.type === "gamification_decay") {
          bgColor = "bg-orange-50 border-orange-200 text-orange-950 shadow-orange-100/50";
          Icon = Flame;
          iconColor = "text-orange-500";
        } else if (t.type === "gamification_penalty") {
          bgColor = "bg-red-50 border-red-200 text-red-950 shadow-red-100/50";
          Icon = Coins;
          iconColor = "text-red-500";
        }

        return (
          <div
            key={t.id}
            className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${bgColor}`}
            role="alert"
          >
            <div className={`mt-0.5 rounded-full p-1 ${iconColor} bg-white/60 flex-shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-5">{t.message}</p>
              {t.description && (
                <p className="mt-1 text-xs opacity-80 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 text-zinc-400 hover:text-zinc-600 transition p-0.5 rounded-lg hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
