#!/usr/bin/env python3
"""Index every photo in Meckartans_Gallery: dedupe, drop spec slides/screenshots/documents, record size + folder.
Writes scripts/inventory.json and numbered contact sheets (for assigning gallery categories by eye)."""
import glob, hashlib, json, os, sys
from PIL import Image, ImageDraw, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GAL = os.path.join(ROOT, "Meckartans_Gallery")
OUT = os.path.dirname(os.path.abspath(__file__))
SHEETS = sys.argv[1] if len(sys.argv) > 1 else OUT

SKIP_NAME = ("mkseries", "screenshot", "untitled document", "logo", "7ac0a417")  # spec slides, phone screenshots, docs, logos
items, seen = [], {}
for f in sorted(glob.glob(os.path.join(GAL, "**", "*"), recursive=True)):
    if not f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        continue
    rel = os.path.relpath(f, GAL).replace("\\", "/")
    if any(s in rel.lower() for s in SKIP_NAME) or rel.lower() == "mk12a/mk12a.jpg":
        continue
    try:
        im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    except Exception:
        continue
    small = im.resize((16, 16)).convert("L")
    key = hashlib.md5(small.tobytes()).hexdigest()  # near-duplicate copies ("(1)", "(2)") collapse to one
    if key in seen:
        continue
    seen[key] = rel
    items.append({"id": len(items), "src": rel, "folder": rel.split("/")[0], "w": im.width, "h": im.height})

json.dump(items, open(os.path.join(OUT, "inventory.json"), "w"), indent=1)
print(len(items), "unique photos")

# contact sheets: 6 x 5 per sheet, id labels
T, C, R = 300, 6, 5
for s in range(0, len(items), C * R):
    batch = items[s : s + C * R]
    sheet = Image.new("RGB", (C * T, R * (T + 22)), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    for i, it in enumerate(batch):
        im = ImageOps.exif_transpose(Image.open(os.path.join(GAL, it["src"]))).convert("RGB")
        im.thumbnail((T - 6, T - 6))
        x, y = (i % C) * T, (i // C) * (T + 22)
        sheet.paste(im, (x + (T - im.width) // 2, y + (T - im.height) // 2))
        d.rectangle((x, y + T, x + T, y + T + 22), fill=(0, 0, 0))
        d.text((x + 4, y + T + 4), f"#{it['id']} {it['src'][:34]}", fill=(255, 220, 0))
    sheet.save(os.path.join(SHEETS, f"sheet_{s // (C * R):02d}.jpg"), quality=80)
print("sheets:", (len(items) + C * R - 1) // (C * R))
