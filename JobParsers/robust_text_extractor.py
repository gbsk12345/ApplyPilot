
import requests
from bs4 import BeautifulSoup
from readability import Document
from newspaper import Article

def extract_with_newspaper(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text.strip()
    except Exception as e:
        return ""

def extract_with_readability(url):
    try:
        response = requests.get(url, timeout=10)
        doc = Document(response.text)
        summary_html = doc.summary()
        soup = BeautifulSoup(summary_html, 'html.parser')
        return soup.get_text(separator=' ', strip=True)
    except Exception as e:
        return ""

def extract_full_html(url):
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        content_tags = soup.find_all(['p', 'li', 'div'])
        full_text = ' '.join(tag.get_text(separator=' ', strip=True) for tag in content_tags)
        return full_text.strip()
    except Exception as e:
        return ""

def get_readable_job_text(url):
    text = extract_with_newspaper(url)
    if len(text) > 300:
        return text, "newspaper3k"

    text = extract_with_readability(url)
    if len(text) > 300:
        return text, "readability"

    text = extract_full_html(url)
    return text, "raw_html"
