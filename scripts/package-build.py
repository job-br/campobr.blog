#!/usr/bin/env python3
import os
import sys
import zipfile
import base64
import subprocess
import shutil

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
PUBLIC_DOWNLOAD_DIR = os.path.join(ROOT_DIR, 'public', 'download')
ZIP_DIST_PATH = os.path.join(PUBLIC_DOWNLOAD_DIR, 'campobr-dist-pronto.zip')
ZIP_SRC_PATH = os.path.join(PUBLIC_DOWNLOAD_DIR, 'campobr-codigo-fonte.zip')
BASE64_TS_PATH = os.path.join(ROOT_DIR, 'src', 'services', 'zipDistBase64.ts')
SRC_BASE64_TS_PATH = os.path.join(ROOT_DIR, 'src', 'services', 'zipSourceBase64.ts')

def run(cmd):
    print(f"[RUN] {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=ROOT_DIR)
    if res.returncode != 0:
        print(f"[ERROR] Command failed with exit code {res.returncode}")
        sys.exit(res.returncode)

def main():
    os.makedirs(PUBLIC_DOWNLOAD_DIR, exist_ok=True)

    # Step 0: Ensure zipDistBase64 and zipSourceBase64 are empty for the pure blog dist build
    with open(BASE64_TS_PATH, 'w', encoding='utf-8') as f:
        f.write('export const DIST_ZIP_BASE64 = "";\n')
    with open(SRC_BASE64_TS_PATH, 'w', encoding='utf-8') as f:
        f.write('export const SOURCE_ZIP_BASE64 = "";\n')

    # Step 1: Run Vite Build (Pure blog build)
    print("--- 1. Building Vite Production App (Clean) ---")
    run("npx vite build")

    # Step 2: Create campobr-dist-pronto.zip from dist/ (excluding download/ and base64 chunks)
    print("--- 2. Packaging dist into campobr-dist-pronto.zip ---")
    with zipfile.ZipFile(ZIP_DIST_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(DIST_DIR):
            rel_root = os.path.relpath(root, DIST_DIR)
            if rel_root == 'download' or rel_root.startswith('download' + os.sep):
                continue
            for file in files:
                if 'zipDistBase64' in file or 'zipSourceBase64' in file:
                    continue
                full_path = os.path.join(root, file)
                arcname = os.path.relpath(full_path, DIST_DIR)
                zipf.write(full_path, arcname)

    zip_size_kb = os.path.getsize(ZIP_DIST_PATH) // 1024
    print(f"Created clean {ZIP_DIST_PATH} ({zip_size_kb} KB)")

    # Step 3: Update zipDistBase64.ts with the clean zip Base64
    print("--- 3. Updating src/services/zipDistBase64.ts ---")
    with open(ZIP_DIST_PATH, 'rb') as f:
        b64_content = base64.b64encode(f.read()).decode('utf-8')
    
    ts_code = f'// Gerado automaticamente com a compilação mais recente do CampoBR\nexport const DIST_ZIP_BASE64 = "{b64_content}";\n'
    with open(BASE64_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(ts_code)
    print(f"Updated {BASE64_TS_PATH} (Length: {len(b64_content)} chars)")

    # Step 4: Create campobr-codigo-fonte.zip from root
    print("--- 4. Packaging source code into campobr-codigo-fonte.zip ---")
    ignored_dirs = {'node_modules', 'dist', '.git', '.cache', 'coverage'}
    with zipfile.ZipFile(ZIP_SRC_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(ROOT_DIR):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            rel_root = os.path.relpath(root, ROOT_DIR)
            if rel_root == '.' or not any(part in ignored_dirs for part in rel_root.split(os.sep)):
                for file in files:
                    if file.endswith('.zip') or file in {'zipDistBase64.ts', 'zipSourceBase64.ts'}:
                        continue
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, ROOT_DIR)
                    zipf.write(full_path, arcname)
    src_size_kb = os.path.getsize(ZIP_SRC_PATH) // 1024
    print(f"Created {ZIP_SRC_PATH} ({src_size_kb} KB)")

    # Step 4.1: Update zipSourceBase64.ts with the source zip Base64
    print("--- 4.1. Updating src/services/zipSourceBase64.ts ---")
    with open(ZIP_SRC_PATH, 'rb') as f:
        src_b64 = base64.b64encode(f.read()).decode('utf-8')
    with open(SRC_BASE64_TS_PATH, 'w', encoding='utf-8') as f:
        f.write(f'// Gerado automaticamente com o código-fonte mais recente do CampoBR\nexport const SOURCE_ZIP_BASE64 = "{src_b64}";\n')
    print(f"Updated {SRC_BASE64_TS_PATH} (Length: {len(src_b64)} chars)")

    # Step 5: Final Vite Build with latest base64
    print("--- 5. Final Vite Build with latest base64 ---")
    run("npx vite build")

    # Step 6: Sync newly created zip files into dist/download as well
    dist_download_dir = os.path.join(DIST_DIR, 'download')
    os.makedirs(dist_download_dir, exist_ok=True)
    shutil.copy2(ZIP_DIST_PATH, os.path.join(dist_download_dir, 'campobr-dist-pronto.zip'))
    shutil.copy2(ZIP_SRC_PATH, os.path.join(dist_download_dir, 'campobr-codigo-fonte.zip'))
    print("Copied zip archives to dist/download/")

    print("=== All distribution archives successfully updated and synchronized! ===")

if __name__ == '__main__':
    main()
