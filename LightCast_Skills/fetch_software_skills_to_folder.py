
import requests
import csv
import os

CLIENT_ID = 'ktcgg9h32grklshq'
CLIENT_SECRET = 'ErDXcXm6'
SCOPE = 'emsi_open'
AUTH_URL = 'https://auth.emsicloud.com/connect/token'
BASE_URL = 'https://emsiservices.com/skills/versions/latest/skills'
OUTPUT_FOLDER = 'lightcast_skills_output'

def get_access_token():
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'client_credentials',
        'scope': SCOPE
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(AUTH_URL, data=payload, headers=headers)
    return response.json().get("access_token") if response.status_code == 200 else None

def fetch_software_skills(token):
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    params = {
        'fields': 'id,name,type,infoUrl,isSoftware',
        'typeIds': 'ST1'
    }
    software_skills = []
    next_url = BASE_URL
    while next_url:
        response = requests.get(next_url, headers=headers,
                                params=params if next_url == BASE_URL else None)
        if response.status_code != 200:
            break
        data = response.json()
        batch = data.get("data", [])
        filtered = [s for s in batch if s.get("isSoftware")]
        software_skills.extend(filtered)
        next_url = data.get("metadata", {}).get("next")
    return software_skills

def save_to_csv(skills, filename):
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    path = os.path.join(OUTPUT_FOLDER, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Skill ID", "Skill Name", "Skill Type", "Info URL", "Is Software"])
        for skill in skills:
            writer.writerow([
                skill.get("id"),
                skill.get("name"),
                skill.get("type", {}).get("name"),
                skill.get("infoUrl"),
                skill.get("isSoftware")
            ])
    print(f"✅ Saved {len(skills)} software-related skills to {path}")

if __name__ == "__main__":
    token = get_access_token()
    if token:
        software_skills = fetch_software_skills(token)
        save_to_csv(software_skills, "software_skills.csv")
    else:
        print("❌ Authentication failed.")
