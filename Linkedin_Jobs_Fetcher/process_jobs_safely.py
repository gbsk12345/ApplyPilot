# ✅ process_jobs.py (with start/end range and job numbers)
import json
import time
import re
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException, InvalidSessionIdException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# -------------------- LOAD COOKIES (with fix for sameSite) ---------------------


def load_cookies(driver, cookie_file):
    """Loads cookies from a file into the browser session."""
    try:
        with open(cookie_file, "r") as f:
            file_content = f.read()
            if not file_content:
                print(
                    f"❌ ERROR: The cookie file '{cookie_file}' is empty. Please re-export your cookies.")
                return False
            cookies = json.loads(file_content)
        driver.get("https://www.linkedin.com")
        time.sleep(1)
        for cookie in cookies:
            if 'expiry' in cookie:
                cookie['expiry'] = int(cookie['expiry'])
            if 'sameSite' in cookie and cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                cookie.pop('sameSite')
            driver.add_cookie(cookie)
        return True
    except FileNotFoundError:
        print(
            f"❌ ERROR: Cookie file not found at '{cookie_file}'. Please ensure it's in the correct directory.")
        return False
    except json.JSONDecodeError:
        print(
            f"❌ ERROR: Could not decode JSON from '{cookie_file}'. The file is likely corrupted. Please re-export it.")
        return False


# ------------------------ START SELENIUM BROWSER -------------------------------
def start_browser():
    """Starts and returns a Selenium Chrome browser instance."""
    chrome_options = Options()
    chrome_options.page_load_strategy = "eager"
    # To see the browser in action, comment out the next line
    chrome_options.add_argument("--headless")
    chrome_options.add_experimental_option("detach", True)
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument(
        "--disable-blink-features=AutomationControlled")
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# --------------------- EXTRACT JOB ID FROM URL ------------------------


def get_job_id_from_url(url):
    """Extracts the numeric job ID from a LinkedIn job URL using regex."""
    match = re.search(r"/jobs/view/.*?(\d+)", url)
    if match:
        return match.group(1)
    return None

# --------------------- EXTRACT APPLY LINK OR EASY APPLY ------------------------


def get_apply_info(driver, job_url):
    """
    Visits a job URL and returns the external apply link or 'Easy Apply' status.
    """
    clean_job_url = job_url.split('?')[0]
    try:
        driver.get(clean_job_url)
        time.sleep(random.uniform(4, 7))
    except TimeoutException:
        print("      ⚠️  Page took too long to load, continuing...")
        pass

    try:
        apply_button = driver.find_element(
            By.CSS_SELECTOR, ".jobs-apply-button--top-card .jobs-apply-button")
        if "easy apply" in apply_button.text.strip().lower():
            return "Easy Apply", "Easy Apply"

        original_window = driver.current_window_handle
        apply_button.click()

        # --- FIXED: Use an explicit wait for the new tab to open ---
        try:
            WebDriverWait(driver, 15).until(EC.number_of_windows_to_be(2))
        except TimeoutException:
            return "Error", "New tab did not open within the time limit"

        new_window = next(
            (handle for handle in driver.window_handles if handle != original_window), None)
        if new_window:
            try:
                driver.switch_to.window(new_window)
                driver.execute_script("window.stop();")
                time.sleep(1)
                external_link = driver.current_url
            finally:
                if driver.current_window_handle == new_window:
                    driver.close()
                driver.switch_to.window(original_window)
            return "External Link", external_link
        else:
            # This case should be rare now with the explicit wait
            return "Error", "Could not identify the new tab"

    except (NoSuchElementException, TimeoutException):
        return "Error", "Apply button not found (job may have expired)"
    except Exception as e:
        return "Error", str(e)


# ------------------------- MAIN EXECUTION (with all features) --------------------------------------
if __name__ == "__main__":
    # --- ⚙️ 1. USER CONFIGURATION ---
    # Set the starting job number (e.g., if you want to resume from job 100, set this to 100)
    START_JOB = 1
    # Set the ending job number (e.g., to process jobs 100-150). Set to None to process all.
    END_JOB = None

    # --- Constants for Batch Processing ---
    JOBS_PER_BATCH = 10
    SHORT_SLEEP_MIN, SHORT_SLEEP_MAX = 2, 5
    LONG_SLEEP_MIN, LONG_SLEEP_MAX = 25, 40

    # --- File Configuration ---
    INPUT_FILE = "linkedin_job_urls.txt"
    OUTPUT_FILE = "job_results_2.json"
    COOKIE_FILE = "linkedin_incognito_cookies.json"

    print("\n================= LINKEDIN JOB PROCESSOR =================\n")

    # --- 2. SETUP ---
    try:
        with open(INPUT_FILE, 'r') as f:
            job_urls = [line.strip() for line in f if line.strip()]
        print(f"INFO: Found {len(job_urls)} total URLs in '{INPUT_FILE}'.")
    except FileNotFoundError:
        print(
            f"FATAL: Input file '{INPUT_FILE}' not found. Please create it and add job URLs.")
        exit()

    try:
        with open(OUTPUT_FILE, 'r') as f:
            results = json.load(f)
        print(
            f"INFO: Loaded {len(results)} existing results from '{OUTPUT_FILE}'.")
    except (FileNotFoundError, json.JSONDecodeError):
        results = {}

    end_job_display = END_JOB if END_JOB is not None else len(job_urls)
    print(f"INFO: Will process jobs from {START_JOB} to {end_job_display}.\n")

    driver = start_browser()
    print("INFO: Attempting to load cookies to establish initial session...")
    if not load_cookies(driver, COOKIE_FILE):
        driver.quit()
        exit()
    print("SUCCESS: Initial session cookies loaded successfully.\n")

    # --- 3. MAIN PROCESSING LOOP ---
    processed_in_session = 0
    processed_since_break = 0

    for job_number, url in enumerate(job_urls, 1):
        # --- Range and Skip Logic ---
        if job_number < START_JOB:
            continue
        if END_JOB is not None and job_number > END_JOB:
            print("INFO: Reached the specified END_JOB. Stopping.")
            break

        job_id = get_job_id_from_url(url)
        if not job_id:
            print(
                f"⚠️  Skipping Job {job_number}: Invalid URL (no job ID found).")
            continue
        if job_id in results:
            continue

        retries = 3
        while retries > 0:
            try:
                processed_in_session += 1
                processed_since_break += 1
                print(f"▶️  Processing Job {job_number} (ID: {job_id})...")

                status, data = get_apply_info(driver, url)

                if "Error" not in status:
                    print(
                        f"   ✅  [{status.upper()}] Succeeded for Job {job_id}.")
                else:
                    print(
                        f"   ❌  [{status.upper()}] Failed for Job {job_id}: {data}")

                results[job_id] = {
                    "job_number": job_number,  # <-- Added job number here
                    "url": url,
                    "status": status,
                    "apply_link": data if status == "External Link" else "N/A",
                    "timestamp": time.ctime()
                }

                with open(OUTPUT_FILE, 'w') as f:
                    json.dump(results, f, indent=4)

                # --- Smart Sleeping Logic ---
                if processed_since_break >= JOBS_PER_BATCH:
                    sleep_time = random.uniform(LONG_SLEEP_MIN, LONG_SLEEP_MAX)
                    print(
                        f"\n--- Batch of {JOBS_PER_BATCH} complete. Taking a long break for {sleep_time:.1f}s. ---\n")
                    time.sleep(sleep_time)
                    processed_since_break = 0
                else:
                    time.sleep(random.uniform(
                        SHORT_SLEEP_MIN, SHORT_SLEEP_MAX))

                break  # Success, exit retry loop

            except InvalidSessionIdException:
                retries -= 1
                print(
                    f"\n🚨 WARNING: Browser session crashed. Retries left: {retries}. Restarting session...")
                if driver:
                    try:
                        driver.quit()
                    except Exception:
                        pass

                driver = start_browser()
                if not load_cookies(driver, COOKIE_FILE):
                    print("FATAL: Failed to load cookies on restart. Aborting.")
                    exit()  # Exit the whole script if cookies can't be reloaded
                print("   ✅  Browser restarted successfully. Resuming...\n")
                processed_since_break = 0
                if retries == 0:
                    print(
                        f"   ❌  Failed to process Job {job_number} after multiple retries.")

            except Exception as e:
                print(
                    f"💥 FATAL: An unexpected critical error occurred for URL {url}: {e}")
                retries = 0  # Stop retrying for this job
                break

    # --- 4. FINAL SUMMARY ---
    if driver:
        driver.quit()
    print("\n\n===================== FINAL SUMMARY =====================\n")
    print(f"Total URLs in file: {len(job_urls)}")
    print(f"Total Jobs Processed in this run: {processed_in_session}")
    print(f"Total Jobs in results file: {len(results)}")
    print(f"\nAll tasks complete. Final results are in '{OUTPUT_FILE}'.")
