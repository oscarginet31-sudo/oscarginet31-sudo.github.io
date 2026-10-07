#!/usr/bin/env python3
"""Pré-rend le mode classique et l'étude de cas en HTML statique (référencement).

Les pages sont construites en JavaScript depuis assets/js/data/*.js. Ce script
les ouvre dans Chrome sans interface avec ?prerender, récupère le HTML final
publié par PF.prerender() et l'injecte dans le fichier source, entre des
marqueurs <!--prerender:id--> … <!--/prerender:id-->. Moteurs de recherche,
aperçus LinkedIn et navigateurs sans JS lisent alors tout le contenu ; avec JS,
la page se rend comme avant par-dessus.

À relancer après chaque modification du contenu :
    python3 tools/prerender.py
"""
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGES = ["classic.html", "etude-edr.html"]
PAYLOAD = re.compile(r'<script type="application/json" id="__prerender">(.*?)</script>', re.S)


def render(page: str) -> dict:
    url = (ROOT / page).as_uri() + "?prerender"
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", url]
    dom = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120).stdout
    m = PAYLOAD.search(dom)
    if not m:
        raise SystemExit(f"✘ {page} : pas de bloc __prerender (erreur JS ?)")
    return json.loads(m.group(1))   # le texte d'un <script> est sérialisé tel quel


def inject(src: str, ident: str, inner: str) -> str:
    block = f"<!--prerender:{ident}-->{inner}<!--/prerender:{ident}-->"
    done = re.compile(rf"<!--prerender:{re.escape(ident)}-->.*?<!--/prerender:{re.escape(ident)}-->", re.S)
    if done.search(src):
        return done.sub(lambda _: block, src, count=1)
    empty = re.compile(rf'(<(\w+)\b[^>]*\bid="{re.escape(ident)}"[^>]*>)\s*(</\2>)')
    if not empty.search(src):
        raise SystemExit(f"✘ #{ident} introuvable (ou non vide sans marqueurs)")
    return empty.sub(lambda m: m.group(1) + block + m.group(3), src, count=1)


if __name__ == "__main__":
    for page in PAGES:
        blocks = render(page)
        path = ROOT / page
        src = path.read_text(encoding="utf-8")
        for ident, inner in blocks.items():
            src = inject(src, ident, inner)
        path.write_text(src, encoding="utf-8")
        size = sum(len(v) for v in blocks.values())
        print(f"✔ {page} : {len(blocks)} blocs, {size // 1024} Ko de HTML")
