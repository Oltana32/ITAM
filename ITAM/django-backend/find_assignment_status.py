#!/usr/bin/env python
"""
Find all Python files that reference AssignmentStatus
Run this in your django-backend directory: python find_assignment_status.py
"""

import os
import sys
from pathlib import Path

def find_assignment_status_refs():
    """Find all files referencing AssignmentStatus."""
    
    files_with_refs = {}
    root = Path('.')
    
    # Search all .py files
    for py_file in root.rglob('*.py'):
        # Skip migrations and __pycache__
        if 'migrations' in str(py_file) or '__pycache__' in str(py_file):
            continue
        
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Find lines with AssignmentStatus
            refs = []
            for line_num, line in enumerate(lines, 1):
                if 'AssignmentStatus' in line:
                    refs.append((line_num, line.strip()))
            
            if refs:
                files_with_refs[str(py_file)] = refs
        
        except Exception as e:
            print(f"Error reading {py_file}: {e}")
    
    # Print results
    print("\n" + "="*80)
    print("FILES THAT NEED FIXING (AssignmentStatus references found)")
    print("="*80 + "\n")
    
    if files_with_refs:
        for file_path, refs in sorted(files_with_refs.items()):
            print(f"\n📄 {file_path}")
            for line_num, line in refs:
                print(f"   Line {line_num}: {line}")
    else:
        print("✓ No AssignmentStatus references found!")
    
    print(f"\n{'='*80}")
    print(f"Total files to fix: {len(files_with_refs)}")
    print("="*80 + "\n")
    
    return files_with_refs

if __name__ == '__main__':
    files = find_assignment_status_refs()
    sys.exit(0 if not files else 1)