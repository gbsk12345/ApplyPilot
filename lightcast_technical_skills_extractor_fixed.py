import requests
import csv

# Replace these with your actual Lightcast API credentials
CLIENT_ID = 'ktcgg9h32grklshq'
CLIENT_SECRET = 'ErDXcXm6'
SCOPE = 'emsi_open'

# Authentication URL and API endpoint
AUTH_URL = 'https://auth.emsicloud.com/connect/token'
API_URL = 'https://emsiservices.com/skills/versions/latest/skills'

# Function to get access token


def get_access_token():
    print("Authenticating with Lightcast...")
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
        return response.json().get('access_token')
    else:
        print(f"Failed to get access token: {response.text}")
        return None

# Function to fetch skills with pagination


def fetch_skills(access_token, limit=1000):
    print("Fetching skills with access token...")
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    params = {
        'limit': limit,
        'fields': 'id,name,type',
        'typeIds': 'ST1'  # ST1 is for Specialized Skill (i.e., technical)
    }
    all_skills = []
    next_url = API_URL

    while next_url:
        response = requests.get(next_url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            skills = data.get('data', [])
            all_skills.extend(skills)
            next_url = data.get('metadata', {}).get('next')
            # After the first request, params are included in the 'next' URL
            params = None
        else:
            print(
                f"Error fetching skills: {response.status_code} - {response.text}")
            break

    return all_skills

# Function to save skills to CSV


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


# Main execution
if __name__ == '__main__':
    token = get_access_token()
    if token:
        skills = fetch_skills(token)
        if skills:
            save_skills_to_csv(skills)
            print(
                f"Saved {len(skills)} technical skills to 'lightcast_technical_skills.csv'")
        else:
            print("No skills found.")
    else:
        print("Authentication failed.")
