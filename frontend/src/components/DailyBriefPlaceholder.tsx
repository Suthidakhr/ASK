export default function DailyBriefPlaceholder() {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: "rgba(74,52,42,0.1)" }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ backgroundColor: "#4A342A" }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(215,201,184,0.2)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D7C9B8"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">AI Daily Brief</div>
          <div className="text-xs" style={{ color: "rgba(215,201,184,0.5)" }}>
            Today&#39;s brief is being prepared
          </div>
        </div>
      </div>
      <div className="bg-white px-4 py-4 space-y-2 animate-pulse">
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "#F5F1EA", width: "90%" }}
        />
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "#F5F1EA", width: "75%" }}
        />
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "#F5F1EA", width: "60%" }}
        />
      </div>
    </div>
  );
}
