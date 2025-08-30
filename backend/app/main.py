from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

app = FastAPI()

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
    
def classify_with_hf(text: str):
    labels = [
        "email de trabalho legítimo",
        "mensagem irrelevante / improdutiva",
        "email de spam / phishing / golpe"
    ]
    
    response = requests.post(HF_API_URL, headers=HEADERS, json={
        "inputs": text, "parameters": {"candidate_labels": labels, "multi_label": False}
    })
    result = response.json()
    
    best_idx = result["scores"].index(max(result["scores"]))
    category = result["labels"][best_idx]
    confidence = result["scores"][best_idx]

    if category != "email de spam / phishing / golpe" and confidence < 0.75:
        spam_model_url = "https://api-inference.huggingface.co/models/mrm8488/bert-mini-finetuned-phishing"
        spam_response = requests.post(spam_model_url, headers=HEADERS, json={"inputs": text})
        spam_result = spam_response.json()
        
        spam_label = spam_result[0][0]["label"]
        spam_score = spam_result[0][0]["score"]
        
        if spam_label.lower() == "phishing" and spam_score > 0.85:
            category = "email de spam / phishing / golpe"
            confidence = spam_score

    return category, confidence

@app.post("/api/classify")
def classify_emails(request: EmailRequest):
    results = []

    for email in request.emails:
        category, confidence = classify_with_hf(email.text)

        # Resposta automática básica
        reply = ""
        if category == "produtivo":
            reply = "Seu pedido foi recebido e será processado em breve."
        elif category == "improdutivo":
            reply = "Agradecemos sua mensagem."
        elif category == "spam":
            reply = "Mensagem identificada como spam."
        elif category == "ofensivo":
            reply = "Mensagem contém linguagem ofensiva e não será processada."

        results.append({
            "id": email.id,
            "text": email.text,
            "name": email.name,
            "category": category,
            "confidence": confidence,
            "reply": reply
        })
        
    stats = {
        "produtivo": len([r for r in results if r["category"] == "produtivo"]),
        "improdutivo": len([r for r in results if r["category"] == "improdutivo"]),
        "spam": len([r for r in results if r["category"] == "spam"]),
        "ofensivo": len([r for r in results if r["category"] == "ofensivo"])
    }
    return {"results": results, "stats": stats}
