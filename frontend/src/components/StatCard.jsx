export default function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
