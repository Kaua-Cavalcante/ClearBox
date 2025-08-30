from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from .classifier import classify_email
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

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

@app.post("/api/classify")
def classify_emails(request: EmailRequest):
    results = []
    candidate_labels = ["suporte", "status", "elogio", "spam", "outros"]
    
    for email in request.emails:
        result = classifier(email.text, candidate_labels)
        category = result["labels"][0]
        confidence = float(result["scores"][0])
        
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
