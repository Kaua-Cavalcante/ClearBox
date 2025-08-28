from fastapi import FastAPI
from pydantic import BaseModel
from .classifier import classify_email

app = FastAPI()

class EmailRequest(BaseModel):
    emails: list[str]
    
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
