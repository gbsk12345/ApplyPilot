import requests
import time


def fetch_all_jobs(keyword, location, total_jobs=100):
    all_jobs = []
    jobs_per_page = 25  # Max per API
    total_pages = (total_jobs + jobs_per_page -
                   1) // jobs_per_page  # ceiling division

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

        all_jobs.extend(jobs)

        # Optional: small delay to be polite
        time.sleep(1)

    print(f"✅ Fetched total {len(all_jobs)} jobs.")
    return all_jobs[:total_jobs]  # in case fewer than expected returned


# Usage
results = fetch_all_jobs("data scientist", "United States", total_jobs=100)

# Print sample
for i, job in enumerate(results):
    print(f"{i+1}. {job.get('title', 'N/A')} at {job.get('company', 'N/A')}")
    print(f"    {job.get('jobUrl', '')}")
    print("-" * 60)
