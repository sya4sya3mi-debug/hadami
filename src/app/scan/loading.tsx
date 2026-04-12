export default function ScanLoading() {
  return (
    <div className="min-h-screen bg-bo-cream px-5 pt-4 animate-pulse">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6 px-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 min-w-[48px]">
              <div className="w-10 h-10 bg-bo-parchment rounded-[14px]" />
              <div className="h-2 w-8 bg-bo-parchment rounded" />
            </div>
            {i < 4 && <div className="flex-1 mx-2 mb-5 h-[2.5px] bg-bo-parchment rounded-full" />}
          </div>
        ))}
      </div>
      {/* Capture area */}
      <div className="bg-white rounded-r2 shadow-bo2 overflow-hidden">
        <div className="aspect-[4/3] bg-bo-parchment" />
        <div className="p-4 flex justify-center">
          <div className="h-10 w-40 bg-bo-parchment rounded-r2" />
        </div>
      </div>
    </div>
  );
}
