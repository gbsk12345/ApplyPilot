import requests
import time
import json
import os  # For creating directories and handling file paths
import re  # For sanitizing filenames

# --- Configuration Constants (same as before) ---
CLIENT_ID = 'ktcgg9h32grklshq'
CLIENT_SECRET = 'ErDXcXm6'
TOKEN_URL = "https://auth.emsicloud.com/connect/token"
API_SCOPE = "emsi_open"  # or "lightcast_open_free"
SKILLS_API_ENDPOINT = "https://emsiservices.com/skills/versions/latest/skills"
# Directory to store the output files
OUTPUT_DIR = "lightcast_skills_by_type"

# --- Helper Function to Get Access Token (same as before) ---


def get_access_token():
    """
    Retrieves an OAuth 2.0 access token from the Lightcast authentication server.
    Returns: str: The access token if successful, None otherwise.
    """
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
        "scope": API_SCOPE
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    try:
        response = requests.post(TOKEN_URL, data=payload, headers=headers)
        response.raise_for_status()
        token_data = response.json()
        print("Access token obtained successfully.")
        return token_data.get("access_token")
    except requests.exceptions.HTTPError as http_err:
        print(
            f"HTTP error occurred while getting token: {http_err}\nResponse: {response.content}")
    except requests.exceptions.RequestException as req_err:
        print(f"Request error occurred while getting token: {req_err}")
    except Exception as e:
        print(f"An unexpected error occurred while getting token: {e}")
    return None

# --- Main Function to Get All Skills (same as before, with slight refinement in print) ---


def get_all_lightcast_skills(access_token):
    """
    Fetches all skills from the Lightcast API using pagination.
    Args: access_token (str): The OAuth 2.0 access token.
    Returns: list: A list of dictionaries, each representing a skill.
    """
    all_skills_data = []
    offset = 0
    limit = 500
    fields_to_request = "id,name,type,category,subcategory,description,wikipediaUrl"
    has_more_skills = True

    print(f"Starting to fetch skills with fields: {fields_to_request}")

    while has_more_skills:
        params = {"limit": limit, "offset": offset,
                  "fields": fields_to_request}
        headers = {"Authorization": f"Bearer {access_token}"}
        print(f"Fetching skills: offset={offset}, limit={limit}")

        try:
            response = requests.get(
                SKILLS_API_ENDPOINT, headers=headers, params=params)
            response.raise_for_status()
            response_json = response.json()
            retrieved_batch = response_json.get('data', [])

            if not retrieved_batch:
                print("No more skills found in this batch or 'data' key missing/empty.")
                has_more_skills = False
                continue

            print(f"Retrieved {len(retrieved_batch)} skills in this batch.")

            for skill_entry in retrieved_batch:
                skill_type_info = skill_entry.get('type', {})
                skill_category_info = skill_entry.get('category', {})
                skill_subcategory_info = skill_entry.get('subcategory', {})

                processed_skill = {
                    "id": skill_entry.get('id'),
                    "name": skill_entry.get('name'),
                    "type_id": skill_type_info.get('id') if isinstance(skill_type_info, dict) else None,
                    "type_name": skill_type_info.get('name') if isinstance(skill_type_info, dict) else skill_type_info,
                    "category_name": skill_category_info.get('name') if isinstance(skill_category_info, dict) else skill_category_info,
                    "subcategory_name": skill_subcategory_info.get('name') if isinstance(skill_subcategory_info, dict) else skill_subcategory_info,
                    "description": skill_entry.get('description'),
                    "wikipediaUrl": skill_entry.get('wikipediaUrl')
                }
                all_skills_data.append(processed_skill)

            if len(retrieved_batch) < limit:
                print("Retrieved fewer skills than limit, assuming end of data.")
                has_more_skills = False
            else:
                offset += limit
        except requests.exceptions.HTTPError as e:
            print(
                f"HTTP error during skills fetch: {e}\nResponse: {response.content}")
            has_more_skills = False
        except requests.exceptions.RequestException as e:
            print(f"Request error during skills fetch: {e}")
            has_more_skills = False
        except Exception as e:
            print(f"An unexpected error during skills fetch: {e}")
            has_more_skills = False
        time.sleep(0.25)  # Respect rate limits

    print(
        f"Finished fetching skills. Total skills retrieved: {len(all_skills_data)}")
    return all_skills_data

# --- Function to Sanitize Filenames ---


def sanitize_filename(name):
    """
    Sanitizes a string to be used as a filename.
    Replaces spaces with underscores and removes characters not allowed in filenames.
    """
    if not name:
        name = "Unknown_Type"
    name = str(name).strip().replace(" ", "_")
    # Remove non-alphanumeric (excluding _, -, .)
    name = re.sub(r'(?u)[^-\w.]', '', name)
    return name if name else "Invalid_Filename"


# --- Function to Store Skills by Type ---
def store_skills_by_type(skills_list, output_directory):
    """
    Groups skills by their type_name and stores them in separate .txt files.

    Args:
        skills_list (list): A list of skill dictionaries.
        output_directory (str): The directory to save the .txt files.
    """
    if not skills_list:
        print("No skills to store.")
        return

    # Create the output directory if it doesn't exist
    if not os.path.exists(output_directory):
        try:
            os.makedirs(output_directory)
            print(f"Created output directory: {output_directory}")
        except OSError as e:
            print(f"Error creating directory {output_directory}: {e}")
            return

    skills_grouped_by_type = {}
    for skill in skills_list:
        # Default if type_name is None or missing
        type_name = skill.get("type_name", "Unknown_Type")
        if type_name is None:  # Explicitly handle None type_name
            type_name = "Unknown_Type"

        if type_name not in skills_grouped_by_type:
            skills_grouped_by_type[type_name] = []
        skills_grouped_by_type[type_name].append(skill)

    print(f"\nFound {len(skills_grouped_by_type)} unique skill types.")
    for type_name, skills_in_type in skills_grouped_by_type.items():
        sanitized_type_name = sanitize_filename(type_name)
        file_path = os.path.join(
            output_directory, f"{sanitized_type_name}.txt")

        print(
            f"Writing {len(skills_in_type)} skills of type '{type_name}' to {file_path}...")
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"Skills of Type: {type_name}\n")
                f.write(f"Total Skills: {len(skills_in_type)}\n")
                f.write("--------------------------------------------------\n\n")
                for skill in skills_in_type:
                    f.write(f"ID: {skill.get('id', 'N/A')}\n")
                    f.write(f"Name: {skill.get('name', 'N/A')}\n")
                    # You can add more details here if needed, e.g., description
                    # f.write(f"Description: {skill.get('description', 'N/A')}\n")
                    # For reference
                    f.write(f"Type ID: {skill.get('type_id', 'N/A')}\n")
                    f.write("\n---\n")
            print(f"Successfully wrote skills to {file_path}")
        except IOError as e:
            print(f"Error writing to file {file_path}: {e}")


# --- Example Usage (modified) ---
if __name__ == "__main__":
    print("Attempting to get Lightcast API access token...")
    if CLIENT_ID == "YOUR_CLIENT_ID" or CLIENT_SECRET == "YOUR_CLIENT_SECRET":
        print(
            "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print(
            "!!! ERROR: Please set your CLIENT_ID and CLIENT_SECRET in the script.      !!!")
        print(
            "!!! You need to obtain these from Lightcast by registering for API access. !!!")
        print(
            "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    else:
        access_token = get_access_token()

        if access_token:
            print("\nAttempting to fetch all skills from Lightcast...")
            all_skills = get_all_lightcast_skills(access_token)

            if all_skills:
                print(
                    f"\nSuccessfully retrieved {len(all_skills)} skills in total.")

                # Now store these skills by type
                store_skills_by_type(all_skills, OUTPUT_DIR)

                # Optional: Print a summary of types found
                unique_types = set()
                for skill in all_skills:
                    type_name = skill.get("type_name", "Unknown_Type")
                    if type_name is None:
                        type_name = "Unknown_Type"
                    unique_types.add(type_name)
                print("\nSummary of Skill Types Found in Data:")
                for t_name in sorted(list(unique_types)):
                    print(f"- {t_name}")

            else:
                print("\nNo skills were retrieved or an error occurred during fetching.")
        else:
            print("\nCould not retrieve access token. Cannot fetch skills.")
