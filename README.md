<h1 align="center">
  ClearBox
</h1>

<div align="center" style="display: flex; gap: 16px; justify-content: center;">
  <a href="#">
    <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/Kaua-Cavalcante/ClearBox.svg" />
  </a>
  
  <a href="#">
    <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/Kaua-Cavalcante/ClearBox.svg" />
  </a>
  
  <a href="#">
    <img alt="Repository size" src="https://img.shields.io/github/repo-size/Kaua-Cavalcante/ClearBox.svg" />
  </a>
  
  <a href="https://github.com/Kaua-Cavalcante/ClearBox/issues">
    <img alt="Repository issues" src="https://img.shields.io/github/issues/Kaua-Cavalcante/ClearBox.svg" />
  </a>
</div>

<p align="center">
  <img src=".github/preview.png" width="100%" />
</p>

## 💻 Projeto

Este projeto é uma solução digital que automatiza a leitura e classificação de emails.   
Ele combina Frontend (React) para interface do usuário e Backend (Python FastAPI) para processamento e classificação.

## Tecnologias utilizadas
- [Python3](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com)
- [Hugging Face Inference API](https://huggingface.co/inference-api)
- [dotenv](https://pypi.org/project/python-dotenv/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)


## 🚀 Executando o Projeto Localmente

### 1. Clonar o repositório
 
```bash 
git clone https://github.com/Kaua-Cavalcante/ClearBox.git
cd ClearBox
```

### 2. Configurar o Backend (Python + FastAPI)

#### 1. Acesse a pasta:

```bash
cd backend
```
#### 2. Crie e ative um ambiente virtual:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 3. Instale as dependências:

```bash
pip install -r requirements.txt
```

#### 4. Configure a variável de ambiente da API Hugging Face
Você precisa de um token de acesso da Hugging Face.
Se ainda não tiver, crie gratuitamente em: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

Depois, defina a variável de ambiente HF_API_KEY com o valor do token:

```bash
export HF_API_KEY=seu_token_aqui #Linux/Mac

setx HF_API_KEY "seu_token_aqui" #Windows
```

#### 5. Inicie o servidor:

```bash
uvicorn app.main:app --reload
```
> O backend estará rodando em: [http://127.0.0.1:8000](http://127.0.0.1:8000)



### 3. Configurar o Frontend (React + Vite)

#### 1. Acesse a pasta:

```bash
cd frontend
```

#### 2. Instale as dependências:

```bash
npm install
```

#### 3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```
> O frontend estará disponível em: [http://localhost:5173](http://localhost:5173)

## 📊 Funcionalidades
- Classificação de emails como **Produtivo** ou **Improdutivo**.
- Exibição de **porcentagem de confiança** da classificação.
- Sugestão de **resposta automática**.
- Histórico dos últimos emails processados.

## 🔮 Próximos Passos
- Integração com modelos de **NLP mais avançados** (Hugging Face, OpenAI).
- Exportação de relatórios (CSV/PDF).
- Dashboard com estatísticas em tempo real.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** React + TailwindCSS + Vite
- **Backend:** Python + FastAPI + Uvicorn
- **NLP:** Scikit-learn (básico)

### ✨ Desenvolvido para automatizar tarefas repetitivas e **liberar tempo da equipe.**