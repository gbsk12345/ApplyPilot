
# 🚀 Dynamic Skill Extraction System – Design Notes

## 🎯 Objective
Build a **dynamic, scalable, and intelligent Skill Extraction Engine** to classify and clean skills from datasets like job descriptions. This system will distinguish between:

- **Technical Skills**
- **Soft Skills**
- Ignore irrelevant/junk words
- Track unknown skills for future enrichment

---

## ⚡ Challenges
- **No Public LinkedIn Skills API**: Restricted to official partners.
- **Lightcast API**: Enterprise-level, limited free access.
- **Noisy Data**: Skills datasets often include junk words (e.g., *why*, *it*, *communication skills*).

---

## ✅ Solution Approach

### 1️⃣ Data Sources Integration
Leverage multiple **public and dynamic sources** to maintain updated skill lists.

| Source                | Type             | Purpose                              | Access     |
|-----------------------|------------------|--------------------------------------|------------|
| **Kaggle Datasets**   | Tech & Soft      | Base skill lists                     | Free       |
| **GitHub Scraper**    | Technical        | Trending frameworks, tools, languages| Dynamic    |
| **StackOverflow Tags**| Technical        | Popular developer tags               | Dynamic    |
| **ESCO**              | Tech & Soft      | EU skills taxonomy                   | Public     |
| **O*NET**             | Soft Skills      | US occupational skills               | Public     |
| **Lightcast Reports** | Mixed            | Manual enrichment when available     | Limited    |
| **Custom Additions**  | Both             | User-defined skills                  | Flexible   |

---

### 2️⃣ System Design

- **Core Engine**:
  - Load datasets into structured sets/dictionaries.
  - Classify extracted skills dynamically.
  - Handle multi-word skills.
  - Remove junk words (minimal hardcoded filtering).

- **Auto-Updating Scrapers**:
  - GitHub Trending → Update technical skills weekly.
  - StackOverflow Tags → Capture latest developer trends.

- **Manual Enrichment**:
  - Plug in Lightcast reports or LinkedIn insights when possible.

- **Output Files**:
  - `technical_skills_list.txt` / `.csv`
  - `soft_skills_list.txt` / `.csv`
  - `unknown_skills_list.txt` — for future learning.

---

### 3️⃣ Classification Logic
For each extracted skill:

\`\`\`plaintext
IF skill IN technical_skills_master_list:
    → Classify as TECHNICAL
ELIF skill IN soft_skills_master_list:
    → Classify as SOFT SKILL
ELIF skill IN junk_words:
    → Ignore
ELSE:
    → Add to UNKNOWN for review
\`\`\`

---

### 4️⃣ Suggested Data Structure (CSV Format)
| Skill            | Category   | Source     | Date Added |
|------------------|------------|------------|------------|
| Python           | Technical  | Kaggle     | 2025-04-26 |
| Kubernetes       | Technical  | GitHub     | 2025-04-26 |
| Team Leadership  | Soft       | O*NET      | 2025-04-26 |
| FastAPI          | Technical  | GitHub     | 2025-04-26 |
| Problem Solving  | Soft       | ESCO       | 2025-04-26 |

---

## 🚀 Automation Plan
- Use `APScheduler` or `cron` jobs to:
  - Run scrapers weekly.
  - Refresh master skill lists.
- Maintain a `custom_additions.csv` for manual entries.
- Track unknown skills for periodic review.

---

## 🚧 Future Enhancements
- Integrate **Light NLP models** to detect context-based skills.
- Use **fuzzy matching** to handle typos or variations (e.g., `Javascript` vs `JavaScript`).
- Build a simple dashboard to monitor:
  - Skill trends.
  - New unknown skills.
  - Updates from GitHub/StackOverflow.
- Explore limited access to **LinkedIn & Lightcast data** for enrichment.

---

## ⚡ Conclusion
This approach ensures:
- **Dynamic updates** without relying on restricted APIs.
- A balance between automation and manual control.
- Scalable, clean skill extraction suited for ATS scoring, resume parsing, and job matching.

---

## 📂 Folder Structure Example
\`\`\`plaintext
skill_engine/
├── data/
│   ├── technical_skills_master_list.csv
│   ├── soft_skills_master_list.csv
│   ├── custom_additions.csv
│   └── unknown_skills_list.csv
├── github_scraper.py
├── stackoverflow_scraper.py
├── skill_engine.py
└── README.md
\`\`\`

---

## 📝 Notes for Future Continuation
- 🔹 **Add new datasets** as discovered.
- 🔹 Regularly check for Lightcast public reports.
- 🔹 Monitor LinkedIn for any API policy changes or limited public endpoints.
- 🔹 Expand `custom_additions.csv` as unique skills appear.
- 🔹 Improve classification logic with ML when dataset grows.
