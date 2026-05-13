import os
import shutil

def clean_directory(root_dir):
    removed_folders = []
    
    # os.walk with topdown=True allows modifying dirnames in-place to control traversal
    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        # Do not traverse into .git or chroma_db to ensure we don't touch them
        dirnames[:] = [d for d in dirnames if d not in ['.git', 'chroma_db']]
        
        # Identify folders to remove
        to_remove = []
        for d in dirnames:
            if d in ['node_modules', 'venv']:
                to_remove.append(d)
                
        for d in to_remove:
            full_path = os.path.join(dirpath, d)
            try:
                shutil.rmtree(full_path)
                removed_folders.append(full_path)
                # Remove from dirnames so we don't traverse into the deleted directory
                dirnames.remove(d)
            except Exception as e:
                print(f"Error deleting {full_path}: {e}")
                
    return removed_folders

if __name__ == "__main__":
    current_dir = os.path.abspath(os.getcwd())
    print(f"Scanning {current_dir} for 'node_modules' and 'venv' folders...")
    print("Protecting .git, chroma_db, and all other files outside these directories.")
    
    removed = clean_directory(current_dir)
    
    print("\n--- Summary of Removed Folders ---")
    if not removed:
        print("No folders named 'node_modules' or 'venv' were found.")
    else:
        for folder in removed:
            print(f"Successfully deleted: {folder}")
    print("----------------------------------")
