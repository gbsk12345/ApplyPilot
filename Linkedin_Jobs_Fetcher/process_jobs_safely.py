# ✅ process_jobs.py (with hang protection)
import json
import time
import re
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException, InvalidSessionIdException

# -------------------- LOAD COOKIES (with fix for sameSite) ---------------------


def load_cookies(driver, cookie_file):
    """Loads cookies from a file into the browser session."""
    try:
        with open(cookie_file, "r") as f:
            file_content = f.read()
            if not file_content:
                print(
                    f"❌ Error: The cookie file '{cookie_file}' is empty. Please re-export your cookies.")
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
            f"❌ Error: Cookie file not found at '{cookie_file}'. Please ensure it's in the correct directory.")
        return False
    except json.JSONDecodeError:
        print(
            f"❌ Error: Could not decode JSON from '{cookie_file}'. The file is likely corrupted. Please re-export it.")
        return False


# ------------------------ START SELENIUM BROWSER -------------------------------
def start_browser():
    """Starts and returns a Selenium Chrome browser instance."""
    chrome_options = Options()
    chrome_options.page_load_strategy = "eager"
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
    Returns a tuple: (status, data)
    """
    clean_job_url = job_url.split('?')[0]
    print(f"\n🔗 Processing: {clean_job_url}")

    try:
        driver.get(clean_job_url)
        time.sleep(random.uniform(5, 8))
    except TimeoutException:
        print("⚠️ Page took too long to load, but continuing anyway.")
        pass

    try:
        apply_button = driver.find_element(
            By.CSS_SELECTOR, ".jobs-apply-button--top-card .jobs-apply-button")

        if "easy apply" in apply_button.text.strip().lower():
            print("✅ Found: Easy Apply")
            return "Easy Apply", "Easy Apply"

        original_window = driver.current_window_handle
        apply_button.click()
        time.sleep(random.uniform(4, 6))  # Wait for tab to open

        new_window = None
        for handle in driver.window_handles:
            if handle != original_window:
                new_window = handle
                break

        external_link = "Error: Could not get URL from new tab"
        if new_window:
            try:
                driver.switch_to.window(new_window)
                # --- NEW FIX: Stop the page load to prevent hangs ---
                driver.execute_script("window.stop();")

                time.sleep(1)  # Give command time to execute
                external_link = driver.current_url
                print(f"🔗 Found: External Link")
            except Exception as e:
                print(f"❌ Error while processing new tab: {e}")
            finally:
                # Ensure we always close the new tab and switch back
                if driver.current_window_handle == new_window:
                    driver.close()
                driver.switch_to.window(original_window)
        else:
            print("❌ Error: New tab did not open.")
            external_link = "Error: New tab did not open"

        return "External Link", external_link

    except (NoSuchElementException, TimeoutException):
        print("❌ Error: Apply button not found. The job may have expired or is no longer accepting applications.")
        return "Error", "Apply button not found"
    except Exception as e:
        print(f"❌ An unexpected error occurred in get_apply_info: {e}")
        return "Error", str(e)


# ------------------------- MAIN EXECUTION (with self-healing) --------------------------------------
if __name__ == "__main__":
    INPUT_FILE = "sample_linkedin_urls.txt"
    OUTPUT_FILE = "job_results.json"
    COOKIE_FILE = "linkedin_incognito_cookies.json"

    print("\n================= LINKEDIN JOB PROCESSOR =================\n")

    try:
        with open(INPUT_FILE, 'r') as f:
            job_urls = [line.strip() for line in f if line.strip()]
        print(f"✅ Found {len(job_urls)} URLs in '{INPUT_FILE}'.")
    except FileNotFoundError:
        print(
            f"❌ Error: Input file '{INPUT_FILE}' not found. Please create it and add job URLs.")
        exit()

    try:
        with open(OUTPUT_FILE, 'r') as f:
            results = json.load(f)
        print(
            f"✅ Loaded {len(results)} existing results from '{OUTPUT_FILE}'.")
    except (FileNotFoundError, json.JSONDecodeError):
        results = {}

    driver = start_browser()
    print("Attempting to load cookies to establish initial session...")
    if not load_cookies(driver, COOKIE_FILE):
        driver.quit()
        exit()
    print("✅ Initial session cookies loaded successfully.")

    urls_to_process = list(job_urls)

    while urls_to_process:
        url = urls_to_process[0]

        try:
            job_id = get_job_id_from_url(url)
            if not job_id:
                print(f"⚠️ Skipping invalid URL (no job ID found): {url}")
                urls_to_process.pop(0)
                continue

            if job_id in results:
                urls_to_process.pop(0)
                continue

            total_jobs = len(job_urls)
            processed_count = total_jobs - len(urls_to_process)
            print(
                f"\n--- Processing URL {processed_count + 1}/{total_jobs} (Job ID: {job_id}) ---")

            status, data = get_apply_info(driver, url)

            results[job_id] = {
                "url": url,
                "status": status,
                "apply_link": data if status == "External Link" else "N/A",
                "timestamp": time.ctime()
            }

            with open(OUTPUT_FILE, 'w') as f:
                json.dump(results, f, indent=4)
            print(f"💾 Progress saved to '{OUTPUT_FILE}'.")

            urls_to_process.pop(0)
            # sleep_time = random.uniform(7, 15)
            # print(f"😴 Sleeping for {sleep_time:.2f} seconds to be safe...")
            # time.sleep(sleep_time)

        except InvalidSessionIdException:
            print(
                "\n🚨 Browser session became invalid. The browser might have crashed or been closed.")
            print("🛠️ Restarting the browser and resuming with the same URL...")
            if driver:
                try:
                    driver.quit()
                except Exception:
                    pass

            driver = start_browser()
            if not load_cookies(driver, COOKIE_FILE):
                print("❌ Failed to load cookies on restart. Aborting.")
                break
            print("✅ Browser restarted successfully.")
            time.sleep(5)

        except Exception as e:
            print(
                f"💥 An unexpected critical error occurred for URL {url}: {e}")
            print("Skipping this URL and continuing.")
            urls_to_process.pop(0)
            continue

    if driver:
        driver.quit()
    print(
        f"\n\n✅ Done. All URLs processed. Final results are in '{OUTPUT_FILE}'.")
