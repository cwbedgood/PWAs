#!/usr/bin/env python3
import struct, zlib, os

def make_png(size):
    bg = (0x7c, 0x3a, 0xed, 255)  # purple #7c3aed
    fg = (255, 255, 255, 255)
    hi = (0xed, 0xe9, 0xfe, 255)  # light purple for missing piece

    pixels = [[bg] * size for _ in range(size)]

    def rect(x0, y0, x1, y1, color):
        for y in range(max(0, y0), min(size, y1)):
            for x in range(max(0, x0), min(size, x1)):
                pixels[y][x] = color

    def line(x0, y0, x1, y1, w, color):
        dx, dy = x1 - x0, y1 - y0
        length = max(abs(dx), abs(dy))
        for i in range(length + 1):
            t = i / max(length, 1)
            px = round(x0 + t * dx)
            py = round(y0 + t * dy)
            for oy in range(-w, w + 1):
                for ox in range(-w, w + 1):
                    nx, ny = px + ox, py + oy
                    if 0 <= nx < size and 0 <= ny < size:
                        pixels[ny][nx] = color

    s = size / 64

    # Outer rounded square (approximated with a plain rect + corner rounding)
    pad = round(6 * s)
    inner = size - pad * 2

    # Draw white 3x3 grid inside the icon
    gx, gy = pad, pad
    gw, gh = inner, inner
    cell = gw // 3
    lw = max(1, round(1.5 * s))

    # Fill grid background white
    rect(gx, gy, gx + gw, gy + gh, fg)

    # Draw one highlighted (missing) cell in top-right
    rect(gx + cell * 2 + lw, gy + lw, gx + gw - lw, gy + cell - lw, hi)

    # Grid lines (horizontal)
    line(gx, gy + cell, gx + gw, gy + cell, lw, bg)
    line(gx, gy + cell * 2, gx + gw, gy + cell * 2, lw, bg)

    # Grid lines (vertical)
    line(gx + cell, gy, gx + cell, gy + gh, lw, bg)
    line(gx + cell * 2, gy, gx + cell * 2, gy + gh, lw, bg)

    # Outer border
    line(gx, gy, gx + gw, gy, lw, bg)
    line(gx, gy + gh, gx + gw, gy + gh, lw, bg)
    line(gx, gy, gx, gy + gh, lw, bg)
    line(gx + gw, gy, gx + gw, gy + gh, lw, bg)

    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    raw = b''
    for row in pixels:
        raw += b'\x00' + bytes([v for px in row for v in px[:3]])
    idat = zlib.compress(raw)

    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', idat)
            + chunk(b'IEND', b''))

os.makedirs('icons', exist_ok=True)
for size in [192, 512]:
    with open(f'icons/icon-{size}.png', 'wb') as f:
        f.write(make_png(size))
    print(f'Generated icons/icon-{size}.png')
