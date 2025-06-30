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
            # Use a set comprehension for a concise and efficient way to build the set.
            # .strip() removes leading/trailing whitespace, including newlines.
            skills = {line.strip() for line in f if line.strip()}
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
    # A common User-Agent to mimic a real browser visit
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        # timeout=10 tells requests to stop waiting for a response after 10 seconds
        response = requests.get(url, headers=headers, timeout=10)
        # This will raise an HTTPError for bad responses (4xx or 5xx)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

# --- Phase 3 & 4: Parsing, Extraction, and Skill Matching ---


def parse_job_posting(html_content, skills_set):
    """
    Parses HTML to extract job details using a combination of strategies.
    It prioritizes structured data (JSON-LD) and falls back to HTML tag heuristics.

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

    # --- Strategy 1: Look for JSON-LD Structured Data (The Gold Standard) ---
    # Greenhouse and Lever often use this. It's the most reliable method.
    json_ld_script = soup.find('script', type='application/ld+json')
    if json_ld_script:
        try:
            data = json.loads(json_ld_script.string)
            # Ensure it's a job posting schema
            if data.get('@type') == 'JobPosting':
                job_data['title'] = data.get('title', 'N/A')
                job_data['company'] = data.get(
                    'hiringOrganization', {}).get('name', 'N/A')
                job_data['location'] = data.get('jobLocation', {}).get(
                    'address', {}).get('addressLocality', 'N/A')

                # The description can be HTML, so we parse it again to get clean text
                description_html = data.get('description', '')
                description_soup = BeautifulSoup(
                    description_html, 'html.parser')
                job_data['description_text'] = description_soup.get_text(
                    separator=' ', strip=True)
                job_data['source'] = 'JSON-LD'
        except (json.JSONDecodeError, AttributeError):
            # If JSON-LD is malformed or doesn't contain what we need, we'll fall back.
            pass

    # --- Strategy 2: Fallback to Heuristics if JSON-LD fails or is absent ---
    if not job_data:
        job_data['source'] = 'HTML Heuristics'

        # Title: Usually in the <h1> tag or the <title> tag
        job_data['title'] = soup.find('h1').get_text(
            strip=True) if soup.find('h1') else 'N/A'

        # Company: Harder to get, but we can check meta tags
        company_meta = soup.find('meta', property='og:site_name')
        job_data['company'] = company_meta['content'] if company_meta else 'N/A'

        # Location: Lever and Greenhouse have specific patterns
        # For Lever:
        location_div = soup.find('div', class_='location')
        if location_div:
            job_data['location'] = location_div.get_text(strip=True)
        else:  # For Greenhouse:
            # Greenhouse often uses this class too
            location_div = soup.find('div', class_='location')
            if location_div:
                job_data['location'] = location_div.get_text(strip=True)
            else:
                job_data['location'] = 'N/A'

        # Description: Find the main content area
        # Greenhouse uses id="content", Lever often uses a class like 'content-wrapper'
        desc_area = soup.find(id='content') or \
            soup.find(class_='content-wrapper') or \
            soup.find('section', class_='job-description')

        if desc_area:
            job_data['description_text'] = desc_area.get_text(
                separator=' ', strip=True)
        else:
            # If all else fails, get all text from the body
            job_data['description_text'] = soup.body.get_text(
                separator=' ', strip=True) if soup.body else ""

    # --- Skill Extraction ---
    description_lower = job_data.get('description_text', '').lower()
    # Use regex to find word boundaries around potential skills. This prevents matching "java" in "javascript".
    # It also handles cases where a skill might be followed by a comma, period, etc.
    found_skills = {skill for skill in skills_set if re.search(
        r'\b' + re.escape(skill) + r'\b', description_lower)}
    job_data['extracted_skills'] = sorted(list(found_skills))

    return job_data

# --- Main Execution Logic ---


def main():
    """
    Main function to run the job parsing process.
    """
    # --- Setup ---
    # Create a dummy skills file for demonstration purposes.
    # In your project, you will already have this file.
    skill_dir = Path("LightCast_Skills_Output")
    skill_file = skill_dir / "software_skills_lowercase.txt"

    if not skill_file.exists():
        print("Creating a dummy skills file for demonstration...")
        skill_dir.mkdir(exist_ok=True)
        dummy_skills = ["python", "java", "sql", "react",
                        "javascript", "aws", "docker", "c++", "project management"]
        with open(skill_file, 'w') as f:
            for skill in dummy_skills:
                f.write(skill + '\n')

    # Load the skills into a set for fast lookups
    skills_set = load_skills_from_file(skill_file)
    if not skills_set:
        print("Halting execution because skills could not be loaded.")
        return

    job_urls = [
        "https://job-boards.greenhouse.io/greenhouse/jobs/6605179?gh_jid=6605179",
        "https://job-boards.greenhouse.io/greenhouse/jobs/6605179?gh_jid=6605179",
        "https://jobs.lever.co/appen-2/d68f2b43-5413-480d-8cb0-b14d4fafde0e",
        "https://jobs.lever.co/appen-2/f5dd3da9-802f-4111-920a-4eb916944c22"
    ]

    # --- Processing ---
    all_jobs_data = []
    for url in job_urls:
        print(f"\n--- Parsing URL: {url} ---")
        html = fetch_html(url)
        if html:
            parsed_data = parse_job_posting(html, skills_set)
            parsed_data['url'] = url  # Add the original URL for reference
            all_jobs_data.append(parsed_data)
            # Pretty print the result for this job
            print(json.dumps(parsed_data, indent=2))
        else:
            print(f"Could not retrieve HTML for {url}. Skipping.")

    # You can now use 'all_jobs_data' list for further processing,
    # like saving to a database or a CSV file.
    print(f"\n--- Finished parsing all {len(all_jobs_data)} jobs. ---")


if __name__ == "__main__":
    main()
