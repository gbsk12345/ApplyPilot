import json


def extract_and_count_links(json_file_path):
    """
    Reads a JSON file of job results, extracts external application links,
    prints counts, and saves the links to a text file.

    Args:
        json_file_path (str): The path to the input JSON file.
    """
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{json_file_path}' was not found.")
        print("Please ensure the script is in the same directory as the JSON file.")
        return
    except json.JSONDecodeError:
        print(
            f"Error: Could not decode JSON from the file '{json_file_path}'.")
        return

    external_links = []
    total_jobs = len(data)

    # Loop through each job entry in the JSON data
    for job_id, job_details in data.items():
        # Check if the status is 'External Link' and the apply link is not 'N/A'
        if job_details.get('status') == 'External Link' and job_details.get('apply_link') != 'N/A':
            external_links.append(job_details['apply_link'])

    # Print the counts
    print("--- Job Analysis ---")
    print(f"Total jobs found: {total_jobs}")
    print(f"External links found: {len(external_links)}")
    print("--------------------")

    # Save the extracted links to a file
    output_filename = 'external_links.txt'
    with open(output_filename, 'w') as f:
        for link in external_links:
            f.write(f"{link}\n")

    print(
        f"\nSuccessfully saved {len(external_links)} external links to '{output_filename}'")


if __name__ == '__main__':
    # The name of the JSON file provided by the user
    input_file = 'job_results_2.json'
    extract_and_count_links(input_file)
