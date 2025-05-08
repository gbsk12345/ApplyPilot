import requests
import csv

# Replace 'YOUR_API_KEY' with your actual API key
API_KEY = 'ktcgg9h32grklshq'
API_URL = 'https://api.lightcast.io/v1/skills'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Accept': 'application/json'
}


def fetch_skills():
    skills = []
    page = 1
    while True:
        params = {'page': page}
        response = requests.get(API_URL, headers=headers, params=params)
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            break
        data = response.json()
        if not data.get('skills'):
            break
        skills.extend(data['skills'])
        page += 1
    return skills


def save_skills_to_csv(skills, filename='lightcast_skills.csv'):
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['Skill ID', 'Skill Name', 'Skill Type'])
        for skill in skills:
            writer.writerow(
                [skill.get('id'), skill.get('name'), skill.get('type')])


if __name__ == '__main__':
    skills = fetch_skills()
    if skills:
        save_skills_to_csv(skills)
        print(f"Saved {len(skills)} skills to 'lightcast_skills.csv'")
    else:
        print("No skills found.")
