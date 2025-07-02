# fetch_linkedin_jobs.py
# This script contacts a local LinkedIn Jobs API server, then enriches each job with full description and metadata

import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urlparse
import re

# Extract jobId from jobUrl


def extract_job_id(job_url):
    try:
        if not job_url:
            return None
        path = urlparse(job_url).path
        matches = re.findall(r'-(\d+)$', path)
        return matches[0] if matches else None
    except Exception:
        return None

# Fetch full job description + job criteria


def fetch_job_details(job_id):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9"
        }
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"[!] Failed for {job_id}: {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        # --- Description section ---
        desc_div = soup.select_one('[class*=description] > section > div')
        description = desc_div.get_text(
            separator='\n').strip() if desc_div else ""

        # --- Job Criteria (Employment type, Seniority, etc.) ---
        criteria = {}
        for li in soup.select('.description__job-criteria-list > li'):
            label = li.select_one('.description__job-criteria-subheader')
            value = li.select_one(
                'span:not(.description__job-criteria-subheader)')
            if label and value:
                criteria[label.get_text(strip=True)
                         ] = value.get_text(strip=True)

        return {
            "description": description,
            "criteria": criteria
        }

    except Exception as e:
        print(f"[ERROR] {job_id}: {e}")
        return None

# Fetch job listings and enrich them


def fetch_all_jobs(keyword, location, total_jobs=100):
    all_jobs = []
    jobs_per_page = 25  # Max per API
    total_pages = (total_jobs + jobs_per_page - 1) // jobs_per_page

    for page in range(total_pages):
        params = {
            "keyword": keyword,
            "location": location,
            "limit": str(jobs_per_page),
            "page": str(page)
        }

        print(f"🔄 Fetching page {page + 1}...")
        response = requests.get("http://localhost:3000/jobs", params=params)
        if response.status_code != 200:
            print("❌ Error:", response.status_code, response.text)
            break

        jobs = response.json()
        if not jobs:
            break

        for job in jobs:
            job_id = extract_job_id(job.get("jobUrl", ""))
            if not job_id:
                job["description"] = None
                job["criteria"] = {}
                continue

            details = fetch_job_details(job_id)
            if details:
                job["description"] = details.get("description", "")
                job["criteria"] = details.get("criteria", {})
            else:
                job["description"] = None
                job["criteria"] = {}

            time.sleep(1.5)

        all_jobs.extend(jobs)
        time.sleep(1)

    print(f"✅ Fetched and enriched total {len(all_jobs)} jobs.")
    return all_jobs[:total_jobs]  # in case fewer than expected returned


# Run example
if __name__ == "__main__":
    results = fetch_all_jobs(
        "software engineer", "United States", total_jobs=200)

    for i, job in enumerate(results):
        print(f"{i+1}. {job.get('position', 'N/A')} at {job.get('company', 'N/A')}")
        print(f"    {job.get('jobUrl', '')}")
        # print(f"    Description: {job.get('description', '')[:200]}...\n")
        desc = job.get('description') or ""
        print(f"    Description: {desc[:200]}...\n")
        print(f"    Criteria: {job.get('criteria', {})}")
        print("-" * 60)
