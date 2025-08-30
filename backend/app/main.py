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

@app.post("/api/classify")
def classify_emails(request: EmailRequest):
    results = []
    candidate_labels = ["produtivo", "improdutivo"]

    for email in request.emails:
        hf_result = classify_with_hf(email.text, candidate_labels)

        category = hf_result["labels"][0]
        confidence = float(hf_result["scores"][0])

        if category == "produtivo":
            respostas = [
                f"Olá prezado(a), recebemos sua mensagem. Nossa equipe já está analisando.",
                f"Obrigado pelo contato, prezado(a). Vamos avaliar sua solicitação: '{email.text}'.",
                f"Sua mensagem foi registrada e será respondida em breve."
            ]
        else:  # improdutivo
            respostas = [
                f"Olá prezado(a), recebemos sua mensagem: '{email.text}'. No momento não é necessária nenhuma ação.",
                f"Agradecemos o contato, prezado(a), mas essa mensagem não requer acompanhamento.",
                f"Sua mensagem foi registrada: '{email.text}', mas não há medidas a serem tomadas."
            ]
            
        reply = random.choice(respostas)
            
        results.append({
            "id": email.id,
            "category": category,
            "reply": reply,
            "confidence": confidence
        })

    return {"results": results}