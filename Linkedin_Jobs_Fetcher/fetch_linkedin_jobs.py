# ----------------------------- fetch_linkedin_jobs.py -----------------------------
# ⛳ GOAL: Fetch job listings from LinkedIn Jobs API + enrich with full job description + metadata.
# 🔗 Architecture:
#   1. Pull listings from local Node.js server (running on localhost:3000)
#   2. Extract Job ID from each listing's LinkedIn URL
#   3. Call LinkedIn's public "jobs-guest" API to get full job description and metadata
#   4. Output enriched jobs list (can be printed, exported to JSON, etc.)

import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urlparse
import re
import pandas as pd
from typing import List, Dict, Any

import matplotlib.pyplot as plt
from collections import Counter

# ------------------------ 1. Extract LinkedIn Job ID from URL -----------------------


def extract_job_id(job_url: str) -> str:
    """
    Extracts the numeric job ID from the LinkedIn job posting URL.
    Example URL: https://www.linkedin.com/jobs/view/software-engineer-at-google-4260274210
    Returns: 4260274210
    """
    try:
        if not job_url:
            return None
        path = urlparse(job_url).path
        match = re.findall(r'-(\d+)$', path)
        return match[0] if match else None
    except Exception:
        return None

# --------------------- 2. Get Full Job Description and Job Criteria ------------------


def fetch_job_details(job_id: str) -> Dict[str, Any]:
    """
    Scrapes the job's full detail page using LinkedIn's public jobs-guest API.
    Returns:
        - description: Text of the job description
        - criteria: Dictionary with fields like Employment type, Industries, etc.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9"
        }
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 429:
            print(f"[429 TOO MANY REQUESTS] Backing off for jobId {job_id}")
            time.sleep(5)
            return None
        elif response.status_code >= 400:
            print(f"[!] Failed for {job_id}: {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        # Description block
        desc_div = soup.select_one('[class*=description] > section > div')
        description = desc_div.get_text(
            separator='\n').strip() if desc_div else ""

        # Job Criteria
        criteria = {}
        for li in soup.select('.description__job-criteria-list > li'):
            label = li.select_one('.description__job-criteria-subheader')
            value = li.select_one(
                'span:not(.description__job-criteria-subheader)')
            if label and value:
                criteria[label.get_text(strip=True)
                         ] = value.get_text(strip=True)

        return {"description": description, "criteria": criteria}

    except Exception as e:
        print(
            f"[ERROR] Fetching job details failed for job_id={job_id}:\n    {e}")
        return None

# ----------------------- 3. Stage 1: Fetch Job Listings -----------------------------


def fetch_job_urls(keyword: str, location: str, total_jobs: int = 50) -> List[Dict[str, Any]]:
    """
    Contacts the local Node.js server (Linkedin_Jobs_server.js) to fetch job listings.
    Returns a list of jobs, each with basic fields like position, company, jobUrl, etc.
    """
    all_jobs = []
    jobs_per_page = 25
    total_pages = (total_jobs + jobs_per_page - 1) // jobs_per_page

    for page in range(total_pages):
        params = {
            "keyword": keyword,
            "location": location,
            "limit": str(jobs_per_page),
            "page": str(page)
        }

        print(f"🔄 Fetching job page {page + 1}...")
        try:
            response = requests.get(
                "http://localhost:3000/jobs", params=params)
            response.raise_for_status()
            jobs = response.json()
            if not jobs:
                break
            all_jobs.extend(jobs)
        except Exception as e:
            print(f"❌ Failed to fetch job page {page + 1}: {e}")
            break

        time.sleep(1)  # polite delay

    return all_jobs[:total_jobs]

# ------------------- 4. Stage 2: Enrich with Descriptions & Metadata -------------------


def enrich_jobs_with_details(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Loops through the raw job list and appends 'description' and 'criteria' fields
    by calling LinkedIn's jobs-guest API per job.
    """
    for job in jobs:
        job_url = job.get("jobUrl", "")
        job_id = extract_job_id(job_url)
        if not job_id:
            job["description"] = ""
            job["criteria"] = {}
            continue

        details = fetch_job_details(job_id)
        if details:
            job["description"] = details["description"]
            job["criteria"] = details["criteria"]
        else:
            job["description"] = ""
            job["criteria"] = {}

        time.sleep(1.5)  # avoid getting 429 errors

    return jobs

# ---------------------------- 5. Execution Block ---------------------------------------
# ---------------------------- 5. Execution Block ---------------------------------------


if __name__ == "__main__":
    # Example usage
    keyword = "software engineer"
    location = "United States"
    total_jobs = 900

    # Step 1: Fetch job listings
    job_list = fetch_job_urls(keyword, location, total_jobs)
    print("✅ No of jobs fetched:", len(job_list))

    # Step 2: Extract and print job URLs
    print(f"\n🔗 Job URLs:")
    job_urls = []
    for i, job in enumerate(job_list, 1):
        url = job.get('jobUrl', 'N/A')
        job_urls.append(url)
        print(f"{i:3}. {url}")

    print("=" * 80)

    # Step 3: Save job URLs to a file (text or CSV)
    with open("linkedin_job_urls.txt", "w", encoding="utf-8") as f:
        for url in job_urls:
            f.write(url + "\n")
    print("📁 Saved all job URLs to 'linkedin_job_urls.txt'")
