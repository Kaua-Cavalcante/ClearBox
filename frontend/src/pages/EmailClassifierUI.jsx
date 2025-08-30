import { motion } from "framer-motion";
import {
  CheckCircle2, ChevronDown, ChevronUp, Copy, Download, Edit3, FileText, Inbox, Loader2, Mail, Trash2, Upload
} from "lucide-react";

import { useMemo, useRef, useState } from "react";

import Badge from "../components/Badge";
import History from "../components/History";
import StatCard from "../components/StatCard";

import { localHeuristicClassifier } from "../utils/classifierFallback";

const prettyDate = () => new Date().toLocaleString();

export default function EmailClassifierUI() {
  const [files, setFiles] = useState([]); // { name, type, content?, size }
  const [pasted, setPasted] = useState("");
  const [items, setItems] = useState([]); // { id, source, name, text }
  const [results, setResults] = useState([]); // { id, category, reply, confidence }
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [expandAdvanced, setExpandAdvanced] = useState(false);
  const inputRef = useRef(null);

  const stats = useMemo(() => {
    const total = results.length;
    const prod = results.filter((r) => r.category === "Produtivo").length;
    const unp = results.filter((r) => r.category === "Improdutivo").length;
    const confAvg = total
      ? results.reduce((a, b) => a + (b.confidence || 0), 0) / total
      : 0;
    return { total, prod, unp, confAvg };
  }, [results]);

  function handleFilesSelected(fileList) {
    const arr = Array.from(fileList || []);
    const accepted = arr.filter((f) => /\.(txt|pdf)$/i.test(f.name));
    if (accepted.length !== arr.length) {
      alert(
        "Alguns arquivos foram ignorados (apenas .txt e .pdf são aceitos)."
      );
    }
    // For TXT, read content; for PDF, we keep placeholder (text extraction será no backend)
    accepted.forEach((f) => {
      if (/\.txt$/i.test(f.name)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result?.toString() || "";
          addItem({ source: "file", name: f.name, text });
        };
        reader.readAsText(f);
      } else {
        addItem({
          source: "file",
          name: f.name,
          text: "[PDF enviado – o backend fará a extração de texto]",
        });
      }
    });
    setFiles((prev) => [...prev, ...accepted]);
  }

  function addItem({ source, name, text }) {
    const id = `${source}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    setItems((prev) => [{ id, source, name, text }, ...prev]);
  }

  function handleAddFromPaste() {
    if (!pasted.trim()) return;
    addItem({
      source: "paste",
      name: `Texto colado (${prettyDate()})`,
      text: pasted.trim(),
    });
    setPasted("");
  }

  async function processAll() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = items.map((it) => ({
        id: it.id,
        text: it.text,
        name: it.name,
      }));
      const res = await fetch("https://clearbox.onrender.com/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: payload }),
      });
      console.log(JSON.stringify({ emails: payload }, null, 2));
      if (!res.ok) throw new Error("backend off");
      const data = await res.json();
      const mapped = (data.results || []).map((r) => ({
        id: r.id,
        category: r.category,
        reply: r.reply,
        confidence: r.confidence ?? 0.75,
      }));
      setResults(mapped);
      setHistory((prev) => [...mapped, ...prev]);
    } catch (e) {
      const mapped = items.map((it) => {
        const out = localHeuristicClassifier(it.text);
        return { id: it.id, ...out };
      });
      setResults(mapped);
      setHistory((prev) => [...mapped, ...prev]);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setFiles([]);
    setItems([]);
    setResults([]);
    setPasted("");
  }

  function onEditReply(id, newText) {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reply: newText } : r))
    );
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text || "");
  }

  function downloadJSON() {
    const data = items.map((it) => {
      const res = results.find((r) => r.id === it.id);
      return {
        name: it.name,
        text: it.text,
        category: res?.category,
        reply: res?.reply,
        confidence: res?.confidence,
      };
    });
    const blob = new Blob(
      [
        JSON.stringify(
          { generatedAt: new Date().toISOString(), data },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classificacao-emails-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const header = ["name", "category", "confidence", "reply"];
    const rows = items.map((it) => {
      const r = results.find((x) => x.id === it.id) || {};
      return [
        it.name,
        r.category || "",
        r.confidence ?? "",
        (r.reply || "").replace(/\n/g, " "),
      ];
    });
    const csv = [
      header.join(";"),
      ...rows.map((r) =>
        r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(";")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classificacao-emails-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Mail className="w-6 h-6" />
          <h1 className="text-xl sm:text-2xl font-semibold">ClearBox</h1>
          <span className="ml-auto text-xs sm:text-sm text-slate-500">
            Protótipo UI • {prettyDate()}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Uploader & Paste */}
        <motion.section
          layout
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Inbox className="w-5 h-5" />
                <h2 className="text-lg font-medium">Adicionar emails</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="cursor-pointer group flex flex-col items-center justify-center rounded-xl border border-slate-300 p-6 hover:border-slate-400 transition">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">
                    Arraste ou selecione arquivos
                  </span>
                  <span className="text-xs text-slate-500">
                    Formatos aceitos: .txt, .pdf (múltiplos)
                  </span>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".txt,.pdf"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </label>
                <div className="rounded-xl border border-slate-300 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Copy className="w-4 h-4" />
                    <span className="text-sm font-medium">Colar texto</span>
                  </div>
                  <textarea
                    className="w-full h-28 resize-y rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    placeholder="Cole aqui o conteúdo de um email…"
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddFromPaste}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:opacity-90"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm"
                >
                  <Upload className="w-4 h-4" /> Selecionar arquivos
                </button>
                <button
                  onClick={processAll}
                  disabled={loading || items.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {loading ? "Processando…" : `Processar (${items.length})`}
                </button>
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Limpar
                </button>
                <button
                  onClick={() => setExpandAdvanced((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm"
                >
                  {expandAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Mais informações
                </button>
              </div>

              {expandAdvanced && (
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>
                    • PDFs são aceitos e enviados ao backend para extração de
                    texto.
                  </p>
                  <p>
                    • Este protótipo usa um classificador local como fallback
                    quando o backend não está disponível.
                  </p>
                </div>
              )}
            </div>

            {/* Queue list */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-medium">
                  Fila para processamento ({items.length})
                </h3>
              </div>
              {items.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Nenhum item adicionado ainda.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((it) => (
                    <li key={it.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium text-sm">{it.name}</span>
                        <span className="ml-auto text-xs text-slate-500">
                          {it.source === "file" ? "Arquivo" : "Texto colado"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap line-clamp-3 text-slate-600">
                        {it.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Stats & Export */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <h3 className="text-sm font-medium mb-3">Estatísticas</h3>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Total" value={stats.total} />
                <StatCard label="Prod." value={stats.prod} />
                <StatCard label="Improd." value={stats.unp} />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Confiança média: {(stats.confAvg * 100).toFixed(0)}%
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <h3 className="text-sm font-medium mb-3">Exportar</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadCSV}
                  disabled={results.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button
                  onClick={downloadJSON}
                  disabled={results.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> JSON
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Exporte os resultados para integração com outros sistemas.
              </p>
            </div>

            <History history={history} />
          </div>
        </motion.section>

        {/* Results */}
        <motion.section
          layout
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-medium">
              Resultados ({results.length})
            </h3>
          </div>
          {results.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              Os resultados aparecerão aqui após o processamento.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge category={r.category} />
                    <span className="text-xs text-slate-500">
                      Confiança: {(r.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <label className="text-xs font-medium text-slate-600">
                      Resposta sugerida
                    </label>
                    <textarea
                      value={r.reply}
                      onChange={(e) => onEditReply(r.id, e.target.value)}
                      className="w-full min-h-[88px] rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(r.reply)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs"
                      >
                        <Copy className="w-4 h-4" /> Copiar resposta
                      </button>
                      <button
                        onClick={() => {
                          const it = items.find((i) => i.id === r.id);
                          const txt = `Assunto: ${
                            it?.name || "(sem nome)"
                          }\nCategoria: ${r.category}\nConfiança: ${(
                            r.confidence * 100
                          ).toFixed(0)}%`;
                          copyToClipboard(txt);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs"
                      >
                        <Edit3 className="w-4 h-4" /> Copiar resumo
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <footer className="py-6 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <span>
              &copy; 2025 • Protótipo desenvolvido por <a className="hover:underline text-emerald-600" href="https://github.com/Kaua-Cavalcante">@Kaua-Cavalcante</a>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}