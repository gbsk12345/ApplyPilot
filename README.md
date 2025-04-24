# 🎯 AutoApply | ML-Powered Job Application & ATS System

🚀 A smart job application assistant that automatically applies to relevant job postings **only if** your profile matches the technical requirements.  
✅ Built-in ATS scoring system focused purely on **technical skill alignment** using keyword extraction, semantic similarity, and machine learning.

---

## 📌 Features

- ✍️ **User Profile System** – Upload resume & skill details.
- 🤖 **Automated Job Application** – Auto-apply to matched jobs from platforms like Indeed, LinkedIn, etc.
- 🧠 **Custom ATS Engine** – ML-based resume–job matching (focus on technical keywords).
- 💡 **Feedback System** – Tells you what’s missing if not applied.
- 📈 **Dashboard** – Track your matches, applications, and scores.
- 🔍 **Future Ready** – Semantic search using NLP and Transformers.

---

## 🧠 How It Works

1. **Resume Parsing**  
   Uses NLP to extract:
   - Technical skills (e.g., Python, Kubernetes)
   - Experience level, education, certifications

2. **Job Description Analysis**  
   Parses job listings for:
   - Required technologies
   - Keywords in responsibilities & requirements

3. **ATS Scoring Algorithm**  
   - ✅ Keyword overlap with resume
   - ✅ Optional semantic matching using **sentence embeddings (e.g., BERT)**
   - 🚫 Ignores soft skills, buzzwords
   - Threshold-based filtering before applying

4. **Application Engine**  
   - Auto-fills forms or sends tailored applications
   - Logs all applications with timestamps

---

## 🧪 Machine Learning Techniques

| Component              | Approach                                                       |
|------------------------|----------------------------------------------------------------|
| Resume/Job Parsing     | `spaCy`, `pdfminer`, `docx`, `NLTK`                            |
| Keyword Scoring        | TF-IDF, Cosine Similarity, Jaccard Distance                    |
| Semantic Matching      | Sentence Transformers (`sentence-transformers` / BERT)         |
| Match Score Prediction | Future: ML model trained on matched vs non-matched jobs       |

---

## 📷 Screenshots

> _(Add screenshots of your UI, dashboard, resume upload, etc.)_

---

## 🏗️ Tech Stack

| Layer       | Tech Used                          |
|-------------|------------------------------------|
| Frontend    | React.js / Next.js                 |
| Backend     | FastAPI (Python)                   |
| ML/NLP      | spaCy, scikit-learn, Transformers  |
| Scraping    | Selenium / BeautifulSoup / Scrapy  |
| Database    | PostgreSQL / MongoDB               |
| Hosting     | Render / AWS / Vercel              |
| Auth & CI   | GitHub OAuth, GitHub Actions       |

---

## 🚧 Setup Instructions

```bash
# Clone the repo
git clone https://github.com/<your-username>/autoapply.git
cd autoapply

# Install backend requirements
cd backend
pip install -r requirements.txt

# Start backend
uvicorn main:app --reload

# Start frontend (in a separate terminal)
cd frontend
npm install
npm run dev
