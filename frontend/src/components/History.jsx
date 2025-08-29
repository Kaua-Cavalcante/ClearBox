const History = ({ history }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <h3 className="text-sm font-medium mb-2">Emails Processados</h3>
      {history.length === 0 ? (
        <p className="text-xs text-slate-600">Nenhum email processado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((item, index) => (
            <li key={index} className="p-2 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Categoria:</span> {item.category}
              </p>
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Confiança:</span> {(item.confidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Resposta sugerida:</span> {item.reply}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 italic truncate">"{item.text}"</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
