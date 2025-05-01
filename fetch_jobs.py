import requests

url = "http://localhost:3000/jobs"
params = {
    "keyword": "data scientist",
    "location": "United States"
}

response = requests.get(url, params=params)

if response.status_code == 200:
    jobs = response.json()

    print("🔍 First Job Response:")
    print(jobs[0])  # See the actual structure
    print("="*60)

    for job in jobs:
        print(f"Title: {job.get('title', 'N/A')}")
        print(f"Company: {job.get('company', 'N/A')}")
        print(f"Location: {job.get('location', 'N/A')}")
        print(f"Link: {job.get('jobUrl', 'N/A')}")
        print("-" * 60)
else:
    print("❌ Error:", response.status_code, response.text)
