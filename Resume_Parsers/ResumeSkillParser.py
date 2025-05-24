
import os
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Ensure necessary NLTK resources are available
def ensure_nltk_resources():
    try:
        stopwords.words('english')
    except LookupError:
        nltk.download('stopwords')

    try:
        word_tokenize("test")
    except LookupError:
        nltk.download('punkt')

ensure_nltk_resources()

class ResumeSkillParser:
    def __init__(self, skill_file_path=None):
        self.skill_file_path = skill_file_path
        self.technical_skills = []
        self.compiled_skill_patterns = {}
        self.stop_words = set(stopwords.words('english'))
        self.SKILL_SECTION_KEYWORDS = [
            "skills", "technical skills", "technical proficiencies", "core competencies",
            "key skills", "technologies", "tools & technologies", "tools and technologies",
            "programming languages", "software proficiency", "technical expertise",
            "expertise", "proficient in", "familiar with"
        ]
        self.skills_found = []
        self.resume_text = ""

        if skill_file_path:
            self.load_skills(skill_file_path)

    def load_skills(self, file_path):
        with open(file_path, 'r') as f:
            self.technical_skills = [line.strip().lower() for line in f if line.strip()]
        self.compiled_skill_patterns = {
            re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE): skill
            for skill in self.technical_skills
        }

    def load_resume(self, resume_path):
        self.resume_text = self._get_text_from_resume(resume_path)

    def _get_text_from_resume(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext == ".pdf":
            from PyPDF2 import PdfReader
            reader = PdfReader(path)
            return " ".join(page.extract_text() for page in reader.pages if page.extract_text())
        elif ext == ".docx":
            import docx
            doc = docx.Document(path)
            return " ".join(p.text for p in doc.paragraphs)
        elif ext == ".txt":
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        else:
            raise ValueError("Unsupported file format")

    def _preprocess_text(self, text):
        tokens = word_tokenize(text.lower())
        return " ".join([w for w in tokens if w not in self.stop_words])

    def _extract_skill_sections(self, text):
        lines = text.lower().splitlines()
        chunks = []
        collecting = False
        chunk = []

        for line in lines:
            if any(keyword in line for keyword in self.SKILL_SECTION_KEYWORDS):
                collecting = True
                if chunk:
                    chunks.append(" ".join(chunk))
                    chunk = []
                continue

            if collecting:
                if line.strip() == "" or len(line.strip()) < 2:
                    collecting = False
                    if chunk:
                        chunks.append(" ".join(chunk))
                        chunk = []
                else:
                    chunk.append(line.strip())

        if chunk:
            chunks.append(" ".join(chunk))

        return chunks

    def _match_skills(self, text):
        matches = set()
        for pattern, skill in self.compiled_skill_patterns.items():
            if pattern.search(text):
                matches.add(skill)
        return matches

    def parse(self):
        self.skills_found = []

        skill_chunks = self._extract_skill_sections(self.resume_text)
        if skill_chunks:
            for chunk in skill_chunks:
                clean = self._preprocess_text(chunk)
                self.skills_found.extend(self._match_skills(clean))
        else:
            print("No dedicated skill sections found using keywords.\n")
            print("--- Analyzing the full resume text as no specific skill sections were identified or they yielded no results ---")
            full_clean = self._preprocess_text(self.resume_text)
            self.skills_found.extend(self._match_skills(full_clean))

        self.skills_found = sorted(set(self.skills_found))

    def get_skills(self):
        return self.skills_found

    def get_description(self):
        return f"Resume analyzed for skills: {', '.join(self.skills_found)}"
