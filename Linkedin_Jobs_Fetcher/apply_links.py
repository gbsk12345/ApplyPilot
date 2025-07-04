import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


# ------------------------ Load LinkedIn Cookies ------------------------

def load_cookies(driver, cookie_file):
    with open(cookie_file, "r") as f:
        cookies = json.load(f)
    for cookie in cookies:
        # Convert float expiry to int
        if 'expiry' in cookie:
            cookie['expiry'] = int(cookie['expiry'])

        # Fix invalid 'sameSite' values
        if 'sameSite' in cookie:
            if cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                cookie.pop('sameSite')

        driver.add_cookie(cookie)

# ---------------------- Get Apply Button Link --------------------------


def get_apply_link(driver, job_url):
    print(f"\n🔗 Visiting: {job_url}")
    driver.get(job_url)
    time.sleep(2)  # wait for redirect

    try:
        # Wait for the page to load the apply section
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, 'div.jobs-apply-button'))
        )
    except:
        print("❌ Apply button section not found.")
        return None

    # Check for external apply
    try:
        external_apply = driver.find_element(
            By.CSS_SELECTOR, "a[data-tracking-control-name='public_jobs_apply-link-offsite']")
        if external_apply:
            link = external_apply.get_attribute("href")
            print(f"🔗 External Apply Link: {link}")
            return link
    except:
        pass

    # Check for easy apply
    try:
        easy_apply_btn = driver.find_element(
            By.CSS_SELECTOR, "button[data-control-name='jobdetails_topcard_inapply']")
        if easy_apply_btn:
            print("✅ Easy Apply available")
            return "EASY_APPLY"
    except:
        pass

    print("❌ No apply button found")
    return None

# --------------------------- Main Driver -------------------------------


if __name__ == "__main__":
    job_urls = [
        "https://www.linkedin.com/jobs/view/software-engineer-at-microsoft-4261014219",
        "https://www.linkedin.com/jobs/view/full-stack-software-engineer-at-atlassian-4261304015"
    ]

    print("\n================= APPLY LINK FETCHER =================\n")

    options = Options()
    options.add_argument("--headless=new")  # remove if debugging visually
    options.add_argument("--window-size=1920,1080")
    driver = webdriver.Chrome(service=Service(
        ChromeDriverManager().install()), options=options)

    driver.get("https://www.linkedin.com")  # required before adding cookies
    load_cookies(driver, "www.linkedin.com_cookies.json")
    time.sleep(2)
    driver.refresh()

    for url in job_urls:
        get_apply_link(driver, url)

    driver.quit()
