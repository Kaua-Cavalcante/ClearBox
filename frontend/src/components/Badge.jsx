export default function Badge({ category }) {
  const isProd = category === "Produtivo" || category === "produtivo";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
        isProd
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isProd ? "bg-emerald-500" : "bg-slate-500"
        }`}
      ></span>
      {category}
    </span>
  );
}
