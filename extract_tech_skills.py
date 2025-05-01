import pandas as pd


def extract_unique_skills(input_csv, skills_column, output_file):
    try:
        # Load CSV
        df = pd.read_csv(input_csv)

        if skills_column not in df.columns:
            print(f"Column '{skills_column}' not found in CSV!")
            return

        # Drop NaN entries in skills column
        skills_series = df[skills_column].dropna()

        all_skills = set()

        for skill_entry in skills_series:
            # Assuming skills are separated by commas
            skills = [skill.strip()
                      for skill in skill_entry.split(',') if skill.strip()]
            all_skills.update(skills)

        # Sort skills alphabetically
        unique_skills = sorted(all_skills)

        # Save to file
        with open(output_file, 'w') as f:
            for skill in unique_skills:
                f.write(f"{skill}\n")

        print(
            f"✅ Extracted {len(unique_skills)} unique technical skills and saved to '{output_file}'.")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    INPUT_CSV = "JobsDatasetProcessed.csv"
    SKILLS_COLUMN = "IT Skills"
    OUTPUT_FILE = "tech_skills_list.txt"

    extract_unique_skills(INPUT_CSV, SKILLS_COLUMN, OUTPUT_FILE)
