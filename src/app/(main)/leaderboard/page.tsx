"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gamificationService } from "@/services";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/toast";
import { 
  Trophy, Flame, Clock, Award, Star, RefreshCw, 
  ChevronRight, Play, Sparkles, ShieldAlert, Info,
  Search, ShieldAlert as AlertIcon
} from "lucide-react";

interface LeaderboardUser {
  name: string;
  points: number;
  totalMatches?: number;
  totalHours?: number;
}

interface GamificationStats {
  streak: number;
  points: number;
  totalMatches: number;
  totalHours: number;
  leaderboard: {
    top10: LeaderboardUser[];
    currentUser: {
      rank: number;
      name: string;
      points: number;
      totalMatches?: number;
      totalHours?: number;
    };
  };
  nudge: string;
  inactivityPenaltyApplied: boolean;
  penaltyReason: string | null;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"points" | "totalMatches" | "totalHours">("points");
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const fetchOverallStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await gamificationService.overall();
      const data = (res && (res as any).data !== undefined ? (res as any).data : res) as GamificationStats;
      setStats(data);
      if (data && data.inactivityPenaltyApplied && data.penaltyReason) {
        setShowPenaltyModal(true);
      }
    } catch (err: any) {
      toast("Error loading stats", "error", err.message || "Failed to load overall stats.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  const fetchFilteredLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      let res;
      if (sortBy === "points") {
        res = await gamificationService.leaderboardByPoints();
      } else if (sortBy === "totalMatches") {
        res = await gamificationService.leaderboardByMatches();
      } else {
        res = await gamificationService.leaderboardByHours();
      }
      const list = (res && (res as any).data !== undefined ? (res as any).data : res) as any[];
      setLeaderboardList(list || []);
    } catch (err: any) {
      toast("Error loading leaderboard", "error", err.message || "Failed to sort leaderboard.");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [sortBy, toast]);

  useEffect(() => {
    fetchOverallStats();
  }, [fetchOverallStats]);

  useEffect(() => {
    fetchFilteredLeaderboard();
  }, [sortBy, fetchFilteredLeaderboard]);

  // Listen to the custom gamification-update event dispatched from AppShell
  useEffect(() => {
    const handleGamificationUpdate = () => {
      // Reload stats silently in the background
      fetchOverallStats(true);
      fetchFilteredLeaderboard();
    };

    window.addEventListener("gamification-update", handleGamificationUpdate);
    return () => {
      window.removeEventListener("gamification-update", handleGamificationUpdate);
    };
  }, [fetchOverallStats, fetchFilteredLeaderboard]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-zinc-500 font-medium">Crunching your play stats...</p>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
    router.push("/turfs");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-lime-600">GAMIFICATION</p>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Player Arena</h1>
        </div>
        <button
          onClick={() => {
            fetchOverallStats();
            fetchFilteredLeaderboard();
            toast("Stats Refreshed", "success", "Your stats are up to date.");
          }}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </header>

      {/* Inactivity Penalty Banner */}
      {stats?.inactivityPenaltyApplied && stats.penaltyReason && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-full bg-orange-100 p-1.5 text-orange-600 flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-orange-950">Inactivity Penalty Applied</h3>
              <p className="mt-0.5 text-xs text-orange-900/80 leading-relaxed">{stats.penaltyReason}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPenaltyModal(true)}
            className="text-xs font-bold text-orange-950 underline hover:text-orange-800 flex-shrink-0"
          >
            Why did this happen?
          </button>
        </div>
      )}

      {/* Main Grid: Left Column for Personal Stats, Right Column for Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Stats and Nudges (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          {/* Nudge Banner Card */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-xl">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 opacity-20 blur-2xl" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-lime-400">
                <Sparkles className="h-3 w-3" />
                <span>NUDGE OF THE DAY</span>
              </div>
              <p className="text-lg font-black leading-snug tracking-tight text-zinc-50">
                {stats?.nudge || "Keep playing to rank up and maintain your streak! 🔥"}
              </p>
              <button
                onClick={handleBookNow}
                className="flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-black text-zinc-950 hover:bg-lime-300 transition active:scale-95"
              >
                <span>BOOK A GAME</span>
                <Play className="h-3 w-3 fill-zinc-950" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-orange-50/50 p-5 transition hover:shadow-md">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-200/20 blur-xl group-hover:scale-125 transition duration-500" />
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Flame className="h-5 w-5 fill-orange-500 stroke-none" />
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-black text-zinc-900">{stats?.streak ?? 0} Days</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-orange-700">Active Streak</p>
            </div>

            {/* Points Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-lime-200 bg-lime-50/30 p-5 transition hover:shadow-md">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-lime-200/20 blur-xl group-hover:scale-125 transition duration-500" />
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-100 text-lime-700">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-black text-zinc-900">{stats?.points ?? 0} Pts</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-lime-700">Total Points</p>
            </div>

            {/* Total Matches Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 transition hover:shadow-md">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-zinc-100 blur-xl group-hover:scale-125 transition duration-500" />
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <Award className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-black text-zinc-900">{stats?.totalMatches ?? 0}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">Games Played</p>
            </div>

            {/* Total Hours Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 transition hover:shadow-md">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-zinc-100 blur-xl group-hover:scale-125 transition duration-500" />
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <Clock className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-black text-zinc-900">
                {stats?.totalHours !== undefined ? (stats.totalHours % 1 === 0 ? stats.totalHours : stats.totalHours.toFixed(1)) : 0}h
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">Total Hours</p>
            </div>
          </div>

          {/* Gamification Rules Link Banner */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-4.5 shadow-sm flex items-center justify-between transition hover:shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-100 text-lime-700 flex-shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-zinc-900">How to earn points?</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Click here to see the guidelines</p>
              </div>
            </div>
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-xs font-black text-lime-600 hover:text-lime-700 hover:underline flex-shrink-0"
            >
              See Guidance
            </button>
          </div>
        </section>

        {/* Right Side: Leaderboard System (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* Tabs Selector */}
            <div className="border-b border-zinc-100 bg-zinc-50/50 p-2 flex gap-1">
              <button
                onClick={() => setSortBy("points")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition ${
                  sortBy === "points"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                }`}
              >
                <Trophy className={`h-4 w-4 ${sortBy === "points" ? "text-lime-600" : "text-zinc-400"}`} />
                <span>Points</span>
              </button>

              <button
                onClick={() => setSortBy("totalMatches")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition ${
                  sortBy === "totalMatches"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                }`}
              >
                <Award className={`h-4 w-4 ${sortBy === "totalMatches" ? "text-lime-600" : "text-zinc-400"}`} />
                <span>Matches</span>
              </button>

              <button
                onClick={() => setSortBy("totalHours")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition ${
                  sortBy === "totalHours"
                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-white/40"
                }`}
              >
                <Clock className={`h-4 w-4 ${sortBy === "totalHours" ? "text-lime-600" : "text-zinc-400"}`} />
                <span>Hours</span>
              </button>
            </div>

            {/* Leaderboard Table / Content */}
            <div className="p-4 sm:p-6 min-h-[350px] relative">
              {leaderboardLoading ? (
                <div className="absolute inset-0 bg-white/70 grid place-items-center z-10">
                  <Spinner />
                </div>
              ) : null}

              {leaderboardList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Award className="h-12 w-12 text-zinc-300 stroke-[1.5] mb-3" />
                  <p className="font-bold text-zinc-800">No entries found</p>
                  <p className="text-xs text-zinc-500 mt-1">Be the first to secure a spot!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {leaderboardList.map((user, idx) => {
                    const rank = idx + 1;
                    const isTop3 = rank <= 3;
                    const isCurrentUser = user.name === "You" || user.isCurrentUser;
                    
                    let rankBg = "bg-zinc-100 text-zinc-700";
                    let rowBorder = "border-zinc-100";
                    let rowBg = "bg-white";

                    if (rank === 1) {
                      rankBg = "bg-amber-100 text-amber-800 font-black";
                      rowBg = "bg-amber-50/20";
                      rowBorder = "border-amber-200/50";
                    } else if (rank === 2) {
                      rankBg = "bg-slate-100 text-slate-800 font-black";
                      rowBg = "bg-slate-50/20";
                      rowBorder = "border-slate-200/50";
                    } else if (rank === 3) {
                      rankBg = "bg-orange-100 text-orange-800 font-black";
                      rowBg = "bg-orange-50/20";
                      rowBorder = "border-orange-200/50";
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${rowBg} ${rowBorder} ${
                          isCurrentUser ? "ring-2 ring-lime-500 ring-offset-1 bg-lime-50/10" : "hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank number or Crown */}
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold flex-shrink-0 ${rankBg}`}>
                            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                          </div>
                          
                          {/* User Avatar & Name */}
                          <div className="min-w-0">
                            <p className={`text-sm truncate ${isCurrentUser ? "font-black text-zinc-950" : "font-bold text-zinc-800"}`}>
                              {isCurrentUser ? `${user.name} (You)` : user.name}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                              {sortBy === "points" ? `${user.points} Points` : sortBy === "totalMatches" ? `${user.totalMatches || user.matches || 0} Matches` : `${user.totalHours || user.hours || 0} Hours`}
                            </p>
                          </div>
                        </div>

                        {/* Point Badge */}
                        <div className="text-right flex-shrink-0">
                          <span className={`text-sm font-black ${isTop3 ? "text-zinc-900" : "text-zinc-600"}`}>
                            {sortBy === "points" && `${user.points} pts`}
                            {sortBy === "totalMatches" && `${user.totalMatches || 0} games`}
                            {sortBy === "totalHours" && `${(user.totalHours || 0) % 1 === 0 ? (user.totalHours || 0) : (user.totalHours || 0).toFixed(1)}h`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Current User Rank Footer */}
            {stats?.leaderboard?.currentUser && (
              <div className="bg-zinc-950 text-white p-4 sm:p-5 flex items-center justify-between border-t border-zinc-800">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-zinc-950 font-black text-xs">
                    #{stats.leaderboard.currentUser.rank}
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-100">Your Standing</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-lime-400">
                      {stats.leaderboard.currentUser.points} points overall
                    </p>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-300">
                  {stats.leaderboard.currentUser.rank <= 10 ? "Top 10 Player 🏅" : "Challenger ⚡"}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Inactivity Rules Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-orange-600">
              <ShieldAlert className="h-6 w-6" />
              <h2 className="text-lg font-black text-zinc-900">Inactivity Decay Policy</h2>
            </div>
            
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-600 leading-relaxed">
                To maintain a fair and competitive leaderboard, Turfzy rewards active players. Here is why your stats were reduced:
              </p>
              
              <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <p className="text-xs text-orange-950 leading-relaxed">
                    <strong>5-Day Grace Rule:</strong> A streak remains active if you play a game within 5 days of your last session.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <p className="text-xs text-orange-950 leading-relaxed">
                    <strong>Progressive Decay:</strong> For every 5 consecutive days without completing a booking, your active streak decreases by 1 and your score decreases by 5 points.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-500 leading-normal">
                Book a new game today to stop the decay, rebuild your streak, and start earning points again!
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPenaltyModal(false)}
                className="w-full sm:w-auto rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 transition active:scale-95"
              >
                Got it, let's play!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Earn Points Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-lime-600">
              <Trophy className="h-6 w-6" />
              <h2 className="text-lg font-black text-zinc-900">How to Earn Points</h2>
            </div>
            
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-600 leading-relaxed">
                Earn points, build streaks, and climb the Turfzy leaderboard by playing regularly!
              </p>
              
              <div className="space-y-3">
                <div className="rounded-2xl bg-lime-50/50 p-4 border border-lime-100 flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-lime-100 text-lime-700 text-xs font-bold flex-shrink-0">1</span>
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-zinc-800">Match Completion:</strong> Earn <strong className="text-lime-700">+10 Points</strong> and <strong className="text-lime-700">+1 Streak day</strong> on every completed booking. (Only 1 streak day increment per day).
                  </div>
                </div>

                <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100 flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-700 text-xs font-bold flex-shrink-0">2</span>
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-zinc-800">5-Day Grace Rule:</strong> You must play at least once every 5 days. After 5 days of inactivity, your points drop by 5 and streak drops by 1 progressively every 5 days.
                  </div>
                </div>

                <div className="rounded-2xl bg-red-50/50 p-4 border border-red-100 flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-red-700 text-xs font-bold flex-shrink-0">3</span>
                  <div className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-zinc-800">Penalties:</strong> Cancelling a booking deducts <strong className="text-red-700">-2 Points</strong>. Missing a game entirely (No Show) deducts <strong className="text-red-700">-30 Points</strong>.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full sm:w-auto rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 transition active:scale-95"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
