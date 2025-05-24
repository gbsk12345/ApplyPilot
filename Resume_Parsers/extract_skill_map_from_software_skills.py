# step1_extract_skill_map.py

import os

# --- Configuration ---
skills_file_path = 'software_skills_lowercase.txt'  # Adjust path if needed

# --- Initialize Mapping ---
keyword_to_full_skill = {}

# --- Read and Parse Skills File ---
with open(skills_file_path, 'r', encoding='utf-8') as f:
    for line in f:
        raw_line = line.strip()
        if not raw_line:
            continue  # skip empty lines

        # Extract keyword before '(' or use the full line if no '(' exists
        keyword = raw_line.split('(')[0].strip().lower()

        # Store the mapping: keyword → original full entry
        if keyword:
            keyword_to_full_skill[keyword] = raw_line

# --- Preview First 20 Mappings ---
print("✅ Keyword to Full Skill Mapping (Preview):")
for i, (key, value) in enumerate(keyword_to_full_skill.items()):
    print(f"{i+1}. {key} → {value}")
    if i >= 19:
        break

# --- Optional: Save to a file ---
with open('cleaned_skill_mapping.txt', 'w') as f:
    for keyword, full_skill in keyword_to_full_skill.items():
        f.write(f"{keyword} → {full_skill}\n")

print("\n✅ Saved mapping to 'cleaned_skill_mapping.txt'")
