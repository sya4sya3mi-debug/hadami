export default function ZukanLoading() {
  return (
    <div className="min-h-screen bg-bo-cream px-5 pt-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-6 w-24 bg-bo-parchment rounded-r1" />
        <div className="h-6 w-16 bg-bo-parchment rounded-r1" />
      </div>
      {/* Progress ring placeholder */}
      <div className="flex justify-center mb-6">
        <div className="w-28 h-28 bg-bo-parchment rounded-full" />
      </div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 flex-1 bg-bo-parchment rounded-r1" />
        ))}
      </div>
      {/* Ingredient grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-r2 p-3 shadow-bo1">
            <div className="h-4 w-20 bg-bo-parchment rounded mb-2" />
            <div className="h-3 w-14 bg-bo-parchment rounded mb-1" />
            <div className="h-3 w-10 bg-bo-parchment rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
