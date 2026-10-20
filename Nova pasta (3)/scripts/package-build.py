#!/usr/bin/env python3
"""Build the public site only. Source archives must never be written into public/ or dist/."""
import os, subprocess, sys
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
raise SystemExit(subprocess.call(['npx', 'vite', 'build'], cwd=root))
