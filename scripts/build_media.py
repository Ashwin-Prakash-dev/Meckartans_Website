#!/usr/bin/env python3
"""Build every image the site uses from Meckartans_Gallery + the requirements PDF.

Outputs (public/media/...):
  gallery/<id>-s.webp, gallery/<id>-l.webp   grid thumbnail (720w) + lightbox size (2000px long edge)
  vehicles/<slug>.webp, vehicles/<slug>-s.webp
  hero/<name>.webp                           full-bleed page backgrounds (2400w)
  team/<slug>.webp                           square portraits cropped from the brief's team images
  brand/logo-light.png, brand/logo-mark.png  logo recoloured for the dark theme (black -> white, red kept)
and src/content/gallery.json (category, size, vehicle label per photo).

Run from meckartans-web/:  python scripts/build_media.py
Categories are assigned by hand below (checked on contact sheets made by scripts/inventory.py).
"""
import json, os
from PIL import Image, ImageOps

APP = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GAL = os.path.join(APP, "..", "Meckartans_Gallery")
PDF_IMG = os.environ.get("PDF_IMG_DIR", "")  # folder with images extracted from "Meckartans Website.pdf"
PUB = os.path.join(APP, "public", "media")
inv = {i["id"]: i for i in json.load(open(os.path.join(APP, "scripts", "inventory.json")))}

# ---------------------------------------------------------------- gallery categories
CATS = {
    "vehicles": [0, 44, 64, 66, 68, 92, 110, 118, 119, 131, 142, 143, 145, 148, 149, 151, 167, 186, 191],
    "manufacturing": [5, 6, 7, 9, 11, 18, 19, 20, 21, 22, 63, 113, 114, 115, 116, 117, 157, 158],
    "testing": [13, 24, 26, 41, 93, 144],
    "competitions": [2, 4, 14, 15, 16, 65, 69, 70, 71, 72, 73, 75, 77, 79, 80, 81, 83, 84, 88, 94, 95, 96, 99, 100,
                     101, 105, 106, 108, 120, 123, 124, 125, 127, 128, 129, 130, 133, 134, 135, 137, 138, 139, 140,
                     146, 147, 150, 152, 154, 155, 161, 162, 163, 164, 165, 166, 168, 169, 172, 174, 175, 184, 187,
                     188, 194, 195, 196],
    "workshops": [17, 23, 25, 33, 34, 35, 36, 38, 42, 52, 57, 61],
    "team": [3, 12, 132, 160, 185, 189, 193],
    "events": [67, 87, 111, 136, 183],
}
ROTATE = {123: 90, 172: 90, 175: 90}  # stored sideways without EXIF orientation
FEATURED = {0, 3, 12, 21, 95, 110, 146, 148, 167, 189}  # shown larger in the grid

FOLDER_LABEL = {
    "MK -EV1": "MKE1", "FMAEBuggyINTERNSHIP2019": "FMAE Buggy Internship 2019", "MK12B": "MK12B build",
}


def label_for(src):
    parts = src.split("/")
    if parts[0] == "Buggy":
        return {"MKX01": "MKX01", "MKX02": "SAE BAJA"}.get(parts[1], parts[1])
    return FOLDER_LABEL.get(parts[0], parts[0])


def load(i):
    im = ImageOps.exif_transpose(Image.open(os.path.join(GAL, inv[i]["src"]))).convert("RGB")
    if i in ROTATE:
        im = im.rotate(ROTATE[i], expand=True)
    return im


def save_webp(im, path, max_w=None, max_edge=None, q=78):
    im = im.copy()
    if max_w and im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    if max_edge and max(im.size) > max_edge:
        im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=q, method=6)
    return im.size


def build_gallery():
    out, seen = [], set()
    for cat, ids in CATS.items():
        for i in ids:
            assert i not in seen, f"photo {i} in two categories"
            seen.add(i)
            im = load(i)
            save_webp(im, f"{PUB}/gallery/{i}-s.webp", max_w=720, q=72)
            w, h = save_webp(im, f"{PUB}/gallery/{i}-l.webp", max_edge=2000, q=80)
            out.append({"id": i, "cat": cat, "w": w, "h": h, "label": label_for(inv[i]["src"]), "featured": i in FEATURED})
    # interleave categories so "All" doesn't open on 60 competition shots in a row
    by = {c: [o for o in out if o["cat"] == c] for c in CATS}
    mixed = []
    while any(by.values()):
        for c in CATS:
            take = 3 if c == "competitions" else 1
            mixed += by[c][:take]
            by[c] = by[c][take:]
    json.dump(mixed, open(os.path.join(APP, "src", "content", "gallery.json"), "w"), indent=1)
    print("gallery:", len(mixed), "photos")


# ---------------------------------------------------------------- vehicles
SLIDES = {  # official MK-series spec slides: crop their photo panel where no better photo exists
    "mk1": "MK1/MK1mkseries.jpg", "mk3": "MK3/7ac0a417-6d21-425f-b6bb-e6773c2a17ee.jpg",
    "mk7": "MK7/mk7mkseries.jpg", "mk12a": "MK12A/mk12A.jpg",
}
VEHICLE_PHOTO = {"mk2": 160, "mk4": 162, "mk5": 164, "mk6": 167, "mk8": 186, "mk9": 191, "mk10": 93, "mk11": 110,
                 "mk13": 124, "mk14": 149, "mke1": 79, "mkx01": 0}


def build_vehicles():
    for slug, rel in SLIDES.items():
        im = Image.open(os.path.join(GAL, rel)).convert("RGB").resize((1080, 608))
        panel = im.crop((142, 170, 938, 438))
        panel = panel.resize((panel.width * 2, panel.height * 2), Image.LANCZOS)
        save_webp(panel, f"{PUB}/vehicles/{slug}.webp", max_w=1600)
        save_webp(panel, f"{PUB}/vehicles/{slug}-s.webp", max_w=800)
    for slug, i in VEHICLE_PHOTO.items():
        im = load(i)
        save_webp(im, f"{PUB}/vehicles/{slug}.webp", max_edge=1800)
        save_webp(im, f"{PUB}/vehicles/{slug}-s.webp", max_edge=900)
    print("vehicles:", len(SLIDES) + len(VEHICLE_PHOTO))


# ---------------------------------------------------------------- page backgrounds
HEROES = {"about": 95, "team": 189, "garage": 110, "achievements": 111, "support": 72,
          "home-1": 189, "home-2": 12, "home-3": 185, "home-4": 160, "band-build": 21, "band-track": 96}


def build_heroes():
    for name, i in HEROES.items():
        save_webp(load(i), f"{PUB}/hero/{name}.webp", max_w=2400, q=76)
    print("heroes:", len(HEROES))


# ---------------------------------------------------------------- team portraits (from the brief's images)
TEAM_CROPS = {  # file, centre x, centre y (circle radius ~120 in the source)
    "gireesh-kumaran": ("p6_1_Image11.jpg", 338, 510),
    "biju-n": ("p6_1_Image11.jpg", 758, 510),
    "priyadarshi-dutt": ("p6_1_Image11.jpg", 1178, 510),
    "asif-ahammad-h": ("p6_0_Image10.jpg", 478, 328),
    "abhijith-mohan": ("p6_0_Image10.jpg", 868, 328),
}


def build_team():
    if not PDF_IMG:
        print("team: skipped (set PDF_IMG_DIR)")
        return
    for slug, (f, cx, cy) in TEAM_CROPS.items():
        im = Image.open(os.path.join(PDF_IMG, f)).convert("RGB")
        r = 108  # stay inside the circular frame and its green ring
        crop = im.crop((cx - r, cy - r, cx + r, cy + r)).resize((432, 432), Image.LANCZOS)
        save_webp(crop, f"{PUB}/team/{slug}.webp", q=82)
    print("team:", len(TEAM_CROPS))


# ---------------------------------------------------------------- logo for the dark theme
def build_logo():
    if not PDF_IMG:
        print("logo: skipped (set PDF_IMG_DIR)")
        return
    src = Image.open(os.path.join(PDF_IMG, "p1_0_Image4.jpg")).convert("RGB")
    big = src.resize((src.width * 4, src.height * 4), Image.LANCZOS)
    out = Image.new("RGBA", big.size)
    px, po = big.load(), out.load()
    for y in range(big.height):
        for x in range(big.width):
            r, g, b = px[x, y]
            redness = r - (g + b) / 2
            if redness > 40:  # brand red: keep the colour, alpha by saturation
                a = min(255, int(redness * 2.2))
                po[x, y] = (229, 32, 46, a)
            else:  # black ink -> white; white paper -> transparent
                a = 255 - min(r, g, b)
                po[x, y] = (242, 242, 240, max(0, min(255, int((a - 18) * 1.25))))
    bbox = out.getbbox()
    out = out.crop(bbox)
    os.makedirs(f"{PUB}/brand", exist_ok=True)
    out.save(f"{PUB}/brand/logo-light.png", optimize=True)
    mark = out.copy()
    mark.thumbnail((256, 256), Image.LANCZOS)
    mark.save(f"{PUB}/brand/logo-mark.png", optimize=True)
    print("logo:", out.size)


if __name__ == "__main__":
    os.makedirs(os.path.join(APP, "src", "content"), exist_ok=True)
    build_gallery()
    build_vehicles()
    build_heroes()
    build_team()
    build_logo()
