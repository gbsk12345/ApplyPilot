
from resume_skill_extractor_corrected import ResumeSkillExtractor

extractor = ResumeSkillExtractor("software_skills_lowercase.txt")
text, skills = extractor.extract_text_and_skills("JobResume2.pdf")

print("\n--- Extracted Resume Text ---\n")
print(text[:1000])  # Print first 1000 chars only

print("\n--- Matched Skills ---\n")
print(skills)
