import requests
import json
import re
from bs4 import BeautifulSoup
from pathlib import Path

# --- Phase 1: Pre-computation - The Skills Dictionary ---


def load_skills_from_file(filepath):
    """
    Loads skills from a text file into a set for efficient O(1) lookup.
    This function is called only once when the script starts.

    Args:
        filepath (str or Path): The path to the skills file.

    Returns:
        set: A set of lowercase skills, or an empty set if the file is not found.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            skills = {line.strip().lower() for line in f if line.strip()}
        print(f"Successfully loaded {len(skills)} skills.")
        return skills
    except FileNotFoundError:
        print(f"Error: The skills file at '{filepath}' was not found.")
        print("Please ensure the file exists and the path is correct.")
        return set()

# --- Phase 2: Fetching the Job Posting HTML ---


def fetch_html(url):
    """
    Fetches the HTML content of a URL, pretending to be a browser.

    Args:
        url (str): The URL of the job posting.

    Returns:
        str: The HTML content of the page as text, or None if an error occurs.
    """
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

# --- Phase 3 & 4: Parsing, Extraction, and Skill Matching (Corrected & Transparent) ---


def parse_job_posting(html_content, skills_set):
    """
    Parses HTML to extract job details using a robust, multi-layered approach.
    It attempts to extract each piece of data (title, company, etc.) independently,
    with multiple fallbacks and diagnostic print statements.

    Args:
        html_content (str): The raw HTML of the job page.
        skills_set (set): The set of skills for matching.

    Returns:
        dict: A dictionary containing the structured job information.
    """
    if not html_content:
        return {"status": "error", "message": "No HTML content provided."}

    soup = BeautifulSoup(html_content, 'html.parser')
    job_data = {}
    json_ld_data = None

    # --- Step 1: Attempt to parse JSON-LD data once for metadata ---
    json_ld_script = soup.find('script', type='application/ld+json')
    if json_ld_script:
        try:
            data = json.loads(json_ld_script.string)
            if data.get('@type') == 'JobPosting':
                json_ld_data = data
        except (json.JSONDecodeError, AttributeError):
            pass  # Ignore malformed JSON

    # --- Step 2: Extract metadata fields with fallbacks ---
    job_data['title'] = json_ld_data.get('title') if json_ld_data else None
    if not job_data['title']:
        job_data['title'] = soup.find('h1').get_text(
            strip=True) if soup.find('h1') else 'N/A'

    job_data['company'] = json_ld_data.get(
        'hiringOrganization', {}).get('name') if json_ld_data else None
    if not job_data['company']:
        company_meta = soup.find('meta', property='og:site_name')
        job_data['company'] = company_meta['content'] if company_meta else 'N/A'

    # --- Step 3: Description Extraction (CORRECTED & TRANSPARENT LOGIC) ---
    description_text = ''
    print("-> Starting description search...")

    # A. Try a list of common, specific container selectors. This is the most reliable method.
    # This is the key fix for the Greenhouse page.
    potential_selectors = [
        {'id': 'content'},
        {'class': 'content-container'},
        {'class': 'job-description'},
        {'id': 'job-description'}
    ]
    for selector in potential_selectors:
        desc_area = soup.find(attrs=selector)
        if desc_area:
            print(f"   [SUCCESS] Found description using selector: {selector}")
            description_text = desc_area.get_text(separator=' ', strip=True)
            break

    # B. If specific selectors fail, try getting the description from JSON-LD data. This works for Lever.
    if not description_text:
        print("   [INFO] Specific selectors failed. Trying JSON-LD description...")
        if json_ld_data:
            description_html = json_ld_data.get('description', '')
            if description_html:
                print("   [SUCCESS] Found description in JSON-LD.")
                description_soup = BeautifulSoup(
                    description_html, 'html.parser')
                description_text = description_soup.get_text(
                    separator=' ', strip=True)

    # C. As a final resort, if still no description, grab all text from the page body.
    if not description_text:
        print(
            "   [WARNING] All primary methods failed. Falling back to full page body text.")
        description_text = soup.body.get_text(
            separator=' ', strip=True) if soup.body else ""

    print(
        f"-> Description text found (first 200 chars): '{description_text[:200]}...'")

    # --- Step 4: Clean the final description and extract skills ---
    clean_description = re.sub(r'\s+', ' ', description_text).lower()
    job_data['description_text'] = clean_description

    print("-> Starting skill search...")
    found_skills = set()
    for skill in skills_set:
        # Use a robust regex to find skills as whole words/phrases.
        pattern = r'(?:\W|^)' + re.escape(skill) + r'(?:\W|$)'
        if re.search(pattern, clean_description):
            found_skills.add(skill)

    job_data['extracted_skills'] = sorted(list(found_skills))
    print(f"-> Found {len(found_skills)} skills.")

    return job_data

# --- Main Execution Logic ---


def main():
    """
    Main function to run the job parsing process.
    """
    skill_dir = Path("LightCast_Skills_Output")
    skill_file = skill_dir / "software_skills_lowercase.txt"

    if not skill_file.exists():
        print("Creating a dummy skills file for demonstration...")
        skill_dir.mkdir(exist_ok=True)
        dummy_skills = [
            "python", "java", "sql", "react", "javascript", "aws", "docker", "c++",
            "project management", "pytorch", "transformers", "nlp", "machine learning",
            "deep learning", "sagemaker", "windows", "lan", "wan", "ruby", "typescript"
        ]
        with open(skill_file, 'w', encoding='utf-8') as f:
            for skill in dummy_skills:
                f.write(skill + '\n')

    skills_set = load_skills_from_file(skill_file)
    if not skills_set:
        print("Halting execution because skills could not be loaded.")
        return

    job_urls = [
        "https://job-boards.greenhouse.io/greenhouse/jobs/6605179?gh_jid=6605179",
        "https://jobs.lever.co/appen-2/d68f2b43-5413-480d-8cb0-b14d4fafde0e",
        "https://jobs.lever.co/appen-2/f5dd3da9-802f-4111-920a-4eb916944c22"
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
