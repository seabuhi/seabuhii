import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const modelsDir = path.resolve('public/models');
const zipPath = path.resolve('veroviz.zip');
const extractDir = path.resolve('veroviz_temp');

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        resolve(false);
      }
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('Downloading veroviz package...');
  await download('https://veroviz.org/downloads/veroviz_cesium_viewer.zip', zipPath);
  console.log('Downloaded zip. Size:', fs.statSync(zipPath).size);

  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });

  execSync(`tar -xf "${zipPath}" -C "${extractDir}"`);
  console.log('Extracted.');

  // Find all .glb files recursively
  function findGlb(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        findGlb(full);
      } else if (f.endsWith('.glb') || f.endsWith('.gltf')) {
        const dest = path.join(modelsDir, f);
        fs.copyFileSync(full, dest);
        console.log(`Copied 3D model: ${f} -> ${dest} (${fs.statSync(dest).size} bytes)`);
      }
    }
  }

  findGlb(extractDir);

  // Clean up
  fs.rmSync(zipPath, { force: true });
  fs.rmSync(extractDir, { recursive: true, force: true });

  console.log('Final models in public/models:');
  console.log(fs.readdirSync(modelsDir));
}

main();
