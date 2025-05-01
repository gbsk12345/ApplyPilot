import requests
import json


def fetch_google_jobs(query, location, num_jobs=10):
    # Replace with your real key
    API_KEY = "50f6f528c3f91eb058c5de28a7cdc9bab4d7bc98cfe4e455299e87f641e77327"

    url = "https://serpapi.com/search.json"

    params = {
        "engine": "google_jobs",
        "q": query,
        "location": location,
        "api_key": API_KEY
    }

    try:
        print("🔄 Sending request to SerpAPI Google Jobs engine...")
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "jobs_results" not in data:
            print("⚠️ No job results returned. Full response:")
            print(json.dumps(data, indent=2))
            return

        jobs = data["jobs_results"]
        print(f"✅ Retrieved {len(jobs)} jobs.")

        for job in jobs:
            print(
                f"🔹 {job.get('title')} at {job.get('company_name')} ({job.get('location')})")
            print(f"🔗 {job.get('via')} | {job.get('job_id')}")
            print("---")

        with open("google_jobs.json", "w") as f:
            json.dump(jobs, f, indent=4)
            print("📁 Saved to google_jobs.json")

        return jobs

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")


# Example usage
fetch_google_jobs("software engineer", "San Francisco")
