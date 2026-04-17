"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import {
  getUserRoutines,
  getAmSteps,
  getPmSteps,
  type Routine,
} from "@/lib/routines";
import { deleteRoutineAction } from "@/app/actions/routineActions";
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
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!user) return;

    getUserRoutines()
      .then((data) => {
        setRoutines(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const handleDelete = (routineId: string, routineName: string) => {
    if (!window.confirm(`「${routineName}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    setDeletingId(routineId);
    startTransition(async () => {
      await deleteRoutineAction(routineId);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      setDeletingId(null);
    });
  };

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/routine/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!response.ok || !data.routineId) {
        setCreateError(data.error ?? "ルーティンの作成に失敗しました");
        return;
      }

      router.push(`/routine/${data.routineId}/share`);
    } catch (error) {
      console.error("Failed to create routine:", error);
      setCreateError("ルーティンの作成に失敗しました");
    } finally {
      setIsCreating(false);
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

      <div className="mb-4">
        <button
          onClick={() => router.push("/deck")}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <span className="text-lg leading-none">‹</span>
          <span>デッキに戻る</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "'Shippori Mincho', serif" }}
        >
          マイルーティン
        </h1>
        <button
          type="button"
          onClick={() => {
            void handleCreate();
          }}
          disabled={isCreating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "#3A8F7A" }}
        >
          <span>＋</span>
          <span>{isCreating ? "作成中..." : "新規作成"}</span>
        </button>
      </div>

      {createError && (
        <p className="mb-4 text-sm text-red-500">{createError}</p>
      )}

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🧴</div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            ルーティンがまだありません
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            あなたのスキンケアルーティンを作成して
            <br />
            シェアカードで保存しましょう。
          </p>
          <button
            type="button"
            onClick={() => {
              void handleCreate();
            }}
            disabled={isCreating}
            className="px-6 py-3 rounded-full text-white font-semibold transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#3A8F7A" }}
          >
            {isCreating ? "作成中..." : "最初のルーティンを作成"}
          </button>
        </div>
      ) : (
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
                        AM {am.length}ステップ / PM {pm.length}ステップ
                      </span>
                    </div>
                  </div>
                </div>

                {routine.concerns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {routine.concerns.map((concern) => (
                      <span
                        key={concern}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/routine/${routine.id}/share`)}
                    className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white transition-colors"
                    style={{ backgroundColor: "#3A8F7A" }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(routine.id, routine.name)}
                    disabled={deletingId === routine.id}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deletingId === routine.id ? "..." : "削除"}
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
