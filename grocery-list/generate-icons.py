#!/usr/bin/env python3
import struct, zlib, os

def make_png(size):
    bg = (0x2d, 0x9e, 0x5f, 255)
    fg = (255, 255, 255, 255)

    pixels = [[bg] * size for _ in range(size)]

    def circle(cx, cy, r, color):
        for y in range(size):
            for x in range(size):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2:
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

    # Cart handle
    line(round(8*s), round(14*s), round(14*s), round(22*s), round(2*s), fg)
    # Cart basket outline
    line(round(14*s), round(22*s), round(53*s), round(22*s), round(2*s), fg)
    line(round(53*s), round(22*s), round(49*s), round(43*s), round(2*s), fg)
    line(round(49*s), round(43*s), round(17*s), round(43*s), round(2*s), fg)
    line(round(17*s), round(43*s), round(14*s), round(22*s), round(2*s), fg)
    # Vertical dividers
    line(round(27*s), round(27*s), round(26*s), round(39*s), round(1*s), fg)
    line(round(38*s), round(26*s), round(37*s), round(40*s), round(1*s), fg)
    # Wheels
    circle(round(23*s), round(50*s), round(5*s), fg)
    circle(round(43*s), round(50*s), round(5*s), fg)

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
