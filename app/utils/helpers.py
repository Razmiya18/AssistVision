"""
General Helper Functions.
Provides image formatting conversions, file hashing, and string sanitization utilities.
"""

import hashlib
import time


def generate_timestamp_filename(prefix: str = "frame", extension: str = ".jpg") -> str:
    """
    Generates a unique timestamped file name for camera frame captures.
    """
    timestamp = int(time.time() * 1000)
    return f"{prefix}_{timestamp}{extension}"


def compute_file_sha256(file_path: str) -> str:
    """
    Computes SHA256 checksum of file for caching/deduplication.
    """
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()
