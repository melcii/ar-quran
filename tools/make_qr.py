"""Make a printable QR code for every scene listed in web/scenes.json.

Each code holds a web link such as
https://melcii.github.io/ar-quran/scene.html?id=noah-ark
The AR Quran app reads the scene id from the link and opens the scene built into the app.
Any other phone can open the same link in its browser (once GitHub Pages is switched on).

Usage:
    pip install -r tools/requirements.txt
    python tools/make_qr.py [--base-url URL]
"""

import argparse
import html
import json
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BASE_URL = "https://melcii.github.io/ar-quran/"


def scene_url(base_url, scene_id):
    return f"{base_url.rstrip('/')}/scene.html?id={scene_id}"


def load_font(size):
    for name in ("DejaVuSans-Bold.ttf", "Arial Bold.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_card(scene, url):
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=16, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    code = qr.make_image(fill_color="#2b2340", back_color="white").convert("RGB")

    label_height = 120
    card = Image.new("RGB", (code.width, code.height + label_height), "white")
    card.paste(code, (0, 0))
    draw = ImageDraw.Draw(card)
    for text, size, y in ((scene["title"], 40, code.height + 5), (scene["surah"], 30, code.height + 60)):
        font = load_font(size)
        width = draw.textlength(text, font=font)
        draw.text(((card.width - width) / 2, y), text, fill="#2b2340", font=font)
    return card


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="where the web viewer is hosted")
    parser.add_argument("--out", default=ROOT / "qr", type=Path, help="output folder")
    args = parser.parse_args()

    scenes = json.loads((ROOT / "web" / "scenes.json").read_text(encoding="utf-8"))
    args.out.mkdir(parents=True, exist_ok=True)

    cards = []
    for scene in scenes:
        url = scene_url(args.base_url, scene["id"])
        make_card(scene, url).save(args.out / f"{scene['id']}.png")
        cards.append(
            f'<figure><img src="{scene["id"]}.png" alt="QR code for {html.escape(scene["title"])}">'
            f"<figcaption>{html.escape(url)}</figcaption></figure>"
        )
        print(f"{scene['id']}: {url}")

    (args.out / "print-sheet.html").write_text(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>AR Quran QR codes</title>"
        "<style>body{font-family:sans-serif;display:flex;flex-wrap:wrap;gap:24px;padding:24px}"
        "figure{margin:0;width:6cm;text-align:center}img{width:100%}"
        "figcaption{font-size:8pt;color:#777;word-break:break-all}</style></head><body>"
        + "".join(cards)
        + "</body></html>\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
