import {
  RAKUTEN_CARD_IMAGE_HEIGHT_PX,
  RAKUTEN_CARD_WIDTH_PX,
} from "./cardLayout";

export default function SkeletonLoader() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-r1 border border-bo-parchment bg-white p-3 animate-pulse"
          style={{ minWidth: `${RAKUTEN_CARD_WIDTH_PX}px` }}
        >
          <div
            className="w-full rounded-lg bg-bo-parchment mb-2.5"
            style={{ height: `${RAKUTEN_CARD_IMAGE_HEIGHT_PX}px` }}
          />
          <div className="h-3 bg-bo-parchment rounded mb-1.5 w-[90%]" />
          <div className="h-3 bg-bo-parchment rounded mb-2 w-[60%]" />
          <div className="h-4 bg-bo-parchment rounded w-[50%]" />
        </div>
      ))}
    </div>
  );
}
