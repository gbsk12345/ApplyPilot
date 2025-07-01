import requests
import json
import re
from bs4 import BeautifulSoup
from pathlib import Path
import spacy
from spacy.matcher import PhraseMatcher

# Load spaCy and initialize matcher once globally
nlp = spacy.load("en_core_web_sm")
matcher = PhraseMatcher(nlp.vocab)

# --- Phase 1: Pre-computation - The Skills Dictionary (IMPROVED) ---


def load_skills_from_file(filepath):
    """
    Loads skills from a text file into a set for efficient O(1) lookup.
    This version cleans the skills by removing any parenthetical notes.
    For example, 'ada (programming language)' becomes 'ada'.
    """
    skills = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                paren_index = line.find('(')
                skill = line[:paren_index] if paren_index != -1 else line
                cleaned_skill = skill.strip().lower()
                if cleaned_skill:
                    skills.add(cleaned_skill)
        print(f"Successfully loaded and cleaned {len(skills)} skills.")
        return skills
    except FileNotFoundError:
        print(f"Error: The skills file at '{filepath}' was not found.")
        return set()

# --- Phase 2: Fetching the Job Posting HTML ---


def fetch_html(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

# --- Phase 3: Robust Description Extraction ---


def get_clean_description(soup, json_ld_data):
    description_text = ''
    # potential_selectors = [
    #     {'id': 'content'},
    #     {'id': 'app_body'},
    #     {'class': 'content-container'},
    #     {'class': 'job-description'},
    #     {'id': 'job-description'},
    #     {'class': 'job-details'}
    # ]   // For smartrecruiter.

    potential_selectors = []
    for selector in potential_selectors:
        desc_area = soup.find(attrs=selector)
        if desc_area:
            description_text = desc_area.get_text(separator=' ', strip=True)
            break

    if not description_text:
        best_candidate_text = ''
        max_len = 0
        for tag in soup.find_all(['div', 'article', 'section']):
            if tag.find(['nav', 'header', 'footer', 'form', 'aside']):
                continue
            current_text = tag.get_text(separator=' ', strip=True)
            current_len = len(current_text)
            if current_len > max_len:
                max_len = current_len
                best_candidate_text = current_text
        if max_len > 300:
            description_text = best_candidate_text

    if not description_text and json_ld_data:
        description_html = json_ld_data.get('description', '')
        if description_html:
            description_soup = BeautifulSoup(description_html, 'html.parser')
            description_text = description_soup.get_text(
                separator=' ', strip=True)

    if not description_text:
        description_text = soup.body.get_text(
            separator=' ', strip=True) if soup.body else ""

    return description_text

# --- Phase 4: Main Parsing Function ---


def parse_job_posting(html_content, skills_set):
    """
    Parses HTML to extract job details by orchestrating the extraction of each component.
    """
    if not html_content:
        return {"status": "error", "message": "No HTML content provided."}

    soup = BeautifulSoup(html_content, 'html.parser')
    job_data = {}
    json_ld_data = None

    json_ld_script = soup.find('script', type='application/ld+json')
    if json_ld_script:
        try:
            data = json.loads(json_ld_script.string)
            if data.get('@type') == 'JobPosting':
                json_ld_data = data
        except (json.JSONDecodeError, AttributeError):
            pass

    job_data['title'] = json_ld_data.get('title') if json_ld_data else (
        soup.find('h1').get_text(strip=True) if soup.find('h1') else 'N/A')
    job_data['company'] = json_ld_data.get(
        'hiringOrganization', {}).get('name') if json_ld_data else None
    if not job_data['company']:
        company_meta = soup.find('meta', property='og:site_name')
        job_data['company'] = company_meta['content'] if company_meta else 'N/A'

    # --- Clean the description text ---
    description_text = get_clean_description(soup, json_ld_data)
    clean_description = re.sub(r'\s+', ' ', description_text).lower()
    job_data['description_text'] = clean_description

    # --- Use spaCy PhraseMatcher for multi-word skill extraction ---
    doc = nlp(clean_description)
    found_skills = set()
    for match_id, start, end in matcher(doc):
        span = doc[start:end]
        found_skills.add(span.text.lower())

    job_data['extracted_skills'] = sorted(list(found_skills))
    return job_data

# --- Main Execution Logic ---


def main():
    skill_dir = Path("LightCast_Skills_Output")
    skill_file = skill_dir / "software_skills_lowercase.txt"

    if not skill_file.exists():
        print(
            f"CRITICAL ERROR: The skills file was not found at '{skill_file.resolve()}'")
        return

    skills_set = load_skills_from_file(skill_file)
    if not skills_set:
        print("Halting execution because skills could not be loaded.")
        return

    # --- Initialize PhraseMatcher with skills ---
    skill_patterns = [nlp.make_doc(skill) for skill in skills_set]
    matcher.add("SKILLS", skill_patterns)

    job_urls = [
        "https://job-boards.greenhouse.io/greenhouse/jobs/6605179?gh_jid=6605179",
        "https://jobs.lever.co/appen-2/d68f2b43-5413-480d-8cb0-b14d4fafde0e",
        "https://jobs.lever.co/appen-2/f5dd3da9-802f-4111-920a-4eb916944c22",
        "https://job-boards.greenhouse.io/cloudflare/jobs/6886051?gh_jid=6886051",
        "https://jobs.lever.co/plusgrade/9c9728f3-031d-4df5-b3a3-f060e338f684",
        "https://jobs.smartrecruiters.com/Playtech/744000068174146-software-developer-backend-content",
    ]

    for url in job_urls:
        print(f"\n--- Parsing URL: {url} ---")
        html = fetch_html(url)
        if html:
            parsed_data = parse_job_posting(html, skills_set)
            parsed_data['url'] = url
            print("\n--- FINAL PARSED DATA ---")
            print(json.dumps(parsed_data, indent=2))
        else:
            print(f"Could not retrieve HTML for {url}. Skipping.")

    print(f"\n--- Finished parsing all jobs. ---")


if __name__ == "__main__":
    main()
