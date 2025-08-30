from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import random

app = FastAPI()

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = "facebook/bart-large-mnli"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class Email(BaseModel):
    id: str
    text: str
    name: Optional[str] = None

class EmailRequest(BaseModel):
    emails: List[Email]

def classify_with_hf(text: str, labels: list[str]):
    url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    payload = {"inputs": text, "parameters": {"candidate_labels": labels}}

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    return response.json()

def generate_dynamic_reply(category: str, text: str) -> str:
    """
    Gera uma resposta automática de forma dinâmica,
    variando conforme a categoria e o conteúdo do email.
    """
    if category == "produtivo":
        respostas = [
            f"Olá! Recebemos sua mensagem: '{text[:20]}...' e já estamos analisando sua solicitação.",
            "Obrigado pelo contato, sua solicitação está sendo processada.",
            "Nossa equipe recebeu sua mensagem e em breve retornaremos com uma atualização.",
            "Estamos verificando sua solicitação e logo você terá uma resposta."
        ]
    else:  # improdutivo
        respostas = [
            "Obrigado pela mensagem! Registramos o recebimento.",
            "Agradecemos o contato, mas não há necessidade de ação adicional.",
            "Mensagem recebida! Caso precise de suporte, nos envie mais detalhes.",
            f"Entendemos sua mensagem: '{text[:20]}...', mas não exige nenhuma ação da nossa parte."
        ]

    return random.choice(respostas)

@app.post("/api/classify")
def classify_emails(request: EmailRequest):
    results = []
    candidate_labels = [
        "produtivo: mensagens relacionadas a solicitações, suporte, abertura de conta, andamento de processos ou qualquer tarefa de trabalho",
        "improdutivo: mensagens de felicitação, agradecimento social, correntes, spam, propaganda, irrelevantes ou sem relação com o trabalho"
    ]

    keywords_produtivo = [
        "solicitar", "abertura de conta", "status da solicitação",
        "cadastro", "suporte", "requisição", "ajuda", "problema", "atendimento"
    ]

    keywords_improdutivo = [
        "feliz natal", "feliz ano novo", "boas festas",
        "parabéns", "propaganda", "prêmio", "recompensa"
    ]

    for email in request.emails:
        text_lower = email.text.lower()

        # Regras manuais de reforço (evita que coisas produtivas virem improdutivas)
        if any(palavra in text_lower for palavra in keywords_produtivo):
            category = "produtivo"
            confidence = 0.90
        elif any(palavra in text_lower for palavra in keywords_improdutivo):
            category = "improdutivo"
            confidence = 0.90
        else:
            # Classificação automática
            hf_result = classify_with_hf(email.text, candidate_labels)
            category = "produtivo" if "produtivo" in hf_result["labels"][0] else "improdutivo"
            confidence = float(hf_result["scores"][0])

        # Gera resposta dinâmica
        reply = generate_dynamic_reply(category, email.text)

        results.append({
            "id": email.id,
            "category": category,
            "reply": reply,
            "confidence": confidence
        })

    return {"results": results}