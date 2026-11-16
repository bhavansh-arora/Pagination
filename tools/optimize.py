"""Convert raw screenshots in tools/.shots into optimised WebP files in public/assets/img/work."""
import glob, os
from PIL import Image
SRC = os.path.join(os.path.dirname(__file__), '.shots')
DST = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'img', 'work')
os.makedirs(DST, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, '*.png'))):
    name = os.path.basename(f)[:-4]
    im = Image.open(f).convert('RGB')
    if name.endswith('-m'):
        im.resize((420, round(420 * im.height / im.width)), Image.LANCZOS).save(os.path.join(DST, name + '.webp'), 'WEBP', quality=80, method=6)
    else:
        for w in (1200, 640):
            im.resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(os.path.join(DST, f'{name}-{w}.webp'), 'WEBP', quality=78, method=6)
print('done')
