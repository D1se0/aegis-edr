#!/usr/bin/env python3
"""Extrae la seccion de un CHANGELOG.md (formato Keep a Changelog) para una
version dada y la formatea como notas de release profesionales para GitHub.

Uso: extract-changelog-section.py <version-o-tag> [ruta-a-CHANGELOG.md]
Ejemplo: extract-changelog-section.py v0.2.0
         extract-changelog-section.py 0.2.0 CHANGELOG.md

Escribe el resultado a stdout. Si la version no aparece en el changelog,
termina sin escribir nada (exit code 0) para que el llamador pueda decidir
no tocar las notas de esa release en vez de fallar el workflow.
"""
import re
import sys
from pathlib import Path

DOCS_URL = "https://d1se0.github.io/aegis-edr/docs"
RELEASES_URL = "https://github.com/D1se0/aegis-edr/releases"


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: extract-changelog-section.py <version> [changelog]", file=sys.stderr)
        return 2

    raw_version = sys.argv[1]
    version = raw_version[1:] if raw_version.startswith("v") else raw_version
    changelog_path = Path(sys.argv[2] if len(sys.argv) > 2 else "CHANGELOG.md")

    if not changelog_path.exists():
        print(f"no existe {changelog_path}", file=sys.stderr)
        return 0

    text = changelog_path.read_text(encoding="utf-8")

    # Cada version empieza con una linea "## [X.Y.Z] - AAAA-MM-DD" (o sin fecha).
    header_re = re.compile(r"^##\s*\[?v?(?P<ver>\d+\.\d+\.\d+)\]?\s*(?:-\s*(?P<date>\S+))?\s*$", re.MULTILINE)

    matches = list(header_re.finditer(text))
    section_body = None
    section_date = None
    for i, m in enumerate(matches):
        if m.group("ver") == version:
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            section_body = text[start:end].strip("\n")
            section_date = m.group("date")
            break

    if section_body is None:
        # No hay entrada para esta version todavia: no es un error, solo no hay
        # nada que sincronizar (p.ej. un tag manual sin entrada en el changelog).
        return 0

    header = f"## Aegis EDR v{version}"
    if section_date:
        header += f" — {section_date}"

    footer = (
        "---\n\n"
        f"📖 **Documentacion completa:** {DOCS_URL}\n"
        f"🗂️ **Historial completo de cambios:** [CHANGELOG.md](https://github.com/D1se0/aegis-edr/blob/main/CHANGELOG.md)\n"
    )

    print(f"{header}\n\n{section_body}\n\n{footer}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
