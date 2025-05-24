import os
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# === Ensure NLTK resources are available ===
try:
    stopwords.words('english')
    word_tokenize("test")
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

# === Configuration Paths ===
base_dir = os.path.dirname(os.path.abspath(__file__))
mapping_file_path = os.path.join(base_dir, "cleaned_skill_mapping.txt")
resume_file_path = os.path.join(
    base_dir, "JobResume2.pdf")  # Replace with your file

# === Load Only Main Skills from Mapping File ===
MAIN_SKILLS_LIST = []
with open(mapping_file_path, 'r', encoding='utf-8') as f:
    for line in f:
        if "→" in line:
            keyword = line.split("→")[0].strip().lower()
            if keyword:
                MAIN_SKILLS_LIST.append(keyword)

# === Compile Regex Patterns for Skills ===
COMPILED_SKILL_PATTERNS = []
SINGLE_WORD_SKILLS_SET = set()

for skill in MAIN_SKILLS_LIST:
    if " " in skill or "." in skill or "#" in skill or "+" in skill or "-" in skill:
        pattern = r"\b" + r"\s+".join(re.escape(p)
                                      for p in skill.split()) + r"\b"
        COMPILED_SKILL_PATTERNS.append(re.compile(pattern, re.IGNORECASE))
    else:
        SINGLE_WORD_SKILLS_SET.add(skill)

# === Section Headers for Skill Extraction ===
SKILL_SECTION_KEYWORDS = [
    "skills", "technical skills", "technical proficiencies", "core competencies",
    "key skills", "technologies", "tools & technologies", "tools and technologies",
    "programming languages", "software proficiency", "technical expertise",
    "expertise", "proficient in", "familiar with"
]
GENERAL_SECTION_DELIMITERS = [
    "experience", "work experience", "professional experience", "employment history",
    "education", "academic qualifications", "qualifications", "academic background",
    "projects", "personal projects", "portfolio",
    "summary", "objective", "profile", "about me", "professional summary",
    "awards", "honors", "recognitions",
    "publications", "research",
    "certifications", "licenses", "courses",
    "references", "volunteer experience", "extracurricular activities", "interests", "hobbies"
]


def compile_regex_patterns(keywords):
    return re.compile(
        r"^\s*(" + "|".join(re.escape(k) for k in keywords) + r")\s*:?\s*$",
        re.IGNORECASE | re.MULTILINE
    )


SKILL_SECTION_HEADER_REGEX = compile_regex_patterns(SKILL_SECTION_KEYWORDS)
DELIMITER_HEADER_REGEX = compile_regex_patterns(GENERAL_SECTION_DELIMITERS)

# === Text Extraction ===


def extract_text_from_pdf(file_path):
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    except Exception as e:
        print(f"PDF Read Error: {e}")
        return ""


def get_text_from_resume(file_path):
    if not os.path.exists(file_path):
        print("❌ File not found.")
        return ""
    _, ext = os.path.splitext(file_path.lower())
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    else:
        print("❌ Unsupported file format. Only .pdf is supported.")
        return ""

# === Text Preprocessing ===


def preprocess_text_for_skill_matching(text):
    return text.lower() if text else ""

# === Extract Skill Sections from Resume ===


def extract_targeted_sections(full_text):
    sections = []
    lines = full_text.splitlines()
    in_skill_section = False
    buffer = []
    blank_lines = 0

    for line in lines:
        line_stripped = line.strip()
        is_skill_header = bool(SKILL_SECTION_HEADER_REGEX.match(line_stripped))
        is_delimiter = bool(DELIMITER_HEADER_REGEX.match(
            line_stripped)) and not is_skill_header

        if is_skill_header:
            if buffer:
                sections.append("\n".join(buffer))
            buffer = []
            in_skill_section = True
            blank_lines = 0
            continue

        if in_skill_section:
            if is_delimiter:
                if buffer:
                    sections.append("\n".join(buffer))
                buffer = []
                in_skill_section = False
                blank_lines = 0
                continue

            if not line_stripped:
                blank_lines += 1
                if blank_lines >= 2 and buffer:
                    sections.append("\n".join(buffer))
                    buffer = []
                    in_skill_section = False
                    blank_lines = 0
            else:
                blank_lines = 0
                buffer.append(line)

            if len(buffer) > 30:
                sections.append("\n".join(buffer))
                buffer = []
                in_skill_section = False

    if in_skill_section and buffer:
        sections.append("\n".join(buffer))
    return sections

# === Skill Matching Logic ===


def find_skills_in_chunk(text_chunk):
    found_skills = set()
    text = preprocess_text_for_skill_matching(text_chunk)

    for pattern in COMPILED_SKILL_PATTERNS:
        if pattern.search(text):
            skill = pattern.pattern.replace(r'\b', '').replace(
                r'\s+', ' ').replace('\\', '')
            found_skills.add(skill.strip())

    for skill in SINGLE_WORD_SKILLS_SET:
        if re.search(r"\b" + re.escape(skill) + r"\b", text):
            found_skills.add(skill)

    return found_skills

# === Main Parsing Flow ===


def parse_resume_for_skills(resume_path):
    print(f"\n📄 Processing resume: {resume_path}")
    full_text = get_text_from_resume(resume_path)
    if not full_text:
        print("❌ Could not extract text.")
        return []

    all_skills = set()
    skill_sections = extract_targeted_sections(full_text)

    for i, section in enumerate(skill_sections):
        print(f"\n🔍 Scanning section {i+1}...")
        skills = find_skills_in_chunk(section)
        if skills:
            print(f"✅ Found: {', '.join(sorted(skills))}")
            all_skills.update(skills)

    if not all_skills:
        print("\n⚠️ No skills found in sections. Doing full resume scan...")
        all_skills.update(find_skills_in_chunk(full_text))

    return sorted(all_skills)


# === Run the Parser and Show Output ===
if __name__ == "__main__":
    final_skills = parse_resume_for_skills(resume_file_path)
    print("\n🎯 Final Extracted Skills:")
    for skill in final_skills:
        print("-", skill)
