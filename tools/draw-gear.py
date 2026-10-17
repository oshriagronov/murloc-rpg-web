"""Draws public/game/tex/Added/gear.webp, the settings icon (not in the original game).

It replaces the original's question mark and copies its look: orange with a soft glow.
Needs Pillow (on this Mac only Apple's /usr/bin/python3 has it): /usr/bin/python3 tools/draw-gear.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

# The size of the button it sits on (106 x 140), doubled, so the gear is not stretched.
W, H, SS = 212, 280, 4
cx, cy = W / 2, H / 2
teeth, outer, inner, hole = 8, 92, 70, 30


def gear_mask(scale, grow=0.0):
    img = Image.new('L', (W * scale, H * scale), 0)
    d = ImageDraw.Draw(img)
    pts = []
    step = 2 * math.pi / teeth
    base, top = step * 0.27, step * 0.17  # half-widths of a tooth at its foot and its tip
    for k in range(teeth):
        c = k * step - math.pi / 2
        for r, a in ((inner, c - base), (outer, c - top), (outer, c + top), (inner, c + base)):
            pts.append((r, a))
        # The rim between this tooth and the next, as an arc.
        for j in range(1, 6):
            pts.append((inner, c + base + (step - 2 * base) * j / 6))
    pts = [((cx + (r + grow) * math.cos(a)) * scale, (cy + (r + grow) * math.sin(a)) * scale) for r, a in pts]
    d.polygon(pts, fill=255)
    rh = (hole - grow) * scale
    if rh > 0:
        d.ellipse((cx * scale - rh, cy * scale - rh, cx * scale + rh, cy * scale + rh), fill=0)
    return img


body = gear_mask(SS).resize((W, H), Image.LANCZOS)
glow = gear_mask(1, grow=6).filter(ImageFilter.GaussianBlur(9))

out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
# The glow: a light orange haze around the shape.
out.paste(Image.new('RGBA', (W, H), (255, 140, 0, 255)), (0, 0), glow.point(lambda v: int(v * 0.8)))
# The body: deeper orange at the rim to bright yellow-orange in the middle, like the question mark.
grad = Image.new('RGBA', (W, H))
gp = grad.load()
for y in range(H):
    for x in range(W):
        t = min(1.0, math.hypot(x - cx, y - cy) / outer)
        gp[x, y] = (255, int(200 - 70 * t), int(40 - 40 * t), 255)
out.paste(grad, (0, 0), body)
# A darker edge so it reads on light backgrounds.
edge = body.filter(ImageFilter.FIND_EDGES).point(lambda v: int(v * 0.6))
out.paste(Image.new('RGBA', (W, H), (200, 80, 0, 255)), (0, 0), edge)

dst = os.path.join(os.path.dirname(__file__), '..', 'public', 'game', 'tex', 'Added', 'gear.webp')
os.makedirs(os.path.dirname(dst), exist_ok=True)
out.save(dst, 'WEBP', lossless=True)
print(dst, out.size)
