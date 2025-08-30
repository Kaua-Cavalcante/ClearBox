from typing import List, Optional
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

ZERO_SHOT_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
SPAM_MODEL_URL = "https://api-inference.huggingface.co/models/mrm8488/bert-mini-finetuned-phishing"
OFFENSIVE_MODEL_URL = "https://api-inference.huggingface.co/models/unitary/toxic-bert"

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
    
def classify_with_zero_shot(text: str):
    labels = [
        "email de trabalho legítimo",
        "mensagem irrelevante / improdutiva",
        "email de spam / phishing / golpe"
    ]
    
    response = requests.post(ZERO_SHOT_URL, headers=HEADERS, json={
        "inputs": text,
        "parameters": {"candidate_labels": labels, "multi_label": False}
    })
    result = response.json()
    best_idx = result["scores"].index(max(result["scores"]))
    return result["labels"][best_idx], result["scores"][best_idx]

def classify_with_spam_model(text: str):
    response = requests.post(SPAM_MODEL_URL, headers=HEADERS, json={"inputs": text})
    result = response.json()
    if isinstance(result, list) and len(result) > 0:
        label = result[0][0]["label"]
        score = result[0][0]["score"]
        if "phishing" in label or "spam" in label:
            return "email de spam / phishing / golpe", score
    return None, 0.0

def classify_offensive(text: str):
    response = requests.post(OFFENSIVE_MODEL_URL, headers=HEADERS, json={"inputs": text})
    result = response.json()
    if isinstance(result, list) and len(result) > 0:
        scores = {item["label"].lower(): item["score"] for item in result[0]}
        if "toxic" in scores and scores["toxic"] > 0.7:
            return True
    return False

@app.post("/api/classify")
def classify_emails(request: EmailRequest):
    results = []

    for email in request.emails:
        category, confidence = classify_with_zero_shot(email.text)
        
        if category != "email de spam / phishing / golpe" and confidence < 0.75:
            spam_cat, spam_conf = classify_with_spam_model(email.text)
            if spam_cat:
                category, confidence = spam_cat, spam_conf
        
        offensive = classify_offensive(email.text)
        if offensive:
            category = "conteúdo ofensivo"

        results.append({
            "id": email.id,
            "text": email.text,
            "name": email.name,
            "classification": category,
            "confidence": confidence
        })

    summary = {
        "produtivo": sum(1 for r in results if r["classification"] == "email de trabalho legítimo"),
        "improdutivo": sum(1 for r in results if r["classification"] == "mensagem irrelevante / improdutiva"),
        "spam": sum(1 for r in results if r["classification"] == "email de spam / phishing / golpe"),
        "ofensivo": sum(1 for r in results if r["classification"] == "conteúdo ofensivo")
    }
    return {"results": results, "summary": summary}
