"""Build the clickable KURANT portfolio PDF from pdf/deck.html."""

from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
HTML = Path(__file__).resolve().parent / "deck.html"
OUT = ROOT / "KURANT.pdf"

BOOKMARKS = [
    ("Cover", 0),
    ("Contents", 1),
    ("Expertise", 2),
    ("Concept campaigns", 3),
    ("Lunen", 4),
    ("Voltline", 5),
    ("Kilo District", 6),
    ("Fieldpost", 7),
    ("Northroom", 8),
    ("Studies", 9),
    ("Studies, continued", 10),
    ("Motion", 11),
    ("Process", 12),
    ("Contact", 13),
]


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(HTML.as_uri(), wait_until="networkidle")
        page.evaluate("() => document.fonts.ready")
        page.emulate_media(media="print")
        page.pdf(
            path=str(OUT),
            print_background=True,
            prefer_css_page_size=True,
            outline=True,
            tagged=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()
    reader = PdfReader(str(OUT))
    writer = PdfWriter()
    writer.append(reader)
    root = writer._root_object
    if "/Outlines" in root:
        del root["/Outlines"]
    for title, page in BOOKMARKS:
        writer.add_outline_item(title, page)
    with OUT.open("wb") as handle:
        writer.write(handle)
    print(OUT)


if __name__ == "__main__":
    main()
