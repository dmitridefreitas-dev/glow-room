export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-28 rounded bg-line" />
      <div className="mt-3 h-8 w-48 rounded bg-line" />
      <div className="mt-2 h-4 w-64 rounded bg-line" />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-20 rounded-2xl bg-line/70" />
        <div className="h-20 rounded-2xl bg-line/70" />
        <div className="h-20 rounded-2xl bg-line/70" />
      </div>

      <div className="mt-5 h-3 w-full rounded-full bg-line" />
      <div className="mt-6 h-20 rounded-2xl bg-line/70" />
      <div className="mt-4 h-16 rounded-2xl bg-line/70" />

      <div className="mt-8 grid grid-cols-6 gap-2 sm:grid-cols-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-line/60" />
        ))}
      </div>
    </div>
  );
}
