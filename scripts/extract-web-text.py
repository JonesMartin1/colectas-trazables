from html.parser import HTMLParser
from pathlib import Path
import sys
import json
import re

sys.stdout.reconfigure(encoding="utf-8")

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.strings = set()

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "svg"):
            self.skip += 1
        for key, value in attrs:
            if key in ("placeholder", "title", "aria-label", "alt", "content") and value and key != "content":
                self.strings.add(" ".join(value.split()))

    def handle_endtag(self, tag):
        if tag in ("script", "style", "svg") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            value = " ".join(data.split())
            if value and any(c.isalpha() for c in value):
                self.strings.add(value)

keys = set()
if "--missing" in sys.argv:
    source = Path("web/i18n.js").read_text(encoding="utf-8")
    keys = {json.loads('"' + match + '"') for match in re.findall(r'^\s*"((?:\\.|[^"\\])*)"\s*:', source, re.M)}

for file in sorted(Path("web").glob("*.html")):
    parser = Extractor()
    parser.feed(file.read_text(encoding="utf-8"))
    selected = parser.strings - keys if "--missing" in sys.argv else parser.strings
    print(f"\n## {file.name} ({len(selected)})")
    for value in sorted(selected):
        print(value)
