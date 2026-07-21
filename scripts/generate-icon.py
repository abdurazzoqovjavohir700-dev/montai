"""
Generate Montai app icon PNGs from the SVG logo using PIL.
Creates all required sizes for Android (mipmap) and Tauri (icons/).
"""
import struct, zlib, math, os

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Installing Pillow...")
    import subprocess
    subprocess.run(["pip3", "install", "Pillow", "-q"])
    from PIL import Image, ImageDraw

def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill)
    draw.ellipse([x1, y1, x1 + radius * 2, y1 + radius * 2], fill=fill)
    draw.ellipse([x2 - radius * 2, y1, x2, y1 + radius * 2], fill=fill)
    draw.ellipse([x1, y2 - radius * 2, x1 + radius * 2, y2], fill=fill)
    draw.ellipse([x2 - radius * 2, y2 - radius * 2, x2, y2], fill=fill)

def lerp_color(c1, c2, t):
    """Interpolate between two RGB colors."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def draw_gradient_bg(img, size, r, radius):
    """Draw blue gradient background."""
    # Top-left color: #60A5FA, Bottom-right: #3B82F6
    c1 = (96, 165, 250)
    c2 = (59, 130, 246)
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            color = lerp_color(c1, c2, t)
            # Check if inside rounded rect
            # Distance to nearest corner
            cx, cy = size // 2, size // 2
            # Check corners
            in_tl = x < r and y < r
            in_tr = x > size - r and y < r
            in_bl = x < r and y > size - r
            in_br = x > size - r and y > size - r

            inside = True
            if in_tl:
                inside = math.sqrt((x - r) ** 2 + (y - r) ** 2) <= r
            elif in_tr:
                inside = math.sqrt((x - (size - r)) ** 2 + (y - r) ** 2) <= r
            elif in_bl:
                inside = math.sqrt((x - r) ** 2 + (y - (size - r)) ** 2) <= r
            elif in_br:
                inside = math.sqrt((x - (size - r)) ** 2 + (y - (size - r)) ** 2) <= r

            if inside:
                px[x, y] = color + (255,)

def generate_montai_icon(size):
    """Generate the Montai logo at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    # Scale factor (SVG is 120x120)
    s = size / 120.0
    r = int(28 * s)  # corner radius

    # Draw gradient background
    draw_gradient_bg(img, size, r, r)

    draw = ImageDraw.Draw(img)

    # Hole color: dark with opacity 0.3 on blue = approx rgb(50, 105, 162) → but on gradient
    # Use a simple dark overlay color
    hole_color = (10, 10, 11, 76)  # 0.3 opacity of #0A0A0B

    # Film strip holes - top row (y=12 in SVG, width=8, height=8, rx=2)
    hole_positions_x = [14, 30, 46, 66, 82, 98]
    for hx in hole_positions_x:
        x1 = int(hx * s)
        y1 = int(12 * s)
        hw = max(int(8 * s), 3)
        hh = max(int(8 * s), 3)
        hr = max(int(2 * s), 1)
        draw.rounded_rectangle([x1, y1, x1 + hw, y1 + hh], radius=hr, fill=hole_color)

    # Film strip holes - bottom row (y=100)
    for hx in hole_positions_x:
        x1 = int(hx * s)
        y1 = int(100 * s)
        hw = max(int(8 * s), 3)
        hh = max(int(8 * s), 3)
        hr = max(int(2 * s), 1)
        draw.rounded_rectangle([x1, y1, x1 + hw, y1 + hh], radius=hr, fill=hole_color)

    # Draw the "M" letter using lines
    # SVG paths:
    # M28 82V38L44 62L60 38L60 82  (left M)
    # M60 82V38L76 62L92 38V82      (right M)
    stroke_color = (10, 10, 11, 255)  # #0A0A0B fully opaque
    stroke_w = max(int(8 * s), 2)

    def pt(x, y):
        return (int(x * s), int(y * s))

    # Left M: 28,82 → 28,38 → 44,62 → 60,38 → 60,82
    points_left = [pt(28, 82), pt(28, 38), pt(44, 62), pt(60, 38), pt(60, 82)]
    # Right M: 60,82 → 60,38 → 76,62 → 92,38 → 92,82
    points_right = [pt(60, 82), pt(60, 38), pt(76, 62), pt(92, 38), pt(92, 82)]

    # Draw lines
    for i in range(len(points_left) - 1):
        draw.line([points_left[i], points_left[i + 1]], fill=stroke_color, width=stroke_w)
    for i in range(len(points_right) - 1):
        draw.line([points_right[i], points_right[i + 1]], fill=stroke_color, width=stroke_w)

    # Round the line ends
    r2 = stroke_w // 2
    for p in points_left + points_right:
        draw.ellipse([p[0] - r2, p[1] - r2, p[0] + r2, p[1] + r2], fill=stroke_color)

    return img

def save_png(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, 'PNG')
    print(f"  ✓ {path} ({img.size[0]}x{img.size[1]})")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print("Generating Montai icons...")

# === TAURI icons ===
print("\n[Tauri icons]")
icons_dir = os.path.join(BASE, "src-tauri", "icons")

for size, name in [
    (32, "32x32.png"),
    (128, "128x128.png"),
    (256, "128x128@2x.png"),
    (512, "icon.png"),
]:
    img = generate_montai_icon(size)
    save_png(img, os.path.join(icons_dir, name))

# Generate icon.ico (multi-size)
print("  Generating icon.ico...")
imgs = [generate_montai_icon(s).convert('RGBA') for s in [16, 32, 48, 64, 128, 256]]
imgs[0].save(
    os.path.join(icons_dir, "icon.ico"),
    format='ICO',
    sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)],
    append_images=imgs[1:]
)
print(f"  ✓ {icons_dir}/icon.ico (multi-size)")

# === Android mipmap icons ===
print("\n[Android mipmap icons]")
ANDROID_RES = os.path.join(BASE, "android", "app", "src", "main", "res")

mipmap_sizes = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

for mipmap_dir, size in mipmap_sizes.items():
    img = generate_montai_icon(size)

    # ic_launcher.png
    save_png(img, os.path.join(ANDROID_RES, mipmap_dir, "ic_launcher.png"))

    # ic_launcher_round.png (circular crop)
    round_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, size, size], fill=255)
    round_img.paste(img, mask=mask)
    save_png(round_img, os.path.join(ANDROID_RES, mipmap_dir, "ic_launcher_round.png"))

# Also update the foreground if it exists
fg_dir_paths = [
    os.path.join(ANDROID_RES, d, "ic_launcher_foreground.png")
    for d in mipmap_sizes.keys()
    if os.path.exists(os.path.join(ANDROID_RES, d, "ic_launcher_foreground.png"))
]
if fg_dir_paths:
    print("\n[Android foreground icons]")
    for path in fg_dir_paths:
        # For foreground, use the M letter only (no background)
        size = mipmap_sizes[os.path.basename(os.path.dirname(path))]
        img_fg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img_fg)
        s = size / 120.0
        stroke_w = max(int(8 * s), 2)
        stroke_color = (255, 255, 255, 255)
        def pt(x, y): return (int(x * s), int(y * s))
        points_left = [pt(28, 82), pt(28, 38), pt(44, 62), pt(60, 38), pt(60, 82)]
        points_right = [pt(60, 82), pt(60, 38), pt(76, 62), pt(92, 38), pt(92, 82)]
        for i in range(len(points_left) - 1):
            draw.line([points_left[i], points_left[i+1]], fill=stroke_color, width=stroke_w)
        for i in range(len(points_right) - 1):
            draw.line([points_right[i], points_right[i+1]], fill=stroke_color, width=stroke_w)
        r2 = stroke_w // 2
        for p in points_left + points_right:
            draw.ellipse([p[0]-r2, p[1]-r2, p[0]+r2, p[1]+r2], fill=stroke_color)
        save_png(img_fg, path)

print("\n✅ All icons generated successfully!")
