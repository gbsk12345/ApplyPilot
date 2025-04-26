import requests
from bs4 import BeautifulSoup
import os
import csv
import time
import re

BASE_URL = "https://github.com"
TRENDING_URL = "https://github.com/trending?since=weekly"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


def get_repo_details(repo_relative_url):
    repo_url = BASE_URL + repo_relative_url
    response = requests.get(repo_url, headers=HEADERS)
    if response.status_code != 200:
        print(f"❌ Failed to fetch {repo_url}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract primary language
    lang_tag = soup.find(
        'span', attrs={'class': 'color-fg-default text-bold mr-1'})
    language = lang_tag.text.strip() if lang_tag else None

    # Extract stars
    star_tag = soup.find(
        'a', attrs={'href': f'{repo_relative_url}/stargazers'})
    stars = star_tag.text.strip() if star_tag else "0"

    # Extract topics
    topic_tags = soup.find_all('a', class_='topic-tag topic-tag-link')
    topics = [tag.text.strip() for tag in topic_tags if tag.text.strip()]

    return language, stars, topics


def clean_term(term):
    term = term.strip().lower()
    term = re.sub(r"[^a-zA-Z0-9\+\#\.]", "", term)
    if 2 < len(term) < 30:
        return term
    return None


def scrape_github_trending():
    response = requests.get(TRENDING_URL, headers=HEADERS)
    if response.status_code != 200:
        print(
            f"❌ Failed to fetch GitHub Trending! Status Code: {response.status_code}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    repos = soup.find_all('article', class_='Box-row')

    if not repos:
        print("⚠️ No repositories found. GitHub layout might have changed.")
        return

    os.makedirs("skills", exist_ok=True)

    dynamic_skills = set()
    csv_file = open("skills/trending_repos.csv", mode='w',
                    newline='', encoding='utf-8')
    writer = csv.writer(csv_file)
    writer.writerow(["Repo Name", "Description",
                    "Language", "Stars", "Topics"])

    for repo in repos:
        header = repo.h2.a['href']
        repo_name = header.strip("/")

        description_tag = repo.find('p', class_='col-9')
        description = description_tag.text.strip() if description_tag else ""

        print(f"🔎 Deep scraping {repo_name} ...")
        language, stars, topics = get_repo_details(header)
        time.sleep(1)

        writer.writerow(
            [repo_name, description, language or "", stars, ", ".join(topics)])

        if language:
            cleaned = clean_term(language)
            if cleaned:
                dynamic_skills.add(cleaned)

        for topic in topics:
            cleaned = clean_term(topic)
            if cleaned:
                dynamic_skills.add(cleaned)

        # Simple description scan for potential skills
        for word in description.split():
            cleaned = clean_term(word)
            if cleaned:
                dynamic_skills.add(cleaned)

    csv_file.close()

    # Save skills
    with open("skills/trending_skills.txt", "w") as f:
        for skill in sorted(dynamic_skills):
            f.write(f"{skill}\n")

    print(
        f"\n✅ Scraping complete! Found {len(dynamic_skills)} unique inferred technical skills.")
    print("Saved to: skills/trending_skills.txt and trending_repos.csv")


if __name__ == "__main__":
    scrape_github_trending()
