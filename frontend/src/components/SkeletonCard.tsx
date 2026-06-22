export default function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Loading news"
      className="bg-white rounded-xl p-5 animate-pulse"
      style={{ border: "1px solid rgba(74,52,42,0.1)" }}
    >
      <div className="h-5 bg-linen rounded w-3/4 mb-2" />
      <div className="h-5 bg-linen rounded w-1/2 mb-4" />
      <div className="h-16 bg-linen rounded mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-linen rounded w-14" />
        <div className="h-5 bg-linen rounded w-14" />
      </div>
      <hr style={{ borderColor: "rgba(74,52,42,0.1)" }} className="my-2" />
      <div className="flex justify-between">
        <div className="h-3 bg-linen rounded w-24" />
        <div className="h-3 bg-linen rounded w-12" />
      </div>
    </div>
  );
}
