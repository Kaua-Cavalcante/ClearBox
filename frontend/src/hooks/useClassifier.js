import { useState } from "react";

export function useClassifier() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const classifyEmails = async (emails) => {
    setLoading(true);
    try { 
      const response = await fetch("http://127.0.0.1:8000/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();
      setResults(data.results);  
    } catch (err) {
      console.error("Erro ao classificar emails:", err);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, classifyEmails };
}
