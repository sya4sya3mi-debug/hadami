"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import { getUserRoutines, getAmSteps, getPmSteps, type Routine } from "@/lib/routines";
import { createRoutineWithDeckAction } from "@/app/actions/routineActions";
import ScrollToTop from "@/components/ui/ScrollToTop";

export default function RoutineListPage() {
  return (
    <AuthGuard>
      <RoutineListContent />
    </AuthGuard>
  );
}

function RoutineListContent() {
  const { user } = useUser();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserRoutines().then((data) => {
      setRoutines(data);
      setLoading(false);
    });
  }, [user]);

  const handleCreate = async () => {
    const result = await createRoutineWithDeckAction();
    if (result.routineId) {
      router.push(`/routine/${result.routineId}/share`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-bo-accent text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-8 max-w-lg mx-auto">
      <ScrollToTop />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          マイルーティン
        </h1>
        <form action={handleCreate}>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#3A8F7A" }}
          >
            <span>＋</span> 新規作成
          </button>
        </form>
      </div>

      {/* Empty State */}
      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            ルーティンがまだありません
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            あなたのスキンケアルーティンを作成して
            <br />
            シェアカードで共有しましょう
          </p>
          <form action={handleCreate}>
            <button
              type="submit"
              className="px-6 py-3 rounded-full text-white font-semibold transition-colors"
              style={{ backgroundColor: "#3A8F7A" }}
            >
              最初のルーティンを作成
            </button>
          </form>
        </div>
      ) : (
        /* Routine Cards */
        <div className="flex flex-col gap-4">
          {routines.map((routine) => {
            const am = getAmSteps(routine);
            const pm = getPmSteps(routine);
            return (
              <div
                key={routine.id}
                className="rounded-2xl p-5 border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ fontFamily: "'Shippori Mincho', serif" }}
                    >
                      {routine.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "#3A8F7A15",
                          color: "#3A8F7A",
                        }}
                      >
                        {routine.skin_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        ☀️ {am.length}ステップ / 🌙 {pm.length}ステップ
                      </span>
                    </div>
                  </div>
                </div>

                {routine.concerns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {routine.concerns.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/routine/${routine.id}/share`)}
                    className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white transition-colors"
                    style={{ backgroundColor: "#3A8F7A" }}
                  >
                    編集・シェア
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
