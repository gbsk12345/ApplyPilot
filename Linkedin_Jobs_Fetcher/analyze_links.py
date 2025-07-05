import re
from urllib.parse import urlparse
import matplotlib.pyplot as plt


def analyze_links(file_path):
    """
    Analyzes a file of URLs to count the total number of links,
    identify job boards or company career pages, and generate a
    bar chart of the sources.

    Args:
        file_path (str): The path to the file containing the URLs.
    """
    try:
        with open(file_path, 'r') as f:
            links = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        return

    total_links = len(links)
    print(f"Total number of external links: {total_links}")

    job_board_counts = {}
    job_board_patterns = {
        'Greenhouse': r'boards\.greenhouse\.io|job-boards\.greenhouse\.io',
        'Lever': r'jobs\.lever\.co',
        'Workday': r'\.myworkdayjobs\.com',
        'Ashby': r'jobs\.ashbyhq\.com',
        'Rippling': r'ats\.rippling\.com',
        'ICIMS': r'careers-americas\.icims\.com',
        'Paylocity': r'recruiting\.paylocity\.com',
        'ADP': r'workforcenow\.adp\.com|myjobs\.adp\.com',
        'Jobvite': r'jobs\.jobvite\.com',
        'SmartRecruiters': r'jobs\.smartrecruiters\.com',
        'Oracle Cloud': r'oraclecloud\.com',
        'Comeet': r'www\.comeet\.com',
        'Recruitics': r'jsv3\.recruitics\.com',
        'Appcast': r'click\.appcast\.io',
        'Paycom': r'www\.paycomonline\.net',
        'BambooHR': r'.+\.bamboohr\.com'
    }

    for link in links:
        parsed_url = urlparse(link)
        netloc = parsed_url.netloc
        source_identified = False

        for board, pattern in job_board_patterns.items():
            if re.search(pattern, netloc):
                job_board_counts[board] = job_board_counts.get(board, 0) + 1
                source_identified = True
                break

        if not source_identified:
            # Extract the company name from the domain
            company_name = netloc.split('.')[-2].capitalize()
            if company_name in ['Co', 'Com']:
                company_name = netloc.split('.')[-3].capitalize()

            job_board_counts[company_name] = job_board_counts.get(
                company_name, 0) + 1

    # Sorting the job board counts for better visualization
    sorted_job_boards = sorted(
        job_board_counts.items(), key=lambda item: item[1], reverse=True)

    boards = [item[0] for item in sorted_job_boards]
    counts = [item[1] for item in sorted_job_boards]

    # Plotting the graph
    plt.figure(figsize=(12, 8))
    plt.barh(boards, counts, color='skyblue')
    plt.xlabel('Number of Job Postings')
    plt.ylabel('Job Board / Company')
    plt.title('Distribution of Job Postings by Source')
    plt.gca().invert_yaxis()  # To display the highest count on top
    plt.tight_layout()
    plt.savefig('job_board_distribution.png')
    print("\nGraph saved as 'job_board_distribution.png'")

    print("\nJob Board/Company Counts:")
    for board, count in sorted_job_boards:
        print(f"- {board}: {count}")


if __name__ == '__main__':
    analyze_links('external_links.txt')
