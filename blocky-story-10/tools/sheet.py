# python3 tools/sheet.py out.jpg cols a.jpg b.jpg ...   -> labelled contact sheet for QA
import sys
from PIL import Image, ImageDraw
out, cols, fs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
w, h = 360, 640; rows = (len(fs) + cols - 1) // cols
im = Image.new('RGB', (cols * w, rows * h)); d = ImageDraw.Draw(im)
for k, f in enumerate(fs):
    x, y = (k % cols) * w, (k // cols) * h
    im.paste(Image.open(f).convert('RGB').resize((w, h)), (x, y)); d.rectangle((x, y, x + 96, y + 13), fill='black'); d.text((x + 3, y + 1), f.split('/')[-1][:15], fill='yellow')
im.save(out, quality=88); print(out, im.size)
