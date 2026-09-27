#!/usr/bin/env python3
"""Run any command under the machine-wide render lock that still.py uses, so only one Blender runs at a time:

  python3 tools/endings/blender/locked.py /Applications/Blender.app/Contents/MacOS/Blender -b ... -P probe.py -- ...
"""
import fcntl
import subprocess
import sys

from still import LOCK

if __name__ == "__main__":
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    with open(LOCK, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        sys.exit(subprocess.run(sys.argv[1:]).returncode)
