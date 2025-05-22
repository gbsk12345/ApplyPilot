
import requests
import csv
import os

CLIENT_ID = 'ktcgg9h32grklshq'
CLIENT_SECRET = 'ErDXcXm6'
SCOPE = 'emsi_open'
AUTH_URL = 'https://auth.emsicloud.com/connect/token'
BASE_URL = 'https://emsiservices.com/skills/versions/latest/skills'
OUTPUT_FOLDER = 'lightcast_skills_output'

SKILL_TYPES = {
    'ST1': 'Specialized Skill',
    'ST2': 'Common Skill',
    'ST3': 'Certification'
}

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

def fetch_skills_by_type(token, skill_type):
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    params = {
        'fields': 'id,name,type,infoUrl',
        'typeIds': skill_type
    }
    skills = []
    next_url = BASE_URL
    while next_url:
        response = requests.get(next_url, headers=headers,
                                params=params if next_url == BASE_URL else None)
        if response.status_code != 200:
            break
        data = response.json()
        skills.extend(data.get("data", []))
        next_url = data.get("metadata", {}).get("next")
    return skills

def save_to_csv(skills, filename):
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    path = os.path.join(OUTPUT_FOLDER, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Skill ID", "Skill Name", "Skill Type", "Info URL"])
        for skill in skills:
            writer.writerow([
                skill.get("id"),
                skill.get("name"),
                skill.get("type", {}).get("name"),
                skill.get("infoUrl")
            ])
    print(f"✅ Saved {len(skills)} skills to {path}")

if __name__ == "__main__":
    token = get_access_token()
    if token:
        for type_id, type_name in SKILL_TYPES.items():
            skills = fetch_skills_by_type(token, type_id)
            filename = f"{type_name.lower().replace(' ', '_')}_skills.csv"
            save_to_csv(skills, filename)
    else:
        print("❌ Authentication failed.")
