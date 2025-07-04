# ✅ process_jobs.py
import json
import time
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# -------------------- LOAD COOKIES (with fix for sameSite) ---------------------


def load_cookies(driver, cookie_file):
    """Loads cookies from a file into the browser session."""
    try:
        with open(cookie_file, "r") as f:
            cookies = json.load(f)
        for cookie in cookies:
            if 'expiry' in cookie:
                cookie['expiry'] = int(cookie['expiry'])
            if 'sameSite' in cookie and cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                cookie.pop('sameSite')
            driver.add_cookie(cookie)
        return True
    except FileNotFoundError:
        print(
            f"❌ Error: Cookie file not found at '{cookie_file}'. Please ensure it's in the correct directory.")
        return False

# ------------------------ START SELENIUM BROWSER -------------------------------


def start_browser():
    """Starts and returns a Selenium Chrome browser instance."""
    chrome_options = Options()
    # Comment out the next line to run in the background (headless mode)
    # chrome_options.add_argument("--headless")
    chrome_options.add_experimental_option("detach", True)
    chrome_options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# --------------------- EXTRACT JOB ID FROM URL ------------------------


def get_job_id_from_url(url):
    """Extracts the numeric job ID from a LinkedIn job URL using regex."""
    match = re.search(r"/jobs/view/(\d+)", url)
    if match:
        return match.group(1)
    return None

# --------------------- EXTRACT APPLY LINK OR EASY APPLY ------------------------


def get_apply_info(driver, job_url):
    """
    Visits a job URL and returns the external apply link or 'Easy Apply' status.
    Returns a tuple: (status, data)
    """
    print(f"\n🔗 Processing: {job_url}")
    driver.get(job_url)
    time.sleep(5)  # Allow time for the page and dynamic buttons to load

    try:
        apply_button = driver.find_element(
            By.CSS_SELECTOR, ".jobs-apply-button--top-card .jobs-apply-button")

        if "easy apply" in apply_button.text.strip().lower():
            print("✅ Found: Easy Apply")
            return "Easy Apply", "Easy Apply"

        original_window = driver.current_window_handle
        apply_button.click()
        time.sleep(3)

        # Find the new tab and switch to it
        for handle in driver.window_handles:
            if handle != original_window:
                driver.switch_to.window(handle)
                break

        external_link = driver.current_url
        print(f"🔗 Found: External Link")

        # Close the new tab and switch back
        driver.close()
        driver.switch_to.window(original_window)

        return "External Link", external_link

    except (NoSuchElementException, TimeoutException):
        print("❌ Error: Apply button not found. The job may have expired or is no longer accepting applications.")
        return "Error", "Apply button not found"
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return "Error", str(e)


# ------------------------- MAIN EXECUTION --------------------------------------
if __name__ == "__main__":
    INPUT_FILE = "job_urls.txt"
    OUTPUT_FILE = "job_results.json"
    COOKIE_FILE = "www.linkedin.com_cookies.json"

    print("\n================= LINKEDIN JOB PROCESSOR =================\n")

    # --- Read URLs from input file ---
    try:
        with open(INPUT_FILE, 'r') as f:
            job_urls = [line.strip() for line in f if line.strip()]
        print(f"✅ Found {len(job_urls)} URLs in '{INPUT_FILE}'.")
    except FileNotFoundError:
        print(
            f"❌ Error: Input file '{INPUT_FILE}' not found. Please create it and add job URLs.")
        exit()

    # --- Load existing results to avoid reprocessing ---
    try:
        with open(OUTPUT_FILE, 'r') as f:
            results = json.load(f)
        print(
            f"✅ Loaded {len(results)} existing results from '{OUTPUT_FILE}'.")
    except (FileNotFoundError, json.JSONDecodeError):
        results = {}

    # --- Start browser and process URLs ---
    driver = start_browser()
    driver.get("https://www.linkedin.com")
    time.sleep(2)

    if not load_cookies(driver, COOKIE_FILE):
        driver.quit()
        exit()

    for i, url in enumerate(job_urls):
        job_id = get_job_id_from_url(url)
        if not job_id:
            print(f"⚠️ Skipping invalid URL (no job ID found): {url}")
            continue

        # --- Skip if already processed ---
        if job_id in results:
            print(f"⏭️ Skipping Job ID {job_id} (already processed).")
            continue

        print(
            f"\n--- Processing URL {i+1}/{len(job_urls)} (Job ID: {job_id}) ---")
        status, data = get_apply_info(driver, url)

        results[job_id] = {
            "url": url,
            "status": status,
            "apply_link": data if status == "External Link" else "N/A"
        }

        # --- Save progress after each URL ---
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(results, f, indent=4)
        print(f"💾 Progress saved to '{OUTPUT_FILE}'.")

    driver.quit()
    print(
        f"\n\n✅ Done. All URLs processed. Final results are in '{OUTPUT_FILE}'.")
