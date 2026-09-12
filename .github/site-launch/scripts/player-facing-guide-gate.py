#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

TEXT_SUFFIXES = {'.md', '.mdx', '.tsx', '.ts', '.jsx', '.js', '.json', '.html'}
PUBLIC_ROOTS = ('content', 'src/components', 'src/config', 'src/locales', 'out')
SOP_PATTERNS = {
    r'\bPuzzle page structure\b': 'internal page blueprint leaked into player UI',
    r'\bWalkthrough structure\b': 'internal page blueprint leaked into player UI',
    r'\bBeginner guide structure\b': 'internal page blueprint leaked into player UI',
    r'\bClue guide structure\b': 'internal page blueprint leaked into player UI',
    r'\bAchievement guide structure\b': 'internal page blueprint leaked into player UI',
    r'\bHint, rule, answer boundary\b': 'internal writing standard leaked into player UI',
    r'\bSource checks?\b': 'internal source-check label leaked into player UI',
    r'\bRequired sections\b': 'internal section checklist leaked into player UI',
    r'\bWorked example\b': 'internal example label leaked into player UI',
    r'\bFreshness\b': 'internal freshness label leaked into player UI',
    r'\bpage evidence package\b': 'internal evidence package leaked into player UI',
    r'\bBuilding your site\b': 'site-builder placeholder leaked into player UI',
    r'\bsite is taking shape\b': 'site-builder placeholder leaked into player UI',
    r'\bfirst version will appear here automatically\b': 'site-builder placeholder leaked into player UI',
    r'\bpage blueprint\b': 'internal page-construction language leaked into player UI',
    r'\bpending data\b': 'internal data-readiness language leaked into player UI',
    r'\bblocked by recheck\b': 'internal review status leaked into player UI',
    r'\bdata layer pending\b': 'internal data-readiness status leaked into player UI',
    r'\b(?:thread |source |route )?evidence pending\b': 'internal evidence status leaked into player UI',
    r'\bverification required\b': 'internal verification status leaked into player UI',
    r'\bpublished field notes\b': 'internal editorial label leaked into player UI',
    r'\blong-term moat\b': 'internal strategy language leaked into player UI',
    r'\bfirst batch targets\b': 'internal strategy language leaked into player UI',
}
CHESS_SEQUENCE = 'White Pawn -> Gold Pawn -> White Knight -> Gold Bishop -> White Bishop -> Gold Rook -> White Rook -> Gold Knight'
WEATHER_SEQUENCE = 'E windy -> tornado -> sunny -> cloudy -> snowy -> sun through the clouds -> rain -> thunder'
WEATHER_TERMS = re.compile(r'\b(tornado|sunny|cloudy|snowy|thunder|sun through the clouds|E windy)\b', re.I)
CHESS_TERMS = re.compile(r'\b(chess pieces?|White Pawn|Gold Pawn|White Knight|Gold Bishop|White Bishop|Gold Rook|White Rook|Gold Knight|captured pieces?)\b', re.I)


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8', errors='ignore')


def line_of(text: str, index: int) -> int:
    return text[:index].count('\n') + 1


def walk(site: Path):
    for root_name in PUBLIC_ROOTS:
        root = site / root_name
        if not root.exists():
            continue
        if root.is_file():
            paths = [root]
        else:
            paths = root.rglob('*')
        for path in paths:
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                if any(part in {'node_modules', '.git', '.next'} for part in path.parts):
                    continue
                yield path


def mdx_body(text: str) -> str:
    match = re.search(r'export\s+const\s+metadata\s*=\s*\{.*?\};', text, flags=re.S)
    return text[match.end():] if match else text


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", text))


def without_related_sections(text: str) -> str:
    return re.split(r'^##\s+Related Guides\b', text, flags=re.I | re.M)[0]


def main() -> int:
    if len(sys.argv) != 2:
        print('Usage: player-facing-guide-gate.py <site-dir>', file=sys.stderr)
        return 2
    site = Path(sys.argv[1]).resolve()
    failures: list[str] = []
    warnings: list[str] = []

    for path in walk(site):
        rel = path.relative_to(site).as_posix()
        text = read(path)
        for pattern, reason in SOP_PATTERNS.items():
            match = re.search(pattern, text, flags=re.I)
            if match:
                failures.append(f'{rel}:{line_of(text, match.start())}: {reason}: {match.group(0)}')

    content = site / 'content'
    if content.exists():
        for path in content.rglob('*.mdx'):
            rel = path.relative_to(site).as_posix()
            text = read(path)
            body = mdx_body(text)
            fact_body = without_related_sections(body)
            h1s = re.findall(r'^#\s+', body, flags=re.M)
            if h1s:
                failures.append(f'{rel}: body contains H1; layout owns the only page H1')
            if '/puzzle-solutions/chess-puzzle.mdx' in '/' + rel:
                if CHESS_SEQUENCE not in text:
                    failures.append(f'{rel}: missing verified chess answer sequence')
                weather_match = WEATHER_TERMS.search(fact_body)
                if weather_match:
                    failures.append(f'{rel}:{line_of(body, weather_match.start())}: chess page contains weather term: {weather_match.group(0)}')
            if '/puzzle-solutions/weather-puzzle.mdx' in '/' + rel:
                if WEATHER_SEQUENCE not in text:
                    failures.append(f'{rel}: missing verified weather answer sequence')
                chess_match = CHESS_TERMS.search(fact_body)
                if chess_match:
                    failures.append(f'{rel}:{line_of(body, chess_match.start())}: weather page contains chess term: {chess_match.group(0)}')
            if '/puzzle-solutions/all-puzzle-solutions.mdx' in '/' + rel:
                if re.search(r'Weather\s*/\s*Chess|Chess\s*/\s*Weather', text, flags=re.I):
                    failures.append(f'{rel}: aggregator merges Weather and Chess into one row')
                for line in text.splitlines():
                    if line.lstrip().startswith('|') and WEATHER_TERMS.search(line) and CHESS_TERMS.search(line):
                        failures.append(f'{rel}: aggregator row mixes Weather and Chess facts: {line[:160]}')
                if CHESS_SEQUENCE not in text or WEATHER_SEQUENCE not in text:
                    failures.append(f'{rel}: aggregator must include separate verified Chess and Weather answers')
            if rel.startswith('content/en/') and word_count(body) < 260:
                warnings.append(f'{rel}: thin page candidate ({word_count(body)} words); add exact steps, clue context, screenshots, mistakes, and related next action')

    home = site / 'src/components/home-page-client.tsx'
    if home.exists():
        text = read(home)
        required: list[str] = []
        plan_path = site / 'requirements/site-plan.json'
        if plan_path.exists():
            try:
                import json
                plan = json.loads(plan_path.read_text(encoding='utf-8-sig'))
                for page in plan.get('launchPages', []):
                    if isinstance(page, dict):
                        url = str(page.get('url') or '').strip()
                        if url and url != '/':
                            required.append(url.rstrip('/'))
            except Exception as exc:
                failures.append(f'requirements/site-plan.json: cannot read launch page links: {exc}')
        if not required:
            required = [
                '/puzzle-solutions/all-puzzle-solutions',
                '/puzzle-solutions/clock-puzzle',
                '/puzzle-solutions/chess-puzzle',
                '/puzzle-solutions/greek-letters-puzzle',
                '/puzzle-solutions/solitaire-puzzle',
                '/puzzle-solutions/weather-puzzle',
                '/walkthrough/first-room',
            ]
        for href in required:
            if href not in text and f'{href}/' not in text:
                failures.append(f'src/components/home-page-client.tsx: homepage missing core guide link {href}')
        target_match = re.search(r'const\s+puzzleTargets\s*=\s*\[([\s\S]*?)\n\];', text)
        if target_match:
            target_count = target_match.group(1).count('href:')
            for locale in ['en', 'ja', 'ko', 'de']:
                loc = re.search(rf'\n\s*{locale}:\s*\{{[\s\S]*?puzzles:\s*\[([\s\S]*?)\n\s*\]', text)
                if loc:
                    copy_count = loc.group(1).count('label:')
                    if copy_count != target_count:
                        failures.append(f'src/components/home-page-client.tsx: {locale} puzzle copy count {copy_count} != target count {target_count}')

    for warning in warnings[:100]:
        print(f'WARNING: {warning}')
    if failures:
        print('player_facing_guide_gate=failed')
        for failure in failures[:120]:
            print(f'ERROR: {failure}')
        if len(failures) > 120:
            print(f'ERROR: plus {len(failures) - 120} more failures')
        return 1
    print('player_facing_guide_gate=ok')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
