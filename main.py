import os
import re
import sys
import shutil
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Electron sometimes pipes stdout/stderr in a legacy Windows encoding.
# Reconfigure to UTF-8 (and replace errors) so we never crash on logging.
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (OSError, ValueError):
        pass

# --- CONFIGURATION ---
# When launched by VocalFlow (Electron), VOCALFLOW_APP_ROOT is set to the managed workspace.
_APP_ROOT = Path(os.environ.get("VOCALFLOW_APP_ROOT", Path(__file__).resolve().parent))
SOURCE_DIR = Path(os.environ.get("VOCALFLOW_SORT_SOURCE", _APP_ROOT / "VocalFlow_Intake"))
DEST_BASE = Path(os.environ.get("VOCALFLOW_SORT_DEST", _APP_ROOT))

# Leave these in intake for Electron (analytics / zip extract) — do not auto-move.
_KEEP_IN_INTAKE_EXT = {
    ".wav", ".mp3", ".flac", ".aac", ".m4a",
    ".txt", ".doc", ".docx", ".pdf", ".csv",
    ".zip", ".json", ".vtt",
}

# --- REGEX PATTERNS ---
# Matches: ep01, Episode 01, s01, Season 01, etc.
EP_SEASON_PATTERN = re.compile(r'(ep\d+|episode\s*\d+|s\d+|season\s*\d+)', re.IGNORECASE)
SEASON_ONLY_PATTERN = re.compile(r'(s\d+|season\s*\d+)', re.IGNORECASE)

class SortHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        # Avoid duplicate processing while an event is still being handled.
        self._processing = set()
        # Small debounce window for repeated events.
        self._recently_processed_at = {}

    def on_modified(self, event):
        # Some Windows copy operations emit "created" before the file is fully written.
        # Process on modified too, but debounced/in-flight guarded.
        if not event.is_directory:
            self.process_file(Path(event.src_path))

    def on_created(self, event):
        # If a folder is dropped in, scan it recursively for files
        if event.is_directory:
            self.scan_folder_recursively(Path(event.src_path))
        else:
            self.process_file(Path(event.src_path))

    def scan_folder_recursively(self, folder_path):
        """Finds every file inside nested subdirectories."""
        if not folder_path.exists(): return
        for file in folder_path.rglob('*'):
            if file.is_file():
                self.process_file(file)

    def wait_until_file_stable(
        self,
        file_path: Path,
        timeout_s: int = 30,
        interval_s: float = 0.3,
        stable_rounds: int = 2
    ) -> bool:
        """
        Wait until file size stops changing (handles Windows file copy lag).
        FIX: allow size==0 (empty files are valid), faster poll, fewer rounds.
        FIX: if size is already stable on the first read, return immediately.
        """
        start = time.time()
        last_size = -1
        stable_count = 0

        while time.time() - start < timeout_s:
            try:
                size = file_path.stat().st_size
            except OSError:
                last_size = -1
                stable_count = 0
                time.sleep(interval_s)
                continue

            if size == last_size:
                stable_count += 1
                if stable_count >= stable_rounds:
                    return True
            else:
                stable_count = 0
                last_size = size

            time.sleep(interval_s)

        return False

    def process_file(self, file_path):
        if not file_path.exists() or not file_path.is_file(): return
        if file_path.name.startswith('.'): return 

        file_key = str(file_path)
        now = time.time()
        if file_key in self._processing:
            return
        prev_at = self._recently_processed_at.get(file_key)
        if prev_at is not None and now - prev_at < 4:  # FIX: was 15s — too long for rapid imports
            return

        self._processing.add(file_key)
        filename = file_path.name
        stem = file_path.stem
        ext = file_path.suffix.lower()

        try:
            if ext in _KEEP_IN_INTAKE_EXT:
                return

            video_exts = {'.mp4', '.mkv', '.avi', '.mov', '.m4v'}
            image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
            archive_exts = {'.zip', '.rar', '.7z', '.tar', '.gz'}

            # FIX: Only wait for stability for file types we will actually move.
            # The old catch-all clause triggered a 120s wait for almost every file.
            will_move = ext == '.srt' or ext in video_exts or ext in image_exts
            if will_move:
                stable = self.wait_until_file_stable(file_path)
                if not stable:
                    print(f"[sorter] Skip (file not stable): {filename}", flush=True)
                    return

            # --- LOGIC: SRT & VIDEOS (Projects) ---
            if ext == '.srt' or ext in video_exts:
                sub_type = "SRT" if ext == '.srt' else "MP4"

                # 1. Extract clean title
                match = EP_SEASON_PATTERN.search(stem)
                clean_title = stem[:match.start()].strip(" _-") if match else stem

                # 2. FIXED SEASON LOGIC: Extract only the number
                s_match = SEASON_ONLY_PATTERN.search(stem)
                season_folder = ""
                if s_match:
                    # Find just the digits in the match (e.g., "Season 1" -> "1", "S02" -> "02")
                    digits = re.search(r'\d+', s_match.group(0))
                    if digits:
                        season_folder = f"Season {int(digits.group(0))}"

                # 3. Fuzzy Match for Project Folder
                project_path = self.find_fuzzy_match(clean_title, DEST_BASE / "Projects")
                if not project_path:
                    # FIX: No matching project folder found — leave the file in intake
                    # so it appears in the inbox for manual review, rather than
                    # silently creating a new project folder from the filename.
                    print(f"[sorter] No project match for {filename!r} (title={clean_title!r}) — keeping in intake", flush=True)
                    return

                # 4. Build Final Path
                if season_folder:
                    final_dest = project_path / season_folder / sub_type
                else:
                    final_dest = project_path / sub_type

                self.move_file(file_path, final_dest)

            # --- LOGIC: IMAGES ---
            elif ext in image_exts:
                # First segment (split by first dot)
                first_sentence = stem.split('.')[0].strip()
                self.move_file(file_path, DEST_BASE / "Images" / first_sentence)

            # --- LOGIC: OTHERS ---
            elif ext and ext not in archive_exts:
                # medialink/Others/mp3 (removes the dot)
                self.move_file(file_path, DEST_BASE / "Others" / ext.replace('.', ''))

        except Exception as e:
            print(f"[sorter] ERROR {filename}: {e}", flush=True)
        finally:
            self._processing.discard(file_key)
            self._recently_processed_at[file_key] = time.time()

    def find_fuzzy_match(self, new_name, parent_folder):
        """
        Matches a filename to an existing project folder.
        Strategy (in priority order):
          1. Exact match (case-insensitive, ignoring spaces/underscores)
          2. Folder name is contained within the filename
          3. Every word of the folder name appears in the filename (word-set match)
        Folders are checked longest-first so the most specific match wins.
        """
        if not parent_folder.exists():
            return None

        def normalise(s):
            return s.lower().replace(" ", "").replace("_", "").replace("-", "")

        new_clean = normalise(new_name)
        new_words = set(re.split(r'[\s_\-]+', new_name.lower()))

        existing_dirs = [d for d in parent_folder.iterdir() if d.is_dir()]
        existing_dirs.sort(key=lambda x: len(x.name), reverse=True)

        for existing in existing_dirs:
            folder_clean = normalise(existing.name)
            if not folder_clean:
                continue

            # 1. Exact normalised match
            if folder_clean == new_clean:
                print(f"[sorter] Matched (exact): {existing.name!r} <- {new_name!r}", flush=True)
                return existing

            # 2. Folder name substring of filename
            if folder_clean in new_clean:
                print(f"[sorter] Matched (substring): {existing.name!r} <- {new_name!r}", flush=True)
                return existing

            # 3. Every word in the folder name appears in the filename
            folder_words = set(re.split(r'[\s_\-]+', existing.name.lower()))
            if folder_words and folder_words <= new_words:
                print(f"[sorter] Matched (word-set): {existing.name!r} <- {new_name!r}", flush=True)
                return existing

        print(f"[sorter] No match for: {new_name!r} in {parent_folder}", flush=True)
        return None

    def move_file(self, src, dest_folder):
        dest_folder.mkdir(parents=True, exist_ok=True)
        final_path = dest_folder / src.name

        last_err = None
        for _attempt in range(5):
            try:
                shutil.move(str(src), str(final_path))
                print(f"[sorter] Moved: {src.name} -> {dest_folder}", flush=True)
                return
            except PermissionError as e:
                last_err = e
                time.sleep(1.5)
            except FileNotFoundError:
                # Another event likely moved it already.
                return

        if last_err is not None:
            raise last_err

def initial_scan():
    """Checks the entire to_sort directory tree on startup."""
    handler = SortHandler()
    if SOURCE_DIR.exists():
        print("[sorter] Initial scan of intake...", flush=True)
        for file in SOURCE_DIR.rglob('*'):
            if file.is_file():
                handler.process_file(file)

def run_sorter_loop():
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[sorter] App root: {_APP_ROOT.resolve()}", flush=True)
    print(f"[sorter] Intake watch: {SOURCE_DIR.resolve()}", flush=True)
    print(f"[sorter] Sort into: {DEST_BASE.resolve()}", flush=True)
    initial_scan()

    event_handler = SortHandler()
    observer = Observer()
    observer.schedule(event_handler, str(SOURCE_DIR), recursive=True)
    observer.start()

    print(f"[sorter] Watching: {SOURCE_DIR} (Ctrl+C to stop)", flush=True)
    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        observer.stop()
        print("\n[sorter] Stopping...", flush=True)
    observer.join()


if __name__ == "__main__":
    run_sorter_loop()