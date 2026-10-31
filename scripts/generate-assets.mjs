import { mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const source = path.join(root, 'public', 'ashmie-logo.jpeg');
const iconsDir = path.join(root, 'public', 'icons');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
const iosAssets = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets');
const background = '#fffaf6';

async function renderPng(size, destination, { padding = 0 } = {}) {
  const inner = Math.max(1, Math.round(size * (1 - padding * 2)));
  const logo = await sharp(source).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, top: offset, left: offset }])
    .png()
    .toFile(destination);
}

async function renderSplash(width, height, destination) {
  const badge = Math.round(Math.min(width, height) * 0.26);
  const logo = await sharp(source).resize(badge, badge, { fit: 'cover' }).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: logo, top: Math.round((height - badge) / 2), left: Math.round((width - badge) / 2) }])
    .png()
    .toFile(destination);
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

await mkdir(iconsDir, { recursive: true });
await renderPng(192, path.join(iconsDir, 'icon-192.png'));
await renderPng(512, path.join(iconsDir, 'icon-512.png'));
await renderPng(180, path.join(iconsDir, 'icon-180.png'));
await renderPng(64, path.join(iconsDir, 'favicon.png'));
await renderPng(512, path.join(iconsDir, 'icon-maskable-512.png'), { padding: 0.12 });

const resourcesDir = path.join(root, 'resources');
await mkdir(resourcesDir, { recursive: true });
await renderPng(1024, path.join(resourcesDir, 'icon.png'));
await renderSplash(2732, 2732, path.join(resourcesDir, 'splash.png'));
console.log('Web icons and resources written');

if (await exists(androidRes)) {
  const densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };
  for (const [folder, size] of Object.entries(densities)) {
    const dir = path.join(androidRes, folder);
    await mkdir(dir, { recursive: true });
    await renderPng(size, path.join(dir, 'ic_launcher.png'));
    await renderPng(size, path.join(dir, 'ic_launcher_round.png'), { padding: 0.08 });
    await renderPng(Math.round(size * 2.25), path.join(dir, 'ic_launcher_foreground.png'), { padding: 0.18 });
  }

  const splashSizes = {
    drawable: [480, 320],
    'drawable-port-mdpi': [320, 480],
    'drawable-port-hdpi': [480, 800],
    'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [960, 1600],
    'drawable-port-xxxhdpi': [1280, 1920],
    'drawable-land-mdpi': [480, 320],
    'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720],
    'drawable-land-xxhdpi': [1600, 960],
    'drawable-land-xxxhdpi': [1920, 1280],
  };
  for (const [folder, [width, height]] of Object.entries(splashSizes)) {
    const dir = path.join(androidRes, folder);
    await mkdir(dir, { recursive: true });
    await renderSplash(width, height, path.join(dir, 'splash.png'));
  }
  console.log('Android launcher and splash assets written');
}

if (await exists(iosAssets)) {
  const appIconSet = path.join(iosAssets, 'AppIcon.appiconset');
  await mkdir(appIconSet, { recursive: true });
  await renderPng(1024, path.join(appIconSet, 'AppIcon-512@2x.png'));

  const splashSet = path.join(iosAssets, 'Splash.imageset');
  await mkdir(splashSet, { recursive: true });
  for (const file of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await renderSplash(2732, 2732, path.join(splashSet, file));
  }
  console.log('iOS launcher and splash assets written');
}
