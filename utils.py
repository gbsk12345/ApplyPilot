import requests
from bs4 import BeautifulSoup
import re

def load_skills_from_file(file_path):
    skills = set()
    with open(file_path, 'r') as file:
        for line in file:
            skill = line.strip().lower()
            skill = re.sub(r'\(.*', '', skill).strip()
            if skill:
                skills.add(skill)
    return skills

def get_job_links(careers_url, link_pattern):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(careers_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    job_links = set()
    for link in soup.find_all('a', href=True):
        href = link['href']
        if link_pattern in href:
            job_links.add(requests.compat.urljoin(careers_url, href))

    return list(job_links)[:5]  # Limit for demo

def scrape_job_description(job_url, div_class):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(job_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    desc_div = soup.find('div', {'class': div_class})
    if desc_div:
        return desc_div.get_text(separator=' ', strip=True)
    return ""

def extract_skills(text, tech_skills):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return {skill for skill in tech_skills if skill in text}