import os

# Configuration
TARGET_FOLDERS = ['iba-backend', 'iba-booking-frontend']
OUTPUT_FILE = 'merged_code.txt'

# Exclusion lists
IGNORE_DIRS = {'node_modules', 'dist', '.git', '.vscode', 'build', '.next'}
IGNORE_EXTENSIONS = {'.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.pdf', '.map'}
IGNORE_FILES = {'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', OUTPUT_FILE}

def should_ignore(path, is_dir=False):
    name = os.path.basename(path)
    if is_dir:
        return name in IGNORE_DIRS
    
    # Check specific file names (like .env)
    if name in IGNORE_FILES:
        return True
    
    # Check extensions
    _, ext = os.path.splitext(name)
    if ext.lower() in IGNORE_EXTENSIONS:
        return True
    
    return False

def merge_code():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        for root_folder in TARGET_FOLDERS:
            if not os.path.exists(root_folder):
                print(f"Skipping: Folder '{root_folder}' not found.")
                continue

            print(f"Processing: {root_folder}...")
            
            for root, dirs, files in os.walk(root_folder):
                # Filter out ignored directories in-place to prevent os.walk from entering them
                dirs[:] = [d for d in dirs if not should_ignore(os.path.join(root, d), is_dir=True)]

                for file in files:
                    file_path = os.path.join(root, file)
                    
                    if should_ignore(file_path):
                        continue

                    try:
                        # Write a header for each file to keep the output organized
                        outfile.write(f"\n{'='*80}\n")
                        outfile.write(f"FILE: {file_path}\n")
                        outfile.write(f"{'='*80}\n\n")

                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            outfile.write(infile.read())
                            outfile.write("\n")
                            
                    except Exception as e:
                        print(f"Could not read {file_path}: {e}")

    print(f"\nDone! All code has been merged into: {OUTPUT_FILE}")

if __name__ == "__main__":
    merge_code()