import { RARITY, MASTER_INGREDIENTS } from "@/lib/ingredients";
import { RarityKey } from "@/types";

interface ZukanProgressProps {
  discoveredIds: string[];
}

export default function ZukanProgress({ discoveredIds }: ZukanProgressProps) {
  const total = MASTER_INGREDIENTS.length;
  const discovered = discoveredIds.length;
  const pct = total > 0 ? Math.round((discovered / total) * 100) : 0;

  const rarityCounts = (Object.keys(RARITY) as RarityKey[]).map((key) => {
    const all = MASTER_INGREDIENTS.filter((i) => i.rarity === key);
    const found = all.filter((i) => discoveredIds.includes(i.id));
    return { ...RARITY[key], key, total: all.length, found: found.length };
  });

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-5" style={{ border: "1px solid #F5E6EF" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>コンプリート率</span>
        <span className="font-bold text-sm" style={{ color: "#5BBFAD" }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "#F2F2F2" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #F9A8C0, #5BBFAD)" }}
        />
      </div>
      <div className="text-center text-2xl font-bold mb-3" style={{ color: "#5BBFAD" }}>
        {discovered}
        <span className="text-sm font-normal" style={{ color: "#9B9B9B" }}>/{total}種</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {rarityCounts.map((r) => (
          <div
            key={r.key}
            className="text-center py-2 rounded-xl"
            style={{ background: r.color + "15" }}
          >
            <span className="text-lg">{r.icon}</span>
            <div className="text-xs font-bold mt-0.5" style={{ color: r.color }}>
              {r.found}/{r.total}
            </div>
            <div className="text-[10px]" style={{ color: "#9B9B9B" }}>{r.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
