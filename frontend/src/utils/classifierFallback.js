import {
  suggestReplyProductive,
  suggestReplyUnproductive,
} from "./suggestReplies";

export function localHeuristicClassifier(text) {
  const t = (text || "").toLowerCase();
  const productiveHints = [
    "status",
    "atualiza",
    "andamento",
    "suporte",
    "erro",
    "problema",
    "ticket",
    "urgente",
  ];
  const unproductiveHints = [
    "feliz natal",
    "bom dia",
    "boa tarde",
    "parabéns",
    "obrigado",
  ];

  const prodScore = productiveHints.reduce(
    (acc, k) => acc + (t.includes(k) ? 1 : 0),
    0
  );
  const unprodScore = unproductiveHints.reduce(
    (acc, k) => acc + (t.includes(k) ? 1 : 0),
    0
  );

  const category =
    prodScore >= Math.max(1, unprodScore) ? "Produtivo" : "Improdutivo";
  const reply =
    category === "Produtivo"
      ? suggestReplyProductive(text)
      : suggestReplyUnproductive(text);

  return {
    category,
    reply,
    confidence: Math.min(0.95, 0.55 + 0.1 * (prodScore - unprodScore)),
  };
}
