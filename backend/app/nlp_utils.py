import nltk
import string

# Baixar recursos do NLTK (roda uma vez)
nltk.download("stopwords", quiet=True)
from nltk.corpus import stopwords

stop_words = set(stopwords.words("portuguese"))

def preprocess_text(text: str) -> str:
    # Coloca em minúsculas
    text = text.lower()

    # Remove pontuação
    text = text.translate(str.maketrans("", "", string.punctuation))

    # Remove stopwords
    tokens = [word for word in text.split() if word not in stop_words]

    return " ".join(tokens)