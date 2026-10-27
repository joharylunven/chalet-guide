#!/usr/bin/env python3
"""Génère les icônes PNG de la PWA (même dessin que public/favicon.svg).

Usage : python3 scripts/make_icons.py   (nécessite Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public"
FOREST = (31, 58, 46)
SNOW = (232, 220, 196)
WOOD = (181, 101, 43)


def draw(size: int, maskable: bool) -> Image.Image:
    # Grille de 64 unités, comme le SVG. Une icône « maskable » garde le
    # dessin dans la zone sûre centrale (80 %) et remplit tout le carré.
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 64
    if maskable:
        d.rectangle([0, 0, size, size], fill=FOREST)
        scale, off = 0.72, size * 0.14
    else:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=14 * s, fill=FOREST)
        scale, off = 1.0, 0

    def p(x: float, y: float) -> tuple[float, float]:
        return (off + x * s * scale, off + y * s * scale)

    d.polygon([p(12, 44), p(32, 18), p(52, 44)], fill=SNOW)
    d.rectangle([p(26, 34), p(38, 44)], fill=WOOD)
    d.line([p(8, 48), p(56, 48)], fill=SNOW, width=max(2, round(3 * s * scale)))
    return img


def main() -> None:
    for name, size, maskable in [
        ("pwa-192.png", 192, False),
        ("pwa-512.png", 512, False),
        ("pwa-maskable-512.png", 512, True),
        ("apple-touch-icon.png", 180, True),
    ]:
        draw(size, maskable).save(OUT / name)
        print(f"{name} ({size}px)")


if __name__ == "__main__":
    main()
