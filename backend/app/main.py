from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware
import requests
import os

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
    candidate_labels = ["suporte", "status", "elogio", "spam", "outros"]

    for email in request.emails:
        hf_result = classify_with_hf(email.text, candidate_labels)

        category = hf_result["labels"][0]
        confidence = float(hf_result["scores"][0])

        if category == "status":
            reply = "Olá! Sua solicitação está em análise. Em breve daremos um retorno."
        elif category == "suporte":
            reply = "Nossa equipe de suporte irá ajudá-lo em breve."
        elif category == "elogio":
            reply = "Agradecemos muito pelo seu feedback positivo!"
        elif category == "spam":
            reply = "Mensagem marcada como não relevante."
        else:
            reply = "Obrigado pelo seu contato, vamos analisar sua mensagem."
            
        results.append({
            "id": email.id,
            "category": category,
            "reply": reply,
            "confidence": confidence
        })

    return {"results": results}