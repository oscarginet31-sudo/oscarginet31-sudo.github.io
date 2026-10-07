#!/usr/bin/env python3
"""Génère les CV PDF (FR + EN) à partir de cv.html avec Chrome sans interface.

Le contenu vient de assets/js/data/content.js : modifier ce fichier puis
relancer `python3 tools/build_cv.py` suffit à mettre le CV à jour.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUTPUTS = {"fr": "CV_Ginet_Oscar.pdf", "en": "CV_Ginet_Oscar_EN.pdf"}


def build(lang: str, out: str) -> None:
    url = (ROOT / "cv.html").as_uri() + f"?lang={lang}"
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--virtual-time-budget=10000", "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={ROOT / out}", url,
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    print(f"✔ {out}")


if __name__ == "__main__":
    langs = sys.argv[1:] or list(OUTPUTS)
    for lang in langs:
        build(lang, OUTPUTS[lang])
