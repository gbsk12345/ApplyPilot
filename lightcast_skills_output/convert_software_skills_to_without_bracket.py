# --- Importing Required Libraries ---
import re
from pathlib import Path

# --- Step 1: Define Input and Output File Paths ---
# This is your original file with possible brackets
input_file_path = Path("raw_skills.txt")
# This will store the cleaned skill names
output_file_path = Path("cleaned_skills.txt")

# --- Step 2: Define a Function to Clean Each Line ---


def clean_line(line):
    """
    Removes any content within parentheses along with the parentheses.
    Example: "python (programming language)" becomes "python"

    Args:
        line (str): The raw line from the input file.

    Returns:
        str: The cleaned line with bracketed content removed.
    """
    # Remove content in parentheses using regex
    cleaned = re.sub(r"\s*\([^)]*\)", "", line)

    # Also strip leading/trailing whitespace and convert to lowercase
    return cleaned.strip()

# --- Step 3: Read, Clean, and Write Each Line ---


def clean_skills_file(input_path, output_path):
    """
    Reads a file, cleans each line to remove parentheses content,
    and writes cleaned lines to a new output file.

    Args:
        input_path (Path): Path to the input file.
        output_path (Path): Path to the output file.
    """

    # Convert to Path if given as a string
    input_path = Path(input_path)
    output_path = Path(output_path)

    if not input_path.exists():
        print(f"Error: Input file '{input_path}' not found.")
        return

    with open(input_path, 'r', encoding='utf-8') as infile, \
            open(output_path, 'w', encoding='utf-8') as outfile:

        for line in infile:
            if line.strip():  # Skip blank lines
                cleaned_line = clean_line(line)
                outfile.write(cleaned_line + "\n")

    print(f"✅ Cleaned skills written to: {output_path}")


# --- Step 4: Execute the Cleaning Function ---
if __name__ == "__main__":
    clean_skills_file("LightCast_Skills_Output/software_skills_lowercase.txt",
                      "LightCast_Skills_Output/cleaned_skills.txt")
