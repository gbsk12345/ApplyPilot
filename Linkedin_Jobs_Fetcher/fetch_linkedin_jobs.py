# ----------------------------- fetch_linkedin_jobs.py -----------------------------
# ⛳ GOAL: Fetch job listings from LinkedIn Jobs API + enrich with full job description + metadata.
# 🔗 Architecture:
#   1. Pull listings from local Node.js server (running on localhost:3000)
#   2. Extract Job ID from each listing's LinkedIn URL
#   3. Call LinkedIn's public "jobs-guest" API to get full job description and metadata
#   4. Output enriched jobs list (can be printed, exported to JSON, etc.)

from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import requests
from bs4 import BeautifulSoup
import time


import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urlparse
import re
import pandas as pd
from typing import List, Dict, Any

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
    Uses LinkedIn's jobs-guest API + Selenium to extract:
    - description (from LinkedIn jobs-guest API)
    - criteria (from LinkedIn jobs-guest API)
    - applyUrl (via Selenium from full LinkedIn job page)
    """

    # --------- PART 1: jobs-guest API (description + criteria) ----------
    description = ""
    criteria = {}

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
        elif response.status_code >= 400:
            print(f"[!] Failed API for {job_id}: {response.status_code}")
        else:
            soup = BeautifulSoup(response.text, 'html.parser')

            desc_div = soup.select_one('[class*=description] > section > div')
            description = desc_div.get_text(
                separator='\n').strip() if desc_div else ""

            for li in soup.select('.description__job-criteria-list > li'):
                label = li.select_one('.description__job-criteria-subheader')
                value = li.select_one(
                    'span:not(.description__job-criteria-subheader)')
                if label and value:
                    criteria[label.get_text(strip=True)
                             ] = value.get_text(strip=True)

    except Exception as e:
        print(f"[ERROR] LinkedIn API failed for job_id={job_id}:\n    {e}")

    # --------- PART 2: Real Apply Button via Selenium ----------
    apply_url = None
    try:
        job_view_url = f"https://www.linkedin.com/jobs/view/{job_id}"
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in background
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=chrome_options)
        driver.get(job_view_url)

        time.sleep(3)  # Wait for content to load

        # Try common apply button selectors
        try:
            apply_btn = driver.find_element(
                By.CSS_SELECTOR, 'a[data-tracking-control-name*="public_jobs_topcard"]')
            apply_url = apply_btn.get_attribute('href')
        except NoSuchElementException:
            apply_url = job_view_url  # fallback

        driver.quit()

    except Exception as e:
        print(f"[ERROR] Selenium failed for job_id={job_id}:\n    {e}")
        apply_url = f"https://www.linkedin.com/jobs/view/{job_id}"

    return {
        "description": description,
        "criteria": criteria,
        "applyUrl": apply_url
    }

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
    for job in jobs:
        job_url = job.get("jobUrl", "")
        job_id = extract_job_id(job_url)
        if not job_id:
            job["description"] = ""
            job["criteria"] = {}
            job["applyUrl"] = ""
            continue

        details = fetch_job_details(job_id)

        if details:
            job["description"] = details["description"]
            job["criteria"] = details["criteria"]
            job["applyUrl"] = details["applyUrl"]
        else:
            job["description"] = ""
            job["criteria"] = {}
            job["applyUrl"] = job.get("jobUrl", "")

        time.sleep(1.5)

    return jobs


def get_real_apply_link(job_id: str) -> str:
    try:
        job_view_url = f"https://www.linkedin.com/jobs/view/{job_id}"
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=chrome_options)
        driver.get(job_view_url)

        # Wait max 10 seconds for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        time.sleep(3)  # let JS finish loading

        apply_url = None

        # 1. Try known apply button class
        try:
            apply_btn = driver.find_element(
                By.CSS_SELECTOR, "a.topcard__apply-button")
            apply_url = apply_btn.get_attribute("href")
        except:
            pass

        # 2. Fallback: try any link that says “Apply”
        if not apply_url:
            try:
                all_links = driver.find_elements(By.TAG_NAME, "a")
                for link in all_links:
                    if "apply" in link.text.lower():
                        apply_url = link.get_attribute("href")
                        break
            except:
                pass

        driver.quit()

        return apply_url if apply_url else job_view_url

    except Exception as e:
        print(
            f"[Selenium ERROR] Failed to fetch apply link for job_id={job_id}\n{e}")
        return f"https://www.linkedin.com/jobs/view/{job_id}"
# ---------------------------- 5. Execution Block ---------------------------------------


if __name__ == "__main__":
    # Example usage
    keyword = "software engineer"
    location = "United States"
    total_jobs = 5

    job_list = fetch_job_urls(keyword, location, total_jobs)
    print("No of jobs fetched ", len(job_list))

    print(f"\n🧾 Fetched {len(job_list)} job listings.")
    print("📎 Job URLs:")
    for i, job in enumerate(job_list, 1):
        print(f"{i:2}. {job.get('jobUrl', 'N/A')}")
    print("=" * 80)

    enriched_jobs = enrich_jobs_with_details(job_list)

    for i, job in enumerate(enriched_jobs):
        print(f"{i+1}. {job.get('position', 'N/A')} at {job.get('company', 'N/A')}")
        print(f"    URL: {job.get('jobUrl', '')}")
        print(f"    APPLY LINK: {job.get('applyUrl', 'N/A')}")
        print(
            f"    Description Preview: {(job.get('description') or '')[:200]}...")
        print(f"    Criteria: {job.get('criteria', {})}")
        print("-" * 70)

    # Save to CSV
    df = pd.DataFrame(enriched_jobs)

    df.to_csv("linkedin_enriched_jobs.csv", index=False)
    print("📄 Saved to linkedin_enriched_jobs.csv")
