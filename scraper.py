import json
from utils import get_job_links, scrape_job_description, extract_skills, load_skills_from_file

# scraping jobs for remoteok and others.
if __name__ == "__main__":
    with open('config.json') as f:
        config = json.load(f)

    tech_skills = load_skills_from_file("tech_skills_list.txt")

    for company in config['companies']:
        print(f"\nScraping jobs for {company['name']}...")
        job_links = get_job_links(
            company['career_page'], company['job_link_pattern'])

        for job_url in job_links:
            desc = scrape_job_description(
                job_url, company['description_div_class'])
            skills = extract_skills(desc, tech_skills)
            print(f"{job_url} ➜ {skills}")
