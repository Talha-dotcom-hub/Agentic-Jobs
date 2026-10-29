import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('PWA build and offline safety', () => {
  test('Production worker imports the push handlers and excludes API navigation fallback', () => {
    const config = fs.readFileSync('vite.config.ts', 'utf8');
    const pushWorker = fs.readFileSync('public/push-worker.js', 'utf8');

    assert.match(config, /importScripts:\s*\[['"]\/push-worker\.js['"]\]/);
    assert.match(config, /navigateFallbackDenylist:\s*\[\/\^\\\/api\\\//);
    assert.match(pushWorker, /addEventListener\(['"]push['"]/);
    assert.match(pushWorker, /addEventListener\(['"]notificationclick['"]/);
    assert.match(pushWorker, /parsedUrl\.origin === self\.location\.origin/);
  });

  test('PWA icon PNG dimensions match the manifest declarations', () => {
    const dimensions = (filePath: string) => {
      const png = fs.readFileSync(filePath);
      assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
      return [png.readUInt32BE(16), png.readUInt32BE(20)];
    };

    assert.deepEqual(dimensions('public/icon-192.png'), [192, 192]);
    assert.deepEqual(dimensions('public/icon.png'), [512, 512]);
    assert.deepEqual(dimensions('public/maskable-512.png'), [512, 512]);
  });

  test('Android, desktop, and iOS use PWA installation guidance without an APK flow', () => {
    const installButton = fs.readFileSync('src/components/common/PWAInstallButton.tsx', 'utf8');
    const installHook = fs.readFileSync('src/hooks/usePWAInstall.ts', 'utf8');
    assert.match(installButton, /platform === 'android'/);
    assert.match(installButton, /Add to Home screen/);
    assert.match(installButton, /if \(isInstallable\)/);
    assert.match(installButton, /Add to Home Screen on iPhone or iPad/);
    assert.doesNotMatch(installButton, /Download APK|androidApkRelease/);
    assert.equal(fs.existsSync('src/lib/androidApkRelease.ts'), false);
    assert.match(installHook, /beforeinstallprompt/);
  });
});
