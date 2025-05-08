
import requests
import csv

CLIENT_ID = 'ktcgg9h32grklshq'
CLIENT_SECRET = 'ErDXcXm6'
SCOPE = 'emsi_open'
AUTH_URL = 'https://auth.emsicloud.com/connect/token'
BASE_URL = 'https://emsiservices.com/skills/versions/latest/skills'

# Step 1: Get access token


def get_access_token():
    payload = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'client_credentials',
        'scope': SCOPE
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = requests.post(AUTH_URL, data=payload, headers=headers)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print("Failed to get access token:", response.text)
        return None

# Step 2: Fetch skills of a given type


def fetch_skills_by_type(token, skill_type):
    print(f"Fetching skills for type: {skill_type}")
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
            print(f"Error: {response.status_code} - {response.text}")
            break
        data = response.json()
        skills.extend(data.get("data", []))
        next_url = data.get("metadata", {}).get("next")

    return skills

# Step 3: Save to CSV


def save_to_csv(skills, filename):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Skill ID", "Skill Name", "Skill Type", "Info URL"])
        for skill in skills:
            writer.writerow([
                skill.get("id"),
                skill.get("name"),
                skill.get("type", {}).get("name"),
                skill.get("infoUrl")
            ])


# Step 4: Main execution
if __name__ == "__main__":
    token = get_access_token()
    if token:
        for type_id, filename in {
            'ST1': 'specialized_skills.csv',
            'ST3': 'certifications.csv',
            'ST5': 'software_skills.csv'
        }.items():
            skills = fetch_skills_by_type(token, type_id)
            save_to_csv(skills, filename)
            print(f"✅ Saved {len(skills)} skills to {filename}")
    else:
        print("❌ Authentication failed.")
