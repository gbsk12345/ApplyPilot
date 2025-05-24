
# ===========================
# ResumeSkillParser.py
# ===========================

# This Python file defines the ResumeSkillParser class.
# It encapsulates all the logic needed to:
# - Load a resume file (PDF, DOCX, or TXT)
# - Load a skill list from a text file
# - Extract relevant sections
# - Match skills using regex
# - Return a list of extracted skills and parsed description
# ===========================

import os
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# ✅ SAFER: Ensure required NLTK resources are available by calling the APIs directly


def ensure_nltk_resources():
    try:
        stopwords.words('english')
    except LookupError:
        nltk.download('stopwords')

    try:
        word_tokenize("This is a test.", preserve_line=True)
    except LookupError:
        nltk.download('punkt')


# ✅ Call it once at the top
ensure_nltk_resources()

# ===========================
# ResumeSkillParser Class
# ===========================


class ResumeSkillParser:
    def __init__(self):
        self.resume_text = ""
        self.skills_found = []
        self.skill_file_path = None
        self.resume_path = None
        self.skills_list = []

        # These are used for finding skill sections in resume text
        self.SKILL_SECTION_KEYWORDS = [
            "skills", "technical skills", "technical proficiencies", "core competencies",
            "key skills", "technologies", "tools & technologies", "tools and technologies",
            "programming languages", "software proficiency", "technical expertise",
            "expertise", "proficient in", "familiar with"
        ]

    def set_skill_file_path(self, path):
        # Set the path to the skill file and load its contents into memory
        self.skill_file_path = path
        with open(path, "r") as f:
            self.skills_list = [line.strip().lower()
                                for line in f if line.strip()]
        # Also compile regex patterns for matching later
        self.regex_patterns = {re.compile(
            r"\b" + re.escape(skill) + r"\b"): skill for skill in self.skills_list}

    def set_resume_path(self, path):
        # Set the path to the resume and read text from it
        self.resume_path = path
        self.resume_text = self._get_text_from_resume(path)

    def _get_text_from_resume(self, path):
        # Extract text from PDF, DOCX or TXT using format-based branching
        if path.lower().endswith(".pdf"):
            from PyPDF2 import PdfReader
            reader = PdfReader(path)
            text = " ".join(page.extract_text()
                            for page in reader.pages if page.extract_text())
        elif path.lower().endswith(".docx"):
            import docx
            doc = docx.Document(path)
            text = " ".join([p.text for p in doc.paragraphs])
        elif path.lower().endswith(".txt"):
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        else:
            raise ValueError("Unsupported file format")
        return text

    def _preprocess_text(self, text):
        # Convert to lowercase, remove stopwords
        words = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        return " ".join([w for w in words if w.isalnum() and w not in stop_words])

    def parse_resume(self):
        # Extract relevant skill keywords using regex
        preprocessed = self._preprocess_text(self.resume_text)
        found = set()
        for pattern, skill in self.regex_patterns.items():
            if pattern.search(preprocessed):
                found.add(skill)
        self.skills_found = sorted(found)

    def get_skills(self):
        return self.skills_found

    def get_description(self):
        return f"Resume analyzed for skills: {', '.join(self.skills_found)}"
