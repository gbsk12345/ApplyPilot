
# ===========================
# Test_ResumeSkillParser.py
# ===========================

# This script tests the ResumeSkillParser class using a sample resume file and skill list.

from ResumeSkillParser import ResumeSkillParser

# Create an instance of the parser
parser = ResumeSkillParser()

# Provide paths to the skill file and the resume file
# NOTE: Make sure these paths are correct relative to your environment
parser.set_skill_file_path("software_skills_lowercase.txt")  # update with actual path if needed
parser.set_resume_path("JobResume2.pdf")  # update with actual path if needed

# Parse the resume to extract skills
parser.parse_resume()

# Print the extracted skills
print("Extracted Skills:")
print(parser.get_skills())

# Print a description summary
print("\nDescription:")
print(parser.get_description())
