import requests
import csv

# Step 1: Get Access Token
CLIENT_ID = 'ktcgg9h32grklshq'
CLIENT_SECRET = 'ErDXcXm6'
SCOPE = 'emsi_open'


def get_access_token():
    url = "https://auth.emsicloud.com/connect/token"
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'client_credentials',
        'scope': SCOPE
    }

    response = requests.post(url, data=data)
    if response.status_code != 200:
        print("Failed to get access token:", response.text)
        return None

    return response.json().get("access_token")

# Step 2: Use Token to Fetch Skills


def fetch_skills(token, limit_per_page=1000, max_pages=10):
    BASE_URL = 'https://emsiservices.com/skills/versions/latest/skills'
    all_skills = []

    for i in range(max_pages):
        params = {
            'limit': limit_per_page,
            'fields': 'id,name,type',
            'typeIds': 'ST1',  # ST1 = Specialized (technical) skills
            'from': i * limit_per_page
        }
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        response = requests.get(BASE_URL, headers=headers, params=params)

        if response.status_code != 200:
            print(
                f"Error fetching page {i+1}: {response.status_code} - {response.text}")
            break

        data = response.json()
        if not data.get("data"):
            break

        all_skills.extend(data["data"])

    return all_skills

# Step 3: Save to CSV


def save_skills_to_csv(skills, filename='lightcast_technical_skills.csv'):
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['Skill ID', 'Skill Name', 'Skill Type'])
        for skill in skills:
            writer.writerow([
                skill.get('id'),
                skill.get('name'),
                skill.get('type', {}).get('name')
            ])


# Step 4: Main
if __name__ == '__main__':
    print("Authenticating with Lightcast...")
    token = get_access_token()

    if token:
        print("Fetching skills with access token...")
        skills = fetch_skills(token)
        if skills:
            save_skills_to_csv(skills)
            print(
                f"✅ Saved {len(skills)} technical skills to 'lightcast_technical_skills.csv'")
        else:
            print("⚠️ No skills found.")
    else:
        print("❌ Could not get access token.")
