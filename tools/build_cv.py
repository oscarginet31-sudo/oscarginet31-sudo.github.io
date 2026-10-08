#!/usr/bin/env python3
"""Génère les CV PDF (FR + EN) à partir de cv.html avec Chrome sans interface.

Le contenu vient de assets/js/data/content.js : modifier ce fichier puis
relancer `python3 tools/build_cv.py` suffit à mettre le CV à jour.

Le numéro de téléphone n'est PAS publié sur le site ni dans le dépôt : il est
lu dans tools/private.json (fichier local, ignoré par Git), par exemple
    {"phone": "+33 6 12 34 56 78"}
puis injecté dans une copie temporaire de cv.html, le temps de l'impression.
"""
import html
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUTPUTS = {"fr": "CV_Ginet_Oscar.pdf", "en": "CV_Ginet_Oscar_EN.pdf"}
PRIVATE = ROOT / "tools" / "private.json"
TEMP = ROOT / "cv.build.html"          # à côté de cv.html pour garder les chemins relatifs


def private_page() -> pathlib.Path:
    """Copie de cv.html avec <meta name="cv-phone"> si tools/private.json existe."""
    src = (ROOT / "cv.html").read_text(encoding="utf-8")
    phone = json.loads(PRIVATE.read_text(encoding="utf-8")).get("phone", "") if PRIVATE.exists() else ""
    if not phone:
        print("⚠ tools/private.json absent : CV généré sans numéro de téléphone")
    meta = f'<meta name="cv-phone" content="{html.escape(phone)}">' if phone else ""
    TEMP.write_text(src.replace("<head>", "<head>\n" + meta, 1), encoding="utf-8")
    return TEMP


def build(page: pathlib.Path, lang: str, out: str) -> None:
    url = page.as_uri() + f"?lang={lang}"
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--virtual-time-budget=10000", "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={ROOT / out}", url,
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    print(f"✔ {out}")


if __name__ == "__main__":
    langs = sys.argv[1:] or list(OUTPUTS)
    page = private_page()
    try:
        for lang in langs:
            build(page, lang, OUTPUTS[lang])
    finally:
        TEMP.unlink(missing_ok=True)
