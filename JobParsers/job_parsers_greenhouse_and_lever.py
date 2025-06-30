import requests
from bs4 import BeautifulSoup
import re

# Load skills from a file


def load_skills_from_file(file_path):
    skills = set()
    with open(file_path, 'r') as file:
        for line in file:
            skill = line.strip().lower()
            skill = re.sub(r'\(.*', '', skill).strip()
            if skill:
                skills.add(skill)
    return skills

# Extract all visible text from the page


def extract_all_visible_text(url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Remove script, style, and noscript elements
    for tag in soup(['script', 'style', 'noscript']):
        tag.decompose()

    # Get all visible text
    text = soup.get_text(separator=' ', strip=True)
    return text

# Extract skills from the job description text


def extract_skills_from_text(text, skills):
    found = []
    text_lower = text.lower()
    for skill in skills:
        if skill in text_lower:
            found.append(skill)
    return list(set(found))

# Main function to process job URLs


def process_job_urls(urls, skills_file):
    skills = load_skills_from_file(skills_file)
    for url in urls:
        print("\n---")
        print(f"[URL] {url}")
        desc = extract_all_visible_text(url)
        if desc:
            # show first 500 chars
            print(f"\n[Job Description Preview]\n{desc[:500]}...\n")
            skills_found = extract_skills_from_text(desc, skills)
            print(f"Skills Found: {skills_found}")
        else:
            print("No job description found.")


# Example usage
if __name__ == "__main__":
    job_urls = [
        "https://job-boards.greenhouse.io/greenhouse/jobs/6770922?gh_jid=6770922",
        "https://job-boards.greenhouse.io/greenhouse/jobs/6736175?gh_jid=6736175",
        "https://jobs.lever.co/appen-2/d68f2b43-5413-480d-8cb0-b14d4fafde0e",
        "https://jobs.lever.co/appen-2/f5dd3da9-802f-4111-920a-4eb916944c22"
    ]
    # Replace with the path to your skills file
    skills_file_path = "tech_skills_list.txt"
    process_job_urls(job_urls, skills_file_path)
