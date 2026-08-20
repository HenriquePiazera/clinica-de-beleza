"""Prepare logo asset with transparent background and tight crop."""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def sample_corner_background(pixels: np.ndarray) -> np.ndarray:
    height, width, _ = pixels.shape
    corners = np.array(
        [
            pixels[0, 0, :3],
            pixels[0, width - 1, :3],
            pixels[height - 1, 0, :3],
            pixels[height - 1, width - 1, :3],
        ],
        dtype=np.float32,
    )
    return np.median(corners, axis=0)


def flood_transparent_background(
    image: Image.Image,
    tolerance: float = 28,
) -> Image.Image:
    """Remove only background pixels connected to the image border."""
    pixels = np.array(image.convert('RGBA'), dtype=np.uint8)
    height, width, _ = pixels.shape
    bg_color = sample_corner_background(pixels.astype(np.int16))
    rgb = pixels[:, :, :3].astype(np.float32)
    distances = np.linalg.norm(rgb - bg_color, axis=2)
    is_background_color = distances <= tolerance

    visited = np.zeros((height, width), dtype=bool)
    transparent = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        for y in (0, height - 1):
            if is_background_color[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))

    for y in range(height):
        for x in (0, width - 1):
            if is_background_color[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        transparent[y, x] = True
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < height
                and 0 <= nx < width
                and not visited[ny, nx]
                and is_background_color[ny, nx]
            ):
                visited[ny, nx] = True
                queue.append((ny, nx))

    pixels[transparent, 3] = 0
    return Image.fromarray(pixels, mode='RGBA')


def is_blue_stroke(r: int, g: int, b: int) -> bool:
    """Azul saturado das letras — não confundir com preenchimento claro."""
    if min(r, g, b) > 155:
        return False
    if r + g + b > 520:
        return False
    return b > 100 and b >= r + 12 and b >= g - 8


def is_orange_accent(r: int, g: int, b: int) -> bool:
    return r > 170 and g > 60 and b < 130 and r > b


def is_light_fill(r: int, g: int, b: int) -> bool:
    """Branco, brilho e azul muito claro dentro das letras."""
    luminance = (r + g + b) / 3
    if min(r, g, b) >= 140 and luminance >= 182:
        return True
    if min(r, g, b) >= 150:
        return True
    if b >= 245:
        return True
    if r + g + b > 495 and b - r < 45 and b - g < 30:
        return True
    if r > 155 and g > 155 and b > 180:
        return True
    return False


def logotype_bbox(
    pixels: np.ndarray,
    y_ratio: float = 0.66,
    pad: int = 4,
) -> tuple[int, int, int, int] | None:
    height, width, _ = pixels.shape
    y0 = int(height * y_ratio)

    xs: list[int] = []
    ys: list[int] = []
    for y in range(y0, height):
        for x in range(width):
            if pixels[y, x, 3] > 0:
                xs.append(x)
                ys.append(y)

    if not xs:
        return None

    return (
        max(0, min(xs) - pad),
        min(width - 1, max(xs) + pad),
        max(y0, min(ys) - pad),
        min(height - 1, max(ys) + pad),
    )


def sample_logotype_blue(
    pixels: np.ndarray,
    y_ratio: float = 0.66,
) -> np.ndarray:
    """Cor azul mediana dos traços da palavra «server ino»."""
    height, width, _ = pixels.shape
    y0 = int(height * y_ratio)
    blues: list[list[int]] = []

    for y in range(y0, height):
        for x in range(width):
            if pixels[y, x, 3] == 0:
                continue
            r, g, b = map(int, pixels[y, x, :3])
            if is_blue_stroke(r, g, b) and not is_light_fill(r, g, b):
                blues.append([r, g, b])

    if blues:
        return np.median(np.array(blues, dtype=np.float32), axis=0).astype(np.uint8)

    return np.array([32, 96, 224], dtype=np.uint8)


def nearby_logotype_blue(
    pixels: np.ndarray,
    y: int,
    x: int,
    y0: int,
    radius: int = 14,
) -> np.ndarray | None:
    """Amostra azul dos traços vizinhos (melhor continuidade visual)."""
    height, width, _ = pixels.shape
    blues: list[list[int]] = []

    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            ny, nx = y + dy, x + dx
            if ny < y0 or ny >= height or nx < 0 or nx >= width:
                continue
            if pixels[ny, nx, 3] == 0:
                continue
            r, g, b = map(int, pixels[ny, nx, :3])
            if is_blue_stroke(r, g, b) and not is_light_fill(r, g, b):
                blues.append([r, g, b])

    if not blues:
        return None

    return np.median(np.array(blues, dtype=np.float32), axis=0).astype(np.uint8)


def remove_text_whites(pixels: np.ndarray, y_ratio: float = 0.66) -> None:
    """Remove preenchimentos claros nos counters (e, o)."""
    height, width, _ = pixels.shape
    y0 = int(height * y_ratio)

    for y in range(y0, height):
        for x in range(width):
            alpha = pixels[y, x, 3]
            if alpha == 0:
                continue

            r = int(pixels[y, x, 0])
            g = int(pixels[y, x, 1])
            b = int(pixels[y, x, 2])

            if is_blue_stroke(r, g, b) or is_orange_accent(r, g, b):
                continue

            if is_light_fill(r, g, b):
                pixels[y, x, 3] = 0


def is_sparkle_pixel(r: int, g: int, b: int, alpha: int) -> bool:
    """Pixels típicos da marca d'água/brilho (Google sparkle)."""
    if alpha == 0:
        return False

    luminance = (r + g + b) / 3
    if min(r, g, b) >= 200 and luminance >= 210:
        return True
    if is_light_fill(r, g, b):
        return True
    if r < 80 and b > 100 and luminance < 170:
        return True
    if is_blue_stroke(r, g, b) and r < 100 and luminance < 200:
        return True
    return False


def fill_google_watermark(
    pixels: np.ndarray,
    y_ratio: float = 0.66,
    max_area: int = 220,
) -> None:
    """Substitui sparkle/marca d'água por azul da própria letra."""
    bbox = logotype_bbox(pixels, y_ratio=y_ratio)
    if bbox is None:
        return

    x_min, x_max, y_min, y_max = bbox
    text_width = x_max - x_min + 1
    right_zone_x = x_max - max(28, int(text_width * 0.12))
    fallback_blue = sample_logotype_blue(pixels, y_ratio=y_ratio)

    height, width, _ = pixels.shape
    y0 = int(height * y_ratio)
    visited = np.zeros((height, width), dtype=bool)

    for y in range(y0, height):
        for x in range(right_zone_x, width):
            if visited[y, x]:
                continue

            r, g, b, alpha = map(int, pixels[y, x])
            if not is_sparkle_pixel(r, g, b, alpha):
                continue

            queue: deque[tuple[int, int]] = deque([(y, x)])
            visited[y, x] = True
            component: list[tuple[int, int]] = []
            has_bright = False

            while queue:
                cy, cx = queue.popleft()
                component.append((cy, cx))
                cr, cg, cb, ca = map(int, pixels[cy, cx])
                if min(cr, cg, cb) >= 200 or is_light_fill(cr, cg, cb):
                    has_bright = True

                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    ny, nx = cy + dy, cx + dx
                    if (
                        ny < y0
                        or ny >= height
                        or nx < x_min
                        or nx >= width
                        or visited[ny, nx]
                    ):
                        continue

                    nr, ng, nb, na = map(int, pixels[ny, nx])
                    if is_sparkle_pixel(nr, ng, nb, na):
                        visited[ny, nx] = True
                        queue.append((ny, nx))

            if len(component) <= max_area and has_bright:
                for cy, cx in component:
                    local_blue = nearby_logotype_blue(pixels, cy, cx, y0)
                    blue = local_blue if local_blue is not None else fallback_blue
                    pixels[cy, cx, 0] = blue[0]
                    pixels[cy, cx, 1] = blue[1]
                    pixels[cy, cx, 2] = blue[2]
                    pixels[cy, cx, 3] = 255


def fill_sparkle_gaps(
    pixels: np.ndarray,
    y_ratio: float = 0.66,
) -> None:
    """Preenche buracos transparentes no contorno externo do «o» com azul da letra."""
    bbox = logotype_bbox(pixels, y_ratio=y_ratio)
    if bbox is None:
        return

    x_min, x_max, y_min, y_max = bbox
    text_width = x_max - x_min + 1
    right_zone_x = x_max - max(28, int(text_width * 0.12))
    fallback_blue = sample_logotype_blue(pixels, y_ratio=y_ratio)

    height, width, _ = pixels.shape
    y0 = int(height * y_ratio)

    for _ in range(4):
        changed = False
        for y in range(y0, height):
            for x in range(right_zone_x, width):
                if pixels[y, x, 3] != 0:
                    continue

                blue_neighbors = 0
                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    ny, nx = y + dy, x + dx
                    if ny < y0 or ny >= height or nx < x_min or nx >= width:
                        continue
                    if pixels[ny, nx, 3] == 0:
                        continue
                    r, g, b = map(int, pixels[ny, nx, :3])
                    if is_blue_stroke(r, g, b):
                        blue_neighbors += 1

                if blue_neighbors >= 2:
                    local_blue = nearby_logotype_blue(pixels, y, x, y0)
                    blue = local_blue if local_blue is not None else fallback_blue
                    pixels[y, x, 0] = blue[0]
                    pixels[y, x, 1] = blue[1]
                    pixels[y, x, 2] = blue[2]
                    pixels[y, x, 3] = 255
                    changed = True

        if not changed:
            break


def remove_small_bright_specks(
    pixels: np.ndarray,
    y_ratio: float = 0.66,
    max_area: int = 120,
    min_luminance: float = 176.0,
) -> None:
    """Remove brilhos claros isolados restantes na faixa do logotipo."""
    height, width, _ = pixels.shape
    y0 = int(height * y_ratio)
    visited = np.zeros((height, width), dtype=bool)

    def is_candidate(r: int, g: int, b: int, alpha: int) -> bool:
        if alpha == 0:
            return False
        if is_blue_stroke(r, g, b) or is_orange_accent(r, g, b):
            return False
        luminance = (r + g + b) / 3
        return luminance >= min_luminance or min(r, g, b) >= 150 or b >= 245

    for y in range(y0, height):
        for x in range(width):
            if visited[y, x]:
                continue

            r, g, b, alpha = map(int, pixels[y, x])
            if not is_candidate(r, g, b, alpha):
                continue

            queue: deque[tuple[int, int]] = deque([(y, x)])
            visited[y, x] = True
            component: list[tuple[int, int]] = []
            luminance_sum = 0.0

            while queue:
                cy, cx = queue.popleft()
                component.append((cy, cx))
                cr, cg, cb, _ = map(int, pixels[cy, cx])
                luminance_sum += (cr + cg + cb) / 3

                for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    ny, nx = cy + dy, cx + dx
                    if ny < y0 or ny >= height or nx < 0 or nx >= width or visited[ny, nx]:
                        continue
                    nr, ng, nb, na = map(int, pixels[ny, nx])
                    if is_candidate(nr, ng, nb, na):
                        visited[ny, nx] = True
                        queue.append((ny, nx))

            if len(component) <= max_area and luminance_sum / len(component) >= min_luminance:
                for cy, cx in component:
                    pixels[cy, cx, 3] = 0


def crop_to_content(image: Image.Image, padding: int = 12) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def prepare_logo(input_path: Path, output_path: Path, tolerance: float = 28) -> None:
    image = Image.open(input_path)
    image = flood_transparent_background(image, tolerance=tolerance)
    pixels = np.array(image, dtype=np.uint8)
    fill_google_watermark(pixels)
    remove_text_whites(pixels)
    fill_sparkle_gaps(pixels)
    remove_small_bright_specks(pixels)
    image = Image.fromarray(pixels, mode='RGBA')
    image = crop_to_content(image)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format='PNG', optimize=True)


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    input_file = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'public' / 'server-ino-logo.png'
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file
    tolerance = float(sys.argv[3]) if len(sys.argv) > 3 else 28
    prepare_logo(input_file, output_file, tolerance=tolerance)
