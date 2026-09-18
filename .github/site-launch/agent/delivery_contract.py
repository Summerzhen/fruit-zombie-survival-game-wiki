"""Cross-stage delivery checks. Metadata is never proof of a working page.

The automated checks establish traceability and freshness, not the truth of a
source or the quality of a design; those still require recorded page review.
"""
from __future__ import annotations

import hashlib
import json
import re
import struct
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


UNKNOWN = re.compile(r'^(?:unknown|unkonw|unkown|tbd|todo|pending|n/?a|待补充|未知|待核实|未确认)[.!。\s]*$', re.I)


def useful(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip()) and not UNKNOWN.fullmatch(value.strip())


def read_object(path: Path) -> dict:
    value = json.loads(path.read_text(encoding='utf-8-sig'))
    if not isinstance(value, dict):
        raise ValueError(f'{path.name} must be an object')
    return value


def local_file(root: Path, value: object) -> Path | None:
    if not isinstance(value, str) or not value.strip():
        return None
    path = (root / value).resolve()
    if root.resolve() not in path.parents or not path.is_file():
        return None
    return path


def route(value: object) -> str:
    if not isinstance(value, str) or not value.startswith('/') or '..' in value.split('/'):
        return ''
    return '/' + value.strip('/') + '/' if value != '/' else '/'


def source_errors(root: Path, source: object) -> list[str]:
    if not isinstance(source, dict):
        return ['source must include URL, exact excerpt, locator and saved artifact']
    errors = []
    try:
        parsed = urlsplit(str(source.get('url') or ''))
        valid_url = parsed.scheme in {'https', 'http'} and bool(parsed.hostname)
    except ValueError:
        valid_url = False
    if not valid_url:
        errors.append('source URL is missing or invalid')
    for key in ('excerpt', 'locator', 'checkedAt'):
        if not useful(source.get(key)):
            errors.append(f'source {key} is missing or unknown')
    try:
        datetime.fromisoformat(str(source.get('checkedAt')).replace('Z', '+00:00'))
    except ValueError:
        errors.append('source checkedAt must be an ISO date/time')
    artifact = local_file(root, source.get('artifact'))
    if artifact is None:
        errors.append('source artifact must be a saved file inside the project')
    else:
        if hashlib.sha256(artifact.read_bytes()).hexdigest() != source.get('sha256'):
            errors.append('source artifact hash mismatch')
        if artifact.suffix.lower() in {'.txt', '.md', '.json', '.html', '.vtt', '.srt'}:
            excerpt = source.get('excerpt')
            if useful(excerpt) and excerpt not in artifact.read_text(encoding='utf-8', errors='replace'):
                errors.append('source excerpt is absent from saved artifact')
    return errors


def evidence_errors(root: Path, brief: dict) -> list[str]:
    """Every required evidence item needs its own supported answer, not N URLs."""
    required = brief.get('requiredEvidence')
    label = str(brief.get('id') or brief.get('url') or 'page')
    if not isinstance(required, list) or not required:
        return [f'{label}: define requiredEvidence before generation']
    if any(not useful(item) for item in required):
        return [f'{label}: requiredEvidence must contain specific questions, not placeholders']
    identifier = str(brief.get('id') or '')
    path = local_file(root, f'content/evidence/{identifier}.json')
    if path is None:
        return [f'{label}: missing evidence; return to research']
    try:
        evidence = read_object(path)
    except (ValueError, OSError) as exc:
        return [f'{label}: invalid evidence: {exc}']
    coverage = evidence.get('coverage')
    if not isinstance(coverage, list) or not coverage:
        return [f'{label}: evidence coverage is empty; URLs or verified status alone do not pass']
    errors = []
    for question in required:
        rows = [row for row in coverage if isinstance(row, dict) and row.get('requirement') == question]
        if len(rows) != 1:
            errors.append(f'{label}: {question}: requires exactly one coverage record; return to research')
            continue
        row = rows[0]
        if row.get('status') != 'supported' or not useful(row.get('answer')):
            errors.append(f'{label}: {question}: core answer unresolved; research or revise page scope')
        sources = row.get('sources')
        if not isinstance(sources, list) or not sources:
            errors.append(f'{label}: {question}: no supporting source')
        else:
            for source in sources:
                errors.extend(f'{label}: {question}: {error}' for error in source_errors(root, source))
    return errors


def validate_delivery(root: Path, phase: str) -> list[str]:
    path = root / 'content/page-delivery.json'
    try:
        contract = read_object(path)
        plan_payload = read_object(root / 'requirements/site-plan.json')
        plan = plan_payload.get('sitePlan', plan_payload)
        briefs_payload = read_object(root / 'content/page-briefs.json')
    except (ValueError, OSError) as exc:
        return [f'delivery contract: {exc}; see docs/page-delivery-contract.md']
    pages = contract.get('pages')
    if not isinstance(pages, list) or not pages:
        return ['delivery contract must contain pages']
    errors = []
    if not isinstance(plan, dict):
        return ['sitePlan must be an object']
    briefs = briefs_payload.get('briefs', briefs_payload.get('pages'))
    if not isinstance(briefs, list) or not briefs or any(not isinstance(b, dict) for b in briefs):
        return ['page briefs must contain objects']
    briefs_by_id = {b.get('id'): b for b in briefs if isinstance(b.get('id'), str)}
    by_url = {}
    keywords = {}
    for page in pages:
        if not isinstance(page, dict):
            errors.append('delivery page must be an object')
            continue
        url = route(page.get('url'))
        if not url or url in by_url:
            errors.append(f'delivery URL missing or duplicated: {page.get("url")}')
            continue
        by_url[url] = page
        brief = briefs_by_id.get(page.get('id')) if isinstance(page.get('id'), str) else None
        if brief is None:
            errors.append(f'{url}: delivery page must reference an existing brief id')
        else:
            if route(brief.get('url')) != url or brief.get('requiredEvidence') != page.get('requiredEvidence'):
                errors.append(f'{url}: delivery URL/questions differ from brief; reconcile planning first')
            if str(brief.get('keyword') or '').strip().lower() != str(page.get('primaryKeyword') or '').strip().lower():
                errors.append(f'{url}: primary keyword differs from brief')
            if phase in {'prototype', 'release'} and (phase == 'release' or page.get('prototype') is True):
                placement = brief.get('keywordPlacement')
                review = page.get('renderReview') if isinstance(page.get('renderReview'), dict) else {}
                for planned_key, observed_key in (('title', 'titleText'), ('h1', 'h1Text')):
                    planned = placement.get(planned_key) if isinstance(placement, dict) else None
                    if not useful(planned) or norm(planned) != norm(str(review.get(observed_key) or '')):
                        errors.append(f'{url}: rendered {observed_key} must match brief.keywordPlacement.{planned_key}')
                homepage_copy = plan.get('homepage', {}).get('keywordPlacement') if isinstance(plan.get('homepage'), dict) else None
                if url == '/' and isinstance(homepage_copy, dict):
                    for key in ('title', 'h1'):
                        if not isinstance(placement, dict) or placement.get(key) != homepage_copy.get(key):
                            errors.append(f'/: homepage and brief keywordPlacement.{key} differ; reconcile planning')
                interactive = brief.get('featureRole') in {'interactive', 'hybrid'}
                errors.extend(interaction_errors(root, page, interactive))
        for key in ('primaryKeyword', 'userTask', 'answerPromise', 'pageType'):
            if not useful(page.get(key)):
                errors.append(f'{url}: missing meaningful {key}; return to planning')
        keyword = ' '.join(str(page.get('primaryKeyword') or '').lower().split())
        if keyword and keyword in keywords:
            errors.append(f'{url}: primary keyword already owned by {keywords[keyword]}; merge or distinguish intent')
        keywords[keyword] = url
        questions = page.get('requiredEvidence')
        if not isinstance(questions, list) or not questions or any(not useful(q) for q in questions):
            errors.append(f'{url}: specify core questions in requiredEvidence')
        if phase != 'planning':
            errors.extend(evidence_errors(root, page))
    launch = plan.get('launchPages')
    if not isinstance(launch, list) or not launch:
        errors.append('site plan must contain launchPages')
    else:
        for page in launch:
            if not isinstance(page, dict):
                errors.append('launchPages entry must be an object')
                continue
            url = route(page.get('url'))
            if url not in by_url:
                errors.append(f'planned launch page has no delivery contract: {page.get("url")}')
    if phase in {'prototype', 'release'}:
        prototypes = [page for page in by_url.values() if page.get('prototype') is True]
        if not any(page.get('url') == '/' for page in prototypes) or not any(page.get('url') != '/' for page in prototypes):
            errors.append('before translation/expansion, review homepage and representative inner-page prototypes')
        types = {str(page.get('pageType')) for page in by_url.values()}
        if types - {str(page.get('pageType')) for page in prototypes}:
            errors.append('prototype review must cover every planned page type')
        for page in by_url.values() if phase == 'release' else prototypes:
            errors.extend(render_errors(root, page))
    return errors


def interaction_errors(root: Path, page: dict, required: bool) -> list[str]:
    from .interaction_contract import assertions_for, matches as assertion_matches
    tests = page.get('interactionTests')
    if not tests:
        return [f'{page.get("url")}: interactive page requires executable interactionTests'] if required else []
    if not isinstance(tests, list) or any(not isinstance(t, dict) for t in tests):
        return [f'{page.get("url")}: interactionTests must contain objects']
    try:
        report = read_object(root / 'audit/interaction-results.json')
    except (ValueError, OSError):
        return [f'{page.get("url")}: run scripts/probe-delivery-interactions.py against the reviewed preview build']
    results = report.get('results')
    if not isinstance(results, list):
        return ['interaction results must be an array']
    errors = []
    ids = set()
    for test in tests:
        identifier = test.get('id')
        if not useful(identifier) or identifier in ids:
            errors.append(f'{page.get("url")}: interaction test id missing or duplicated')
            continue
        ids.add(identifier)
        try:
            assertions = assertions_for(test)
        except ValueError as exc:
            errors.append(f'{page.get("url")}: interaction {identifier}: {exc}')
            continue
        if not isinstance(test.get('actions'), list) or not test['actions']:
            errors.append(f'{page.get("url")}: interaction test must perform actions and check a concrete outcome')
        matches = [row for row in results if isinstance(row,dict) and row.get('url') == page.get('url') and row.get('id') == identifier]
        html = local_file(root, page.get('renderReview',{}).get('html')) if isinstance(page.get('renderReview'),dict) else None
        valid = len(matches) == 1 and html is not None
        if valid:
            row = matches[0]
            before, after = row.get('before'), row.get('after')
            observations_valid = isinstance(before,list) and isinstance(after,list) and len(before) == len(after) == len(assertions)
            if observations_valid:
                observations_valid = all(assertion_matches(a,v) for a,v in zip(assertions,after)) and not all(assertion_matches(a,v) for a,v in zip(assertions,before))
            valid = row.get('passed') is True and row.get('inputDigest') == input_digest(root,page) and row.get('testDigest') == hashlib.sha256(json.dumps(test,sort_keys=True).encode()).hexdigest() and row.get('htmlSha256') == hashlib.sha256(html.read_bytes()).hexdigest() and observations_valid
        if not valid:
            errors.append(f'{page.get("url")}: interaction {identifier} failed, missing or stale; a static component label is not a working feature')
    return errors


class RenderedPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.title = []
        self.h1 = []
        self.text = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag not in {'meta', 'link', 'img', 'br', 'hr', 'input', 'source', 'wbr', 'area', 'base', 'embed', 'param', 'track', 'col'}:
            self.stack.append(tag)
        if tag == 'a':
            self.links.append(dict(attrs).get('href', ''))

    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

    def handle_data(self, data):
        if {'script', 'style', 'template'} & set(self.stack):
            return
        if 'title' in self.stack:
            self.title.append(data)
        if 'h1' in self.stack:
            self.h1.append(data)
        if 'body' in self.stack:
            self.text.append(data)


def norm(text: str) -> str:
    return ' '.join(text.split())


def input_digest(root: Path, page: dict) -> str:
    """Tie review to this page's promise, plan, brief and evidence, not approval flag."""
    hasher = hashlib.sha256()
    hasher.update(json.dumps({k:v for k,v in page.items() if k != 'renderReview'}, sort_keys=True, ensure_ascii=False).encode())
    for relative in ('requirements/site-plan.json', 'content/page-briefs.json', f'content/evidence/{page.get("id")}.json'):
        path = local_file(root, relative)
        hasher.update(path.read_bytes() if path else b'MISSING')
    site = root / 'site'
    files = set()
    for name in ('src', 'content', 'public', 'out'):
        folder = site / name
        if folder.is_dir():
            files.update(p for p in folder.rglob('*') if p.is_file() and not p.is_symlink())
    if site.is_dir():
        files.update(p for p in site.iterdir() if p.is_file() and p.suffix in {'.json', '.js', '.mjs', '.cjs', '.ts', '.yaml', '.yml'})
    files = {p for p in files if p.name != 'next-env.d.ts'}
    for path in sorted(files):
        hasher.update(path.relative_to(site).as_posix().encode())
        hasher.update(hashlib.sha256(path.read_bytes()).digest())
    return hasher.hexdigest()


def render_errors(root: Path, page: dict) -> list[str]:
    url = page.get('url')
    render = page.get('renderReview')
    if not isinstance(render, dict):
        return [f'{url}: missing rendered review; return to implementation']
    errors = []
    if render.get('inputDigest') != input_digest(root, page):
        errors.append(f'{url}: planning/brief/evidence changed or review has no inputDigest; repeat review')
    artifact = local_file(root, render.get('html'))
    if artifact is None:
        return [f'{url}: rendered HTML missing']
    expected = (root / 'site/out' / str(url).strip('/') / 'index.html').resolve()
    flat = (root / 'site/out' / (str(url).strip('/') + '.html')).resolve()
    if artifact not in {expected, flat}:
        errors.append(f'{url}: review HTML must be this route in site/out, not a detached sample')
    if hashlib.sha256(artifact.read_bytes()).hexdigest() != render.get('sha256'):
        errors.append(f'{url}: rendered HTML changed; repeat review')
    text = artifact.read_text(encoding='utf-8', errors='replace')
    parsed = RenderedPage()
    parsed.feed(text)
    actual = {'titleText': norm(''.join(parsed.title)), 'h1Text': norm(''.join(parsed.h1)), 'quickAnswerText': norm(' '.join(parsed.text))}
    for key in ('titleText', 'h1Text', 'quickAnswerText'):
        value = render.get(key)
        if not useful(value) or (norm(value) not in actual[key] if key == 'quickAnswerText' else norm(value) != actual[key]):
            errors.append(f'{url}: {key} absent from rendered page')
    answer_locations = render.get('answerLocations')
    for question in page.get('requiredEvidence') or []:
        excerpt = answer_locations.get(question) if isinstance(answer_locations, dict) else None
        if not useful(excerpt) or norm(excerpt) not in actual['quickAnswerText']:
            errors.append(f'{url}: core question has no visible answer: {question}')
    try:
        evidence = read_object(root / f'content/evidence/{page.get("id")}.json')
        coverage = evidence.get('coverage', [])
        for question in page.get('requiredEvidence') or []:
            source_urls = {source.get('url') for row in coverage if isinstance(row,dict) and row.get('requirement') == question for source in row.get('sources',[]) if isinstance(source,dict) and isinstance(source.get('url'),str)}
            if not source_urls.intersection(parsed.links):
                errors.append(f'{url}: no clickable supporting source for {question}; a plain source name is not a citation')
    except (OSError, ValueError, TypeError):
        errors.append(f'{url}: cannot resolve rendered source citations')
    for key in ('taskResult', 'evidenceReview', 'layoutReason'):
        if not useful(render.get(key)):
            errors.append(f'{url}: describe observed {key}, not approved=true')
    for width in ('1440', '390'):
        shot = render.get('screenshots', {}).get(width) if isinstance(render.get('screenshots'), dict) else None
        if not isinstance(shot, dict):
            errors.append(f'{url}: missing {width}px screenshot')
            continue
        file = local_file(root, shot.get('file'))
        if file is None or hashlib.sha256(file.read_bytes()).hexdigest() != shot.get('sha256'):
            errors.append(f'{url}: {width}px screenshot missing or changed')
        elif file.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n' or len(file.read_bytes()) < 33:
            errors.append(f'{url}: screenshot is not a PNG image')
        else:
            image_width, image_height = struct.unpack('>II', file.read_bytes()[16:24])
            if image_width != int(width) or image_height < 1:
                errors.append(f'{url}: screenshot dimensions do not match {width}px viewport')
    try:
        observations = read_object(root / 'audit/render-results.json').get('results', [])
    except (ValueError, OSError):
        observations = []
    if not isinstance(observations, list):
        observations = []
    for width in (1440, 390):
        matches = [row for row in observations if isinstance(row,dict) and row.get('url') == url and row.get('width') == width]
        valid = len(matches) == 1
        if valid:
            row = matches[0]
            valid = row.get('passed') is True and row.get('inputDigest') == input_digest(root,page) and row.get('htmlSha256') == render.get('sha256') and row.get('screenshot') == (render.get('screenshots') or {}).get(str(width))
        if not valid:
            errors.append(f'{url}: missing/failed/stale {width}px browser observation; run probe-delivery-render.py')
    return errors

