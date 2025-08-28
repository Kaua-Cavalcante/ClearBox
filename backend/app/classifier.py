from .nlp_utils import preprocess_text

def classify_email(text: str):
 # Pré-processa texto (remove stopwords, etc.)
    clean_text = preprocess_text(text)

    # Regras simples só pra começar
    if any(word in clean_text for word in ["status", "atualização", "suporte", "problema", "ajuda"]):
        category = "Produtivo"
        response = "Obrigado pelo contato. Estamos verificando sua solicitação e retornaremos em breve."
    else:
        category = "Improdutivo"
        response = "Agradecemos sua mensagem!"

    return category, response