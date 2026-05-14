# Media Library — gauge-golf

Drop your real photos and videos here. The site auto-uses them.
Filenames are **fixed** — site code references these exact names.

---

## 🟡 HERO (top of page)

| Filename          | Type      | Specs                                     |
| ----------------- | --------- | ----------------------------------------- |
| `hero.mp4`        | video     | 1080×1350, H.264, ≤ 8 sec loop, ≤ 4 MB    |
| `hero.jpg`        | poster    | 1080×1350, JPEG ~ 85 quality, ≤ 200 KB    |

The poster shows while the video loads (or if the user has data-saver mode).
**Mobile-first portrait** — vertical is better than horizontal.

---

## 🟡 PRODUCT — glove photo

| Filename     | Type         | Specs                                          |
| ------------ | ------------ | ---------------------------------------------- |
| `glove.png`  | transparent  | 1000×1250, PNG with alpha (no background)      |

A clean shot of the glove on transparent background. The blueprint
section renders this **on top of** a dashed silhouette + zone tags.

> Tip: shoot on white, then erase background in Photoshop / Photoroom / remove.bg.

---

## 🟡 FOUNDER

| Filename      | Type   | Specs                                       |
| ------------- | ------ | ------------------------------------------- |
| `founder.jpg` | photo  | 800×1000, JPEG ~ 85 quality, ≤ 300 KB       |

Konstantin at the range or with the glove. Portrait orientation.

---

## 🟡 TESTING (6 tiles)

| Filename             | Suggested content     |
| -------------------- | --------------------- |
| `testing-01.mp4`     | Range testing         |
| `testing-02.mp4`     | Grip testing          |
| `testing-03.mp4`     | Sweat conditions      |
| `testing-04.mp4`     | Factory visit         |
| `testing-05.mp4`     | Golfer reactions      |
| `testing-06.mp4`     | Product closeup       |

Each: 720×1080, H.264, ≤ 6 sec loop, ≤ 3 MB.
You can also use `.jpg` (same name) if no video — site will still render it.

---

## Workflow

1. Drop the files into this folder.
2. `git add public/media && git commit -m "media: real footage" && git push`
3. Vercel auto-deploys in ~60 sec.
4. Done.

## File size limits

Keep total folder size **under 30 MB** for fast loads.
Compress with [HandBrake](https://handbrake.fr/) (video) or
[TinyPNG](https://tinypng.com/) (images) before committing.
