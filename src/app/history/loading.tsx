export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-bo-cream px-5 pt-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-6 w-28 bg-bo-parchment rounded-r1" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-bo-parchment rounded-r1" />
          <div className="h-8 w-8 bg-bo-parchment rounded-r1" />
        </div>
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-r2 overflow-hidden shadow-bo1">
            <div className="aspect-square bg-bo-parchment" />
            <div className="p-3">
              <div className="h-4 w-full bg-bo-parchment rounded mb-2" />
              <div className="h-3 w-16 bg-bo-parchment rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
