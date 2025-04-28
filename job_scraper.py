import requests
from bs4 import BeautifulSoup
import re

# Load tech skills dynamically from file


def load_skills_from_file(file_path):
    skills = set()
    with open(file_path, 'r') as file:
        for line in file:
            skill = line.strip().lower()
            skill = re.sub(r'\(.*', '', skill).strip()
            if skill:
                skills.add(skill)
    return skills

# Step 1: Crawl job listings page


def get_job_links_remoteok(url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    job_links = set()
    for link in soup.find_all('a', href=True):
        href = link['href']
        if href.startswith('/remote-jobs/'):
            full_url = 'https://remoteok.com' + href
            job_links.add(full_url)

    return list(job_links)[:5]  # Limit for demo

# Step 2: Scrape job description


def scrape_job_description(url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    desc_div = soup.find('div', {'class': 'description'})
    if desc_div:
        return desc_div.get_text(separator=' ', strip=True)
    return ""

# Step 3: Extract skills


def extract_skills(job_text, tech_skills):
    job_text = job_text.lower()
    job_text = re.sub(r'[^a-z0-9\s]', ' ', job_text)
    found_skills = {skill for skill in tech_skills if skill in job_text}
    return found_skills


if __name__ == "__main__":
    tech_skills = load_skills_from_file("tech_skills_list.txt")
    job_board_url = 'https://remoteok.com/remote-dev-jobs'
    job_links = get_job_links_remoteok(job_board_url)

    for job_url in job_links:
        desc = scrape_job_description(job_url)
        skills = extract_skills(desc, tech_skills)
        print(f"\n{job_url}\nExtracted Skills: {skills}")
