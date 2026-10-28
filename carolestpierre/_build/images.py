"""Image pipeline: turns the salon's original photography into web-ready WebP.

Run:  python3 _build/images.py <folder-with-originals>
Writes to assets/img/. Each entry: output name -> (source, max width, aspect or None, focal y 0..1).
Large images also get an -800 variant for srcset.
"""
import os
import sys

from PIL import Image, ImageOps

SRC = sys.argv[1] if len(sys.argv) > 1 else "originals"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

IMAGES = {
    # Brand / editorial
    "ritual-scalp": ("in15_1267_r1-scaled.jpg", 1500, None, 0.4),
    "botanical-leaf": ("botanical_repair_professional_treatment_-_opt_1.jpg", 1400, (4, 5), 0.45),
    "aveda-jungle": ("aveda-beauty-crop-opt.jpg", 1700, None, 0.5),
    "aveda-folk": ("in15_0750_r1_crop-opt.jpg", 1167, None, 0.4),
    "aveda-gazebo": ("in15_0398_r1-opt.jpg", 1600, None, 0.5),
    "aveda-blossom": ("bl15_5884_r3-opt.jpg", 1067, None, 0.4),
    "platinum": ("06_27_-_salon_social-1.jpeg", 1080, None, 0.3),
    "aveda-bob": ("l3-aveda-folklore5-opt.jpg", 500, None, 0.3),
    "hair-show": ("aveda-special-hair-show-opt.jpg", 1600, None, 0.4),
    "hair-styling": ("coiffure-et-maquillage-min-opt.jpg", 1700, None, 0.4),
    # Skin
    "facial-hands": ("facial-opt.jpg", 1600, None, 0.5),
    "facial-white": ("ps16_0091_r2_crop-opt.jpg", 1200, None, 0.5),
    "facial-white-2": ("ps16_0120_r2_crop-opt.jpg", 1200, None, 0.5),
    "back-massage-white": ("ps16_0193_r2_crop-opt.jpg", 1200, None, 0.5),
    "facial-wide": ("accueil-ps16_0091_r2_crop-opt.jpg", 1600, None, 0.5),
    "nails": ("manucure-pedicure-opt.jpg", 1600, None, 0.5),
    "pedicure": ("lexpress-1.jpg", 1054, None, 0.5),
    "hand-cream": ("aveda-hands-min.jpg", 640, None, 0.5),
    "lashes": ("extension-cils.jpg", 1359, None, 0.45),
    "brows": ("sourcils-avantapres.jpg", 461, None, 0.5),
    "sugaring": ("epilation-sucre.jpg", 828, None, 0.5),
    "led": ("led-image1.jpg", 506, None, 0.5),
    # Massage & body
    "hot-stones": ("spa-3184610_1920-opt.jpg", 1600, None, 0.5),
    "massage-hands": ("massage-banniere-opt.jpg", 1024, None, 0.5),
    "massage-therapeutic": ("therapeutic-1.jpg", 1292, None, 0.5),
    "lomi": ("lomi-lomi.jpg", 1115, None, 0.5),
    "aromatic": ("aromatic.jpg", 796, None, 0.5),
    "reflexology": ("reflexology.jpg", 564, None, 0.5),
    "head-massage": ("indian-head-massage-opt.jpg", 1600, None, 0.5),
    "prenatal": ("le-massage-pour-femme-enceinte-8099-664-0.jpg", 664, None, 0.5),
    "wood-therapy": ("maderotherapie.jpg", 1200, None, 0.5),
    "balneo": ("bain-therapeutique-min-opt.jpg", 1700, None, 0.5),
    "wrap": ("total-peacefulness.jpg", 1034, None, 0.5),
    # Medispa
    "laser": ("epilation-laser-opt.jpg", 1600, None, 0.4),
    "microneedling": ("innopen-md_1-002.jpg", 1800, None, 0.5),
    "photorejuvenation": ("photorajeunissement-opt.jpg", 575, None, 0.4),
    "peel": ("chemical-peel-opt.jpg", 734, None, 0.5),
    # Rituals
    "ritual-head-to-toe": ("de-la-tete-aux-pieds.jpg", 1414, None, 0.5),
    "ritual-ultimate": ("detente-ultime.jpg", 1414, None, 0.5),
    "ritual-mom": ("merci-maman-1.jpg", 1414, None, 0.4),
    "ritual-queen": ("reine-du-jour.jpg", 1414, None, 0.35),
    "ritual-mom-to-be": ("le-massage-pour-femme-enceinte-8099-664-0.jpg", 664, None, 0.5),
    # Weddings
    "bridal-bouquet": ("photo-mariage-website.jpg", 2000, None, 0.5),
    "bridal-updo": ("coiffure-mariee-par-christelle-e1691682788868.jpg", 600, None, 0.4),
    "bridal-brunette": ("maquillage-mariee-brunette1.jpg", 1038, None, 0.35),
    "bridal-brunette-2": ("maquillage-mariee-brunette2.jpg", 1294, None, 0.35),
    "bridal-curls": ("mariage-cheveux-boucles-1.jpg", 1300, None, 0.4),
    "bridal-jewel": ("mariage-bijoux.jpg", 805, None, 0.4),
    "bridal-makeup-artist": ("makeup-1.jpg", 940, None, 0.4, (0.012, 0.01, 0.985, 0.99)),
    "bridal-robe": ("makeup-2.png", 595, None, 0.35),
    "bridal-look-1": ("img_0923.jpeg", 1300, None, 0.35),
    "bridal-look-2": ("img_1546.jpeg", 1300, None, 0.35),
    "bridal-look-3": ("img_1558.jpeg", 1300, None, 0.35),
    "bridal-look-4": ("maquillage-mariee-par-carole-e1691683037757.jpg", 600, None, 0.35),
    "bridal-look-5": ("maquillage-melissa.jpg", 1300, None, 0.35),
    # Place & people
    "salon-exterior": ("photo-salon-exterieur.jpg", 1800, None, 0.5),
    "salon-reception": ("banniere-contactez-nous-opt.jpg", 1600, None, 0.5),
    "salon-floor": ("carrieres-et-stages-coiffure-opt.jpg", 1600, None, 0.5),
    "carole-portrait": ("carole-st-pierre-opt.jpg", 682, None, 0.3),
}

TEAM = {
    "jeff": "jeff-2022-scaled.jpg", "vivian": "vivian.jpg", "christelle": "christelle.jpg",
    "dorianne": "dorianne-couleur.jpg", "thea": "thea-pilon.jpg", "heidi": "heidi-riera.jpg",
    "kim": "kim.jpg", "melanie": "melanie-de-champlain.jpg", "karolyne": "karolyne.jpg",
    "rebecca": "rebecca.jpg", "aarti": "arti.jpg", "happy": "harpreethappy-kaur-1.jpg",
    "mary": "mary-morgan-1.jpg", "anna-rose": "anna-rose-b.lalonde.jpg", "maelie": "maelie.png",
    "emma": "emma-800x800-1.png", "genevieve": "genevieve.jpg", "christine": "christinebeaulieu.jpg",
    "gisela": "gisela.jpg", "mila": "liudmila-2023-1-e1677354782781.jpg", "myriam": "myriam.png",
    "yadira": "b06ae061-1208-4775-bd65-8e83027363a5.jpg", "shanny": "shanny.jpg",
    "emy": "emy-site-web.jpg", "carole": "carole.jpg", "julie": "julie.jpg",
}


def load(name):
    im = Image.open(os.path.join(SRC, name))
    im = ImageOps.exif_transpose(im)
    if im.mode in ("P", "RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        rgba = im.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[3])
        im = bg
    return im.convert("RGB")


def crop_to(im, aspect, fy):
    w, h = im.size
    tw, th = aspect
    if w / h > tw / th:  # too wide
        nw = int(h * tw / th)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = int(w * th / tw)
    y = int((h - nh) * fy)
    return im.crop((0, y, w, y + nh))


def save(im, path, width):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, "WEBP", quality=80, method=6)
    return im.size


def main():
    os.makedirs(os.path.join(OUT, "team"), exist_ok=True)
    sizes = {}
    for out, (src, width, aspect, fy, *trim) in IMAGES.items():
        im = load(src)
        if trim:  # fractional crop box to remove borders baked into the original
            l, t, r, b = trim[0]
            im = im.crop((int(im.width * l), int(im.height * t), int(im.width * r), int(im.height * b)))
        if aspect:
            im = crop_to(im, aspect, fy)
        sizes[out] = save(im, os.path.join(OUT, out + ".webp"), width)
        if width > 1000:
            save(im, os.path.join(OUT, out + "-800.webp"), 800)
    for out, src in TEAM.items():
        im = crop_to(load(src), (4, 5), 0.18)
        sizes["team/" + out] = save(im, os.path.join(OUT, "team", out + ".webp"), 640)
    # Image dimensions, consumed by the page builder for width/height attributes (no layout shift).
    with open(os.path.join(os.path.dirname(__file__), "image_sizes.py"), "w") as f:
        f.write("SIZES = " + repr(sizes) + "\n")
    print(len(sizes), "images written")


if __name__ == "__main__":
    main()
