export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-bo-cream px-5 pt-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-bo-parchment rounded-r1" />
        <div className="h-8 w-8 bg-bo-parchment rounded-full" />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-r2 p-4 shadow-bo1">
            <div className="h-8 w-12 bg-bo-parchment rounded mb-2 mx-auto" />
            <div className="h-3 w-16 bg-bo-parchment rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Routine section */}
      <div className="h-4 w-28 bg-bo-parchment rounded mb-3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-r2 p-4 shadow-bo1 flex items-center gap-3">
            <div className="w-12 h-12 bg-bo-parchment rounded-r1 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-bo-parchment rounded mb-2" />
              <div className="h-3 w-20 bg-bo-parchment rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
