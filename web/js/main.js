import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const params = new URLSearchParams(location.search);
const sceneId = params.get('id') || 'noah-ark';

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;
controls.maxPolarAngle = Math.PI * 0.47;
controls.addEventListener('start', () => { controls.autoRotate = false; });

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Pull the camera back on narrow (portrait phone) screens so the whole scene fits.
  camera.fov = w < h ? 60 : 45;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function showError(message) {
  const el = document.getElementById('error');
  el.textContent = message;
  el.hidden = false;
}

async function load() {
  const scenes = await fetch('scenes.json').then((res) => res.json());
  const info = scenes.find((s) => s.id === sceneId);
  if (!info) {
    showError(`We could not find the story "${sceneId}".`);
    return;
  }

  document.title = `${info.title} · AR Quran`;
  document.getElementById('scene-title').textContent = info.title;
  document.getElementById('scene-subtitle').textContent = info.subtitle || '';

  const module = await import(`./scenes/${info.id}.js`);
  const story = module.createScene({ scene, camera, controls });
  setupStory(story);
}

function setupStory(story) {
  const chapters = story.chapters;
  // Scene parameters ease toward the active chapter's values, so changes animate smoothly.
  const state = { ...chapters[0].state };
  let target = chapters[0].state;
  let index = 0;

  const card = document.getElementById('story-card');
  const dots = document.getElementById('dots');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  document.getElementById('story-note').textContent = story.note || '';

  chapters.forEach(() => dots.appendChild(document.createElement('span')));

  function show(i) {
    index = Math.max(0, Math.min(chapters.length - 1, i));
    const chapter = chapters[index];
    target = chapter.state;
    document.getElementById('story-ref').textContent = chapter.ref;
    document.getElementById('story-title').textContent = chapter.title;
    document.getElementById('story-text').textContent = chapter.text;
    [...dots.children].forEach((dot, n) => dot.classList.toggle('active', n === index));
    prev.disabled = index === 0;
    next.disabled = index === chapters.length - 1;
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  show(0);
  card.hidden = false;

  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const ease = 1 - Math.exp(-dt * 1.2);
    for (const key of Object.keys(target)) {
      state[key] += (target[key] - state[key]) * ease;
    }
    story.update(now / 1000, dt, state);
    controls.update();
    renderer.render(scene, camera);
  });
}

load().catch((err) => {
  console.error(err);
  showError('Something went wrong while loading this story.');
});
