# ✅ apply_links.py
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# -------------------- LOAD COOKIES (with fix for sameSite) ---------------------


def load_cookies(driver, cookie_file):
    with open(cookie_file, "r") as f:
        cookies = json.load(f)
    for cookie in cookies:
        if 'expiry' in cookie:
            cookie['expiry'] = int(cookie['expiry'])
        if 'sameSite' in cookie:
            if cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                cookie.pop('sameSite')  # Fix the cause of AssertionError
        driver.add_cookie(cookie)

# ------------------------ START SELENIUM BROWSER -------------------------------


def start_browser():
    chrome_options = Options()
    chrome_options.add_experimental_option(
        "detach", True)  # Leave browser open
    chrome_options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=chrome_options)
    return driver

# --------------------- EXTRACT APPLY LINK OR EASY APPLY ------------------------

# --------------------- EXTRACT APPLY LINK OR EASY APPLY ------------------------


# --------------------- EXTRACT APPLY LINK OR EASY APPLY ------------------------

def get_apply_info(driver, job_url):
    print(f"\n🔗 Visiting: {job_url}")
    # Load base domain before adding cookies
    driver.get("https://www.linkedin.com")
    time.sleep(2)
    load_cookies(driver, "www.linkedin.com_cookies.json")
    driver.get(job_url)
    # Increased sleep time to ensure all dynamic elements load
    time.sleep(5)

    try:
        # Find the main apply button at the top of the page
        apply_button = driver.find_element(
            By.CSS_SELECTOR, ".jobs-apply-button--top-card .jobs-apply-button")

        # If the button's text contains "Easy Apply", it's not an external link.
        if "easy apply" in apply_button.text.strip().lower():
            print("✅ Easy Apply available.")
            return

        # --- This is the new logic for handling external links in a new tab ---

        # 1. Get the current window's handle before clicking
        original_window = driver.current_window_handle

        # 2. Click the button, which should open a new tab
        apply_button.click()
        time.sleep(3)  # Wait for the new tab to fully open

        # 3. Loop through all open windows and find the new one
        for handle in driver.window_handles:
            if handle != original_window:
                driver.switch_to.window(handle)
                break

        # 4. Get the URL from the new tab
        print(f"🔗 External Apply Link: {driver.current_url}")

        # 5. Close the new tab and switch back to the original LinkedIn tab
        driver.close()
        driver.switch_to.window(original_window)

    except Exception as e:
        print("❌ Apply button or section not found on the page.")
        # Uncomment the line below for detailed error messages during debugging
        # print(e)
# ------------------------- MAIN EXECUTION --------------------------------------


if __name__ == "__main__":
    print("\n================= APPLY LINK FETCHER =================\n")
    job_urls = [
        "https://www.linkedin.com/jobs/view/software-engineer-at-microsoft-4261014219",
        "https://www.linkedin.com/jobs/view/full-stack-software-engineer-at-atlassian-4261304015",
        "https://www.linkedin.com/jobs/collections/recommended/?currentJobId = 4256531468",
    ]

    driver = start_browser()
    for url in job_urls:
        get_apply_info(driver, url)

    print("\n✅ Done.")
