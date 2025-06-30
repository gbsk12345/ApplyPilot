import requests
from bs4 import BeautifulSoup
import re
import os

# Load skills from file
SKILL_FILE_PATH = "LightCast_Skills_Output/software_skills_lowercase.txt"
if os.path.exists(SKILL_FILE_PATH):
    with open(SKILL_FILE_PATH, "r") as file:
        SKILLS = set(line.strip() for line in file if line.strip())
else:
    raise FileNotFoundError("Skills file not found at: " + SKILL_FILE_PATH)

# Extract skills from text


def extract_skills(text):
    text = text.lower()
    found_skills = set()
    for skill in SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', text):
            found_skills.add(skill)
    return list(found_skills)

# Extract job description text


def get_job_description(url):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None
        soup = BeautifulSoup(response.text, 'html.parser')
        content_tags = soup.find_all(['p', 'li', 'div'])
        full_text = ' '.join(tag.get_text(separator=' ', strip=True)
                             for tag in content_tags)
        return full_text
    except Exception as e:
        return f"Error fetching URL: {e}"

# Main parser function


def parse_job_url(url):
    job_text = get_job_description(url)
    if not job_text or job_text.startswith("Error"):
        return {
            "url": url,
            "error": job_text if job_text else "Failed to extract job text."
        }
    skills = extract_skills(job_text)
    return {
        "url": url,
        "skills_found": skills,
        "preview": job_text[:300] + '...'
    }


# ---------- Main Testing Block ----------
if __name__ == "__main__":
    job_urls = [
        "https://job-boards.greenhouse.io/greenhouse/jobs/6770922?gh_jid=6770922",
        "https://job-boards.greenhouse.io/greenhouse/jobs/6736175?gh_jid=6736175",
        "https://jobs.lever.co/appen-2/d68f2b43-5413-480d-8cb0-b14d4fafde0e",
        "https://jobs.lever.co/appen-2/f5dd3da9-802f-4111-920a-4eb916944c22"
    ]

    print("\n=== Job Parsing Results ===\n")
    for url in job_urls:
        result = parse_job_url(url)
        print(f"URL: {result['url']}")
        if "error" in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"✅ Skills Found: {result['skills_found']}")
            print(f"📝 Description Preview: {result['preview']}")
        print("-" * 80)
