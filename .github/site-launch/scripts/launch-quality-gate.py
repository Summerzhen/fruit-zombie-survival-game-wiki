from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_WIDTHS = {390, 1440, 1920}
REQUIRED_VISUAL_CHECKS = {
    "primaryTaskVisible",
    "noOversizedHeadline",
    "noDarkHeroObstruction",
    "noLowResolutionUpscale",
    "navigationComplete",
    "noOverlap",
}
FORBIDDEN_SOURCE_PHRASES = {
    "00:00": "placeholder timestamp",
    "google suggest demand": "internal SEO note",
    "gameplay review": "internal editorial note",
    "launch build": "internal launch note",
    "route evidence": "internal production language",
    "should be added later": "placeholder copy",
    "should treat": "internal site-planning copy",
    "data model": "internal data-model copy",
    "launch use": "internal launch-planning copy",
    "source trail": "internal evidence-workflow copy",
    "evidence-backed facts": "internal evidence-workflow heading",
    "records that will be expanded": "future database placeholder copy",
    "after direct in-game capture": "future evidence placeholder copy",
    "approved site plan": "internal planning approval",
    "approved plan": "internal planning approval",
    "page evidence package": "internal evidence package label",
    "content/evidence/": "internal evidence path",
    "source checks": "internal source-check SOP heading",
    "freshness": "internal freshness SOP wording",
    "required sections": "internal brief/planning heading",
    "worked example": "internal prompt/example heading",
    "page structure": "internal page-brief heading",
    "source check": "internal source-check SOP heading",
    "required evidence": "internal evidence contract heading",
    "fact gate": "internal QA gate wording",
    "quality gate": "internal QA gate wording",
}
DATA_PAGE_TYPE_PATTERN = re.compile(r"\b(?:database|data-grid|catalog|directory|interactive-map|tracker|update-tracker)\b", re.I)
PUBLIC_EXTENSIONS = {".tsx", ".jsx", ".html", ".md", ".mdx", ".json", ".txt"}
PUZZLE_TERMS = re.compile(r"\b(puzzle|solution|walkthrough|guide|answer|clue|sequence|order)\b", re.I)
WEATHER_TERMS = re.compile(r"\b(weather|rain|sun|sunny|storm|stormy|cloud|cloudy|wind|snow|fog|forecast)\b", re.I)
CHESS_TERMS = re.compile(r"\b(chess|king|queen|bishop|knight|rook|pawn|checkmate)\b", re.I)
ARCHIVE_TERMS = re.compile(r"\b(archive|all posts|older posts|all answers|related guides|recent posts|categories)\b", re.I)
ROBLOX_GAME_MARKERS = (
    "roblox", "experience", "simulator", "obby", "tycoon", "drive", "vehicle", "scooter",
    "罗布乐思", "游戏体验", "模拟器", "驾驶", "载具", "滑板车",
)
LOW_VALUE_GAME_VERIFIER_MARKERS = (
    "official link", "official roblox", "creator", "place id", "universe id", "beta status",
    "correct experience", "correct roblox experience", "real roblox experience", "verify official", "status card", "created date",
    "updated date", "official title", "source-dated facts", "last checked",
    "官方链接", "创作者", "宇宙 id", "地点 id", "测试状态", "官方页面", "确认游戏",
)
PLAYER_GAMEPLAY_MARKER_GROUPS = {
    "controls": ("control", "controls", "bind", "keybind", "mobile", "console", "pc", "按键", "键位", "操作"),
    "beginner": ("how to play", "beginner", "start playing", "first steps", "新手", "入门", "怎么玩"),
    "mechanics": ("mechanic", "mechanics", "physics", "brake", "steer", "wheelie", "first-person", "机制", "物理", "刹车", "翘头"),
    "vehicles": ("scooter", "vehicle", "vehicles", "fastest", "stats", "model", "载具", "车辆", "滑板车", "最快"),
    "progression": ("money", "cash", "unlock", "reward", "progression", "quest", "赚钱", "金币", "解锁", "奖励", "进度"),
    "fresh": ("codes", "update", "updates", "patch", "changelog", "event", "兑换码", "更新", "补丁", "活动"),
    "map": ("map", "location", "route", "area", "地图", "位置", "路线", "区域"),
}


def load_json(path: Path, errors: list[str]) -> dict:
    if not path.is_file():
        errors.append(f"missing {path.as_posix()}")
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        errors.append(f"invalid JSON: {path.as_posix()}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"expected object: {path.as_posix()}")
        return {}
    return value


def publish_gate_passed(value: object) -> bool:
    if value is True:
        return True
    if not isinstance(value, dict):
        return False
    return value.get("passed") is True or str(value.get("status") or "").lower() in {"passed", "ready", "verified"}


def public_text(site: Path) -> str:
    chunks: list[str] = []
    for _path, text in public_files(site):
        chunks.append(text)
    return "\n".join(chunks)


def public_files(site: Path) -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    for root_name in ("src", "content", "out"):
        root = site / root_name
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in PUBLIC_EXTENSIONS:
                continue
            relative = path.relative_to(site).as_posix()
            if relative.startswith("out/_next/"):
                continue
            files.append((path, path.read_text(encoding="utf-8", errors="ignore")))
    return files


def route_for_html(out: Path, html: Path) -> str:
    relative = html.relative_to(out).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[:-10].strip("/") + "/"
    return "/" + relative[:-5].strip("/") + "/"


def canonical_path(text: str) -> str:
    for tag in re.findall(r"<link\b[^>]*>", text, re.I):
        if not re.search(r"\brel=[\"']canonical[\"']", tag, re.I):
            continue
        match = re.search(r"\bhref=[\"']https?://[^/]+([^\"']*)[\"']", tag, re.I)
        if match:
            return match.group(1) or "/"
    return ""


def duplicate_overview_errors(site: Path) -> list[str]:
    out = site / "out"
    if not out.is_dir():
        return []
    pages = {route_for_html(out, path): path for path in out.rglob("index.html")}
    failures: list[str] = []
    for route, path in pages.items():
        if not route.endswith("/overview/"):
            continue
        parent = route[:-len("overview/")]
        if parent not in pages:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        noindex = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex', text, re.I)
        canonical = canonical_path(text)
        if not noindex and canonical not in {parent, parent.rstrip("/")}:
            failures.append(f"duplicate indexable overview route: {parent} and {route}")
    return failures


def html_heading_errors(site: Path) -> list[str]:
    out = site / "out"
    if not out.is_dir():
        return []
    failures: list[str] = []
    for path in out.rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex', text, re.I):
            continue
        h1_count = len(re.findall(r"<h1\b", text, re.I))
        if h1_count != 1:
            route = route_for_html(out, path)
            failures.append(f"indexable route must contain exactly one H1: {route} has {h1_count}")
    return failures




def without_related_sections(text: str) -> str:
    return re.split(r'(?im)^\s*(?:##\s+)?Related Guides\b', text)[0]

def strip_markup(text: str) -> str:
    text = re.sub(r"<script\b.*?</script>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def named_block_text(html_text: str, tag: str) -> str:
    matches = re.findall(rf"<{tag}\b[^>]*>(.*?)</{tag}>", html_text, flags=re.I | re.S)
    return " ".join(strip_markup(match) for match in matches)


def fact_conflict_errors(site: Path) -> list[str]:
    failures: list[str] = []
    for path, text in public_files(site):
        relative = path.relative_to(site).as_posix()
        lowered_path = relative.lower()
        fact_text = without_related_sections(text)
        if "weather" in lowered_path and CHESS_TERMS.search(fact_text):
            failures.append(f"weather page appears to contain chess facts: {relative}")
        if "chess" in lowered_path and WEATHER_TERMS.search(fact_text):
            failures.append(f"chess page appears to contain weather facts: {relative}")
        if "all-answers" in lowered_path or "answers" in lowered_path or "category" in lowered_path:
            if re.search(r"Weather\s*/\s*Chess|Chess\s*/\s*Weather", text, re.I):
                failures.append(f"aggregation page merges weather and chess in one label: {relative}")
            for line in text.splitlines():
                if WEATHER_TERMS.search(line) and CHESS_TERMS.search(line):
                    failures.append(f"aggregation row appears to mix weather and chess facts: {relative}")
                    break
    return failures


def archive_weight_errors(site: Path) -> list[str]:
    out = site / "out"
    if not out.is_dir():
        return []
    failures: list[str] = []
    for path in out.rglob("*.html"):
        relative = path.relative_to(out).as_posix()
        if relative == "index.html":
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        main_text = named_block_text(text, "main") or named_block_text(text, "article")
        archive_text = " ".join(
            part
            for part in (
                named_block_text(text, "footer"),
                named_block_text(text, "aside"),
                " ".join(strip_markup(match) for match in re.findall(r"<nav\b[^>]*>.*?</nav>", text, flags=re.I | re.S) if ARCHIVE_TERMS.search(match)),
            )
            if part
        )
        main_len = len(main_text)
        archive_len = len(archive_text)
        if main_len and archive_len > max(1200, int(main_len * 0.65)):
            route = route_for_html(out, path)
            failures.append(f"archive/footer weight exceeds article body on {route}: body={main_len} archive_footer={archive_len}")
    return failures


def iter_json_values(value: Any) -> list[Any]:
    values = [value]
    if isinstance(value, dict):
        for child in value.values():
            values.extend(iter_json_values(child))
    elif isinstance(value, list):
        for child in value:
            values.extend(iter_json_values(child))
    return values


def read_optional_json(path: Path) -> Any | None:
    if not path.is_file():
        return None


def gameplay_groups(text: str) -> set[str]:
    lowered = text.lower()
    return {
        group
        for group, markers in PLAYER_GAMEPLAY_MARKER_GROUPS.items()
        if any(marker in lowered for marker in markers)
    }


def is_low_value_game_verifier(text: str) -> bool:
    lowered = text.lower()
    if not any(marker in lowered for marker in LOW_VALUE_GAME_VERIFIER_MARKERS):
        return False
    groups = gameplay_groups(lowered)
    if not groups:
        return True
    return groups <= {"fresh"} and any(
        marker in lowered
        for marker in ("updated date", "created date", "beta status", "last checked", "status card")
    )


def is_roblox_game_guide_site(source: str, completeness: dict[str, Any]) -> bool:
    text = (source + " " + json.dumps(completeness, ensure_ascii=False)).lower()
    guide_like = any(marker in text for marker in ("guide", "wiki", "walkthrough", "攻略", "指南"))
    return guide_like and any(marker in text for marker in ROBLOX_GAME_MARKERS)


def gameplay_information_gain_errors(source: str, completeness: dict[str, Any]) -> list[str]:
    if not is_roblox_game_guide_site(source, completeness):
        return []
    pages = completeness.get("pages")
    if not isinstance(pages, list):
        return []
    errors: list[str] = []
    all_player_groups: set[str] = set()
    low_value_pages: list[str] = []
    for page in pages:
        if not isinstance(page, dict) or page.get("indexable") is False:
            continue
        url = str(page.get("url") or "")
        facts = page.get("uniqueFacts")
        fact_text = " ".join(str(item) for item in facts) if isinstance(facts, list) else str(facts or "")
        page_text = " ".join(
            str(page.get(key) or "")
            for key in ("url", "primaryIntent", "pageType", "tier", "quickAnswer")
        )
        combined = f"{page_text} {fact_text}".lower()
        page_groups = gameplay_groups(combined)
        all_player_groups.update(page_groups)
        if is_low_value_game_verifier(combined):
            low_value_pages.append(url or f"page-{len(low_value_pages) + 1}")
    if len(all_player_groups) < 3:
        errors.append(
            "Roblox/game guide launch content must cover at least three player task groups "
            "(controls, beginner, mechanics, vehicles, progression, updates/codes, map)"
        )
    if len(low_value_pages) >= 2:
        errors.append(
            "Roblox/game guide has multiple indexable low-information verification pages: "
            + ", ".join(low_value_pages[:6])
        )
    return errors
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, UnicodeDecodeError, OSError):
        return None


def has_answer_candidate(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    answer = value.get("answer_candidate", value.get("answerCandidate"))
    source_url = value.get("source_url", value.get("sourceUrl"))
    confidence = value.get("confidence")
    return bool(answer) and bool(source_url) and confidence not in (None, "")


def seoscout_fact_gate_errors(site: Path) -> list[str]:
    payload = read_optional_json(site / "evidence/serp-competitors.json")
    if payload is None:
        return []
    failures: list[str] = []
    if isinstance(payload, dict) and payload.get("status") == "ok":
        competitors = payload.get("competitors")
        if not isinstance(competitors, list) or not competitors:
            failures.append("SERP Fact Gate requires non-empty competitors")
        puzzle_like = []
        answer_rows = []
        for row in competitors or []:
            if not isinstance(row, dict):
                continue
            row_text = json.dumps(row, ensure_ascii=False)
            if PUZZLE_TERMS.search(row_text):
                puzzle_like.append(row)
            if has_answer_candidate(row) or any(has_answer_candidate(child) for child in iter_json_values(row)):
                answer_rows.append(row)
        if puzzle_like and not answer_rows:
            failures.append("SERP Fact Gate requires puzzle/answer rows to include answer_candidate, source_url and confidence")
    elif isinstance(payload, dict):
        failures.append(f"SERP Fact Gate failed status: {payload.get('status') or 'missing'}")

    evidence_root = site / "content" / "evidence"
    for evidence_path in (evidence_root.glob("*.json") if evidence_root.is_dir() else []):
        evidence = read_optional_json(evidence_path)
        if evidence is None:
            continue
        for value in iter_json_values(evidence):
            if not isinstance(value, dict) or not value.get("puzzle_id"):
                continue
            missing = [key for key in ("answer_candidate", "source_url", "confidence") if value.get(key) in (None, "")]
            if missing:
                failures.append(f"puzzle evidence missing {', '.join(missing)}: {evidence_path.relative_to(site).as_posix()} puzzle_id={value.get('puzzle_id')}")
    return failures


def validate(site: Path) -> list[str]:
    errors: list[str] = []
    visual_language = load_json(site / "src/config/game-visual-language.json", errors)
    completeness = load_json(site / "audit/content-completeness.json", errors)
    visual_qa = load_json(site / "audit/visual-qa.json", errors)

    for key in ("sourceEvidence", "palette", "typography", "motifs", "forbiddenPatterns", "heroAssetRules"):
        if not visual_language.get(key):
            errors.append(f"game visual language missing {key}")

    pages = completeness.get("pages")
    if not isinstance(pages, list) or not pages:
        errors.append("content completeness must list pages")
    else:
        seen_intents: dict[str, str] = {}
        for index, page in enumerate(pages):
            if not isinstance(page, dict):
                errors.append(f"content page {index} must be an object")
                continue
            for key in ("url", "primaryIntent", "pageType", "tier", "evidenceStatus", "uniqueFacts", "indexable"):
                if page.get(key) in (None, "", []):
                    errors.append(f"content page {index} missing {key}")
            intent = str(page.get("primaryIntent") or "").strip().lower()
            url = str(page.get("url") or "")
            if page.get("indexable") is not False and intent and intent in seen_intents:
                errors.append(f"duplicate primary intent: {intent} ({seen_intents[intent]} and {url})")
            elif page.get("indexable") is not False and intent:
                seen_intents[intent] = url
            if page.get("evidenceStatus") == "verified" and not page.get("evidenceRefs"):
                errors.append(f"verified page lacks evidenceRefs: {url}")
            if page.get("tier") == "answer" and not page.get("quickAnswer"):
                errors.append(f"answer page lacks quickAnswer: {url}")
            if page.get("timestamp") in ("00:00", "0:00", 0):
                errors.append(f"placeholder timestamp is forbidden: {url}")
            page_type = str(page.get("pageType") or "").lower()
            if DATA_PAGE_TYPE_PATTERN.search(page_type) and page.get("indexable") is not False:
                contract = page.get("dataContract")
                if not isinstance(contract, dict):
                    errors.append(f"data page lacks dataContract: {url}")
                else:
                    count = contract.get("observedEntityCount")
                    if not isinstance(count, int) or isinstance(count, bool) or count < 1:
                        errors.append(f"data page has no observed entities: {url}")
                    if not contract.get("requiredFields"):
                        errors.append(f"data page lacks requiredFields: {url}")
                    if not contract.get("entityEvidenceRefs"):
                        errors.append(f"data page lacks entityEvidenceRefs: {url}")
                    if not publish_gate_passed(contract.get("publishGate")):
                        errors.append(f"data page publish gate is not passed: {url}")

    screenshots = visual_qa.get("screenshots")
    if visual_qa.get("approved") is not True:
        errors.append("visual QA is not approved")
    widths: set[int] = set()
    has_inner_page = False
    if not isinstance(screenshots, list) or not screenshots:
        errors.append("visual QA must list screenshots")
    else:
        referenced_screenshots: set[Path] = set()
        newest_referenced_mtime = 0.0
        for index, shot in enumerate(screenshots):
            if not isinstance(shot, dict):
                errors.append(f"screenshot {index} must be an object")
                continue
            width = int(shot.get("width") or 0)
            widths.add(width)
            route = str(shot.get("route") or "")
            has_inner_page = has_inner_page or route not in {"", "/"}
            rel = str(shot.get("file") or "")
            path = site / rel
            if not rel or not path.is_file():
                errors.append(f"missing screenshot file: {rel or index}")
                continue
            referenced_screenshots.add(path.resolve())
            newest_referenced_mtime = max(newest_referenced_mtime, path.stat().st_mtime)
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != shot.get("sha256"):
                errors.append(f"screenshot hash mismatch: {rel}")
            checks = shot.get("checks") or {}
            for check in REQUIRED_VISUAL_CHECKS:
                if checks.get(check) is not True:
                    errors.append(f"screenshot {rel} failed or omitted {check}")
        screenshot_dir = site / "audit/screenshots"
        if screenshot_dir.is_dir() and newest_referenced_mtime:
            for path in screenshot_dir.glob("*.png"):
                if path.resolve() in referenced_screenshots:
                    continue
                if path.stat().st_mtime > newest_referenced_mtime + 60:
                    errors.append(
                        f"newer unregistered visual QA screenshot exists: {path.relative_to(site).as_posix()}; "
                        "update audit/visual-qa.json after manual/browser review"
                    )
    for width in sorted(REQUIRED_WIDTHS - widths):
        errors.append(f"missing required screenshot width: {width}")
    if not has_inner_page:
        errors.append("visual QA requires at least one inner-page screenshot")

    source = public_text(site)
    errors.extend(gameplay_information_gain_errors(source, completeness))
    for selector in ("data-primary-task", "data-quick-answer"):
        if selector not in source:
            errors.append(f"site source missing stable selector: {selector}")
    lowered_source = source.lower()
    for phrase, reason in FORBIDDEN_SOURCE_PHRASES.items():
        if phrase in lowered_source:
            errors.append(f"site source contains {reason}: {phrase}")
    if re.search(r"(?:[A-Z]:[\\/](?:Users|home)[\\/]|/(?:home|Users)/)", source, re.I):
        errors.append("site source contains a local filesystem path")
    errors.extend(duplicate_overview_errors(site))
    errors.extend(html_heading_errors(site))
    errors.extend(fact_conflict_errors(site))
    errors.extend(archive_weight_errors(site))
    errors.extend(seoscout_fact_gate_errors(site))
    return errors


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: launch-quality-gate.py <site-dir>")
    failures = validate(Path(sys.argv[1]).resolve())
    print(json.dumps({"passed": not failures, "errors": failures}, ensure_ascii=False, indent=2))
    raise SystemExit(bool(failures))
