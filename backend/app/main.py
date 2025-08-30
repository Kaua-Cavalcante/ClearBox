from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from .classifier import classify_email
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class Email(BaseModel):
    id: int
    text: str
    name: str | None = None

class EmailRequest(BaseModel):
    emails: List[Email]

@app.post("/api/classify")
def classify_emails(request: EmailRequest):
    results = []
    for email_text in request.emails:
        category, response = classify_email(email_text)
        results.append({
            "email": email_text,
            "category": category,
            "reply": response
        })
    return {"results": results}
