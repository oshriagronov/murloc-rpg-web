#!/usr/bin/env python3
"""Side-by-side pictures of this version and the Unity build, for comparing looks.

    python3 tools/compare.py serve [folder]          receive pictures (default folder: ./shots)
    python3 tools/compare.py sheet out name:x,y,w,h[:zoom] ...

`serve` listens on http://127.0.0.1:8799 and saves what the two games post to it:
`dev.shot('menu')` in this version writes t_menu.png, `u.shot('menu')` in the Unity build
(tools/unity-console.js) writes u_menu.png. Give both the same window size first, or the
two are not comparable: Unity lays text out in whole screen pixels.

`sheet` cuts the same rectangle (in 852x480 game coordinates) out of both pictures of each
name and writes sheet_<out>.png with one row per rectangle: Unity left, this version right.

Needs Pillow for `sheet` (python3 -m pip install pillow).
"""
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer


def serve(folder):
    os.makedirs(folder, exist_ok=True)

    class Handler(BaseHTTPRequestHandler):
        def cors(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.send_header('Access-Control-Allow-Private-Network', 'true')

        def do_OPTIONS(self):
            self.send_response(204); self.cors(); self.end_headers()

        def do_POST(self):
            name = re.sub(r'[^A-Za-z0-9_.-]', '_', self.path.strip('/')) or 'shot'
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            with open(os.path.join(folder, name + '.png'), 'wb') as f:
                f.write(body)
            self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'ok')

        def log_message(self, *args):
            pass

    print(f'Saving pictures to {folder}')
    HTTPServer(('127.0.0.1', 8799), Handler).serve_forever()


def sheet(folder, out, specs):
    from PIL import Image
    rows = []
    for spec in specs:
        parts = spec.split(':')
        x, y, w, h = [float(v) for v in parts[1].split(',')]
        zoom = float(parts[2]) if len(parts) > 2 else 700 / w
        pair = []
        for side in ('u', 't'):
            picture = Image.open(os.path.join(folder, f'{side}_{parts[0]}.png')).convert('RGB')
            k = picture.width / 852
            picture = picture.crop((round(x * k), round(y * k), round((x + w) * k), round((y + h) * k)))
            pair.append(picture.resize((round(w * zoom), round(h * zoom)), Image.LANCZOS))
        rows.append(pair)
    width = max(pair[0].width for pair in rows) * 2 + 6
    result = Image.new('RGB', (width, sum(pair[0].height + 6 for pair in rows)), (255, 0, 255))
    top = 0
    for unity, ours in rows:
        result.paste(unity, (0, top)); result.paste(ours, (unity.width + 6, top)); top += unity.height + 6
    path = os.path.join(folder, f'sheet_{out}.png')
    result.save(path)
    print(path, result.size)


if __name__ == '__main__':
    folder = os.environ.get('SHOTS', 'shots')
    if len(sys.argv) > 1 and sys.argv[1] == 'serve':
        serve(sys.argv[2] if len(sys.argv) > 2 else folder)
    elif len(sys.argv) > 3 and sys.argv[1] == 'sheet':
        sheet(folder, sys.argv[2], sys.argv[3:])
    else:
        print(__doc__)
