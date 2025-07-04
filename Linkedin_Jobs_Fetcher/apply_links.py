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


def get_apply_info(driver, job_url):
    print(f"\n🔗 Visiting: {job_url}")
    # Load base domain before adding cookies
    driver.get("https://www.linkedin.com")
    time.sleep(2)
    load_cookies(driver, "www.linkedin.com_cookies.json")
    driver.get(job_url)
    time.sleep(3)

    try:
        # Wait for job topcard
        apply_section = driver.find_element(
            By.CLASS_NAME, "jobs-apply-button--top-card")
        button = apply_section.find_element(By.TAG_NAME, "button")

        if button.text.strip().lower().startswith("apply"):
            href = button.get_attribute("href")
            if href:
                print(f"🔗 External Apply Link: {href}")
            else:
                print("✅ Easy Apply available (no external link)")
        else:
            print("❌ Found button but not Apply")

    except Exception as e:
        print("❌ Apply button section not found.")

# ------------------------- MAIN EXECUTION --------------------------------------


if __name__ == "__main__":
    print("\n================= APPLY LINK FETCHER =================\n")
    job_urls = [
        "https://www.linkedin.com/jobs/view/software-engineer-at-microsoft-4261014219",
        "https://www.linkedin.com/jobs/view/full-stack-software-engineer-at-atlassian-4261304015"
    ]

    driver = start_browser()
    for url in job_urls:
        get_apply_info(driver, url)

    print("\n✅ Done.")
