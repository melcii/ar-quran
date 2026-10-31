# AR Quran

QR codes printed on the pages of the Quran that open colorful, low-poly 3D scenes of the events
those pages describe, made for children.

## Try the demo

1. On your Android phone, download **[ar-quran-demo.apk](https://github.com/melcii/ar-quran/releases/download/demo-apk/ar-quran-demo.apk)**
   and open it. Android will ask you to allow installing apps from your browser the first time.
2. Open **AR Quran** and tap **Scan a QR code**.
3. Point the camera at this code (on a computer screen or printed):

   <img src="qr/noah-ark.png" alt="QR code for the Ark of Prophet Nuh" width="240">

You can also tap **Browse the stories** to open a scene without scanning.
Drag to turn the scene, pinch to zoom, and use the ◀ ▶ buttons to move through the story.

## How it works

```
web/                 The 3D viewer (three.js). Also published as a website on GitHub Pages.
  scenes.json        The list of scenes. Each scene has an id, title and Surah reference.
  js/scenes/<id>.js  One file per scene: builds the models and the story chapters.
  js/lowpoly.js      Shared helpers for low-poly models, and the light used for prophets.
tools/make_qr.py     Makes a printable QR code for every scene in scenes.json.
qr/                  The generated QR codes and a print sheet.
android/             The Android app: a QR scanner plus the viewer, with all scenes built in.
```

Each QR code holds a normal web link, for example
`https://melcii.github.io/ar-quran/scene.html?id=noah-ark`.
The app only reads the `id`, and shows the scene built into it, so it works without internet.
A phone without the app opens the same link in its browser.

Every push that changes `android/` or `web/` builds a new APK on GitHub and replaces the
[Demo APK release](https://github.com/melcii/ar-quran/releases/tag/demo-apk). The website is
published from `main` by the **Website** workflow.

## Guidelines for scenes

- Prophets are never shown as people. They appear as a shining light
  (`createLightOfProphet` in `web/js/lowpoly.js`).
- Every chapter of a story cites the Surah and verse it comes from.
- Keep the style bright, friendly and low-poly: simple shapes with flat shading.

## Adding a scene

1. Add an entry to `web/scenes.json`.
2. Create `web/js/scenes/<id>.js` exporting `createScene({ scene, camera, controls })`, which returns
   `{ chapters, update }`. See `noah-ark.js`.
3. Run `pip install -r tools/requirements.txt` and `python tools/make_qr.py` to make its QR code.

To preview the web viewer on a computer, run `python -m http.server -d web 8000`
and open <http://localhost:8000>.

## Credits

3D rendering by [three.js](https://threejs.org) (MIT license, in `web/vendor/three`).
