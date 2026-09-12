"""Read-only page delivery validation; never manufactures approval artifacts."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agent.delivery_contract import validate_delivery

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('project', type=Path)
    parser.add_argument('--phase', choices=['planning', 'evidence', 'prototype', 'release'], default='release')
    args = parser.parse_args()
    errors = validate_delivery(args.project, args.phase)
    print(json.dumps({'passed': not errors, 'errors': errors}, ensure_ascii=False))
    raise SystemExit(bool(errors))
