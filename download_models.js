import fs from 'fs';
import path from 'path';
import https from 'https';

const modelsDir = path.resolve('public/models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const downloads = [
  {
    name: 'drone.glb',
    url: 'https://raw.githubusercontent.com/SceneView/sceneview-android/main/samples/model-viewer/src/main/assets/models/drone.glb'
  },
  {
    name: 'damaged_helmet.glb',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
  },
  {
    name: 'satellite.glb',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Satellite/glTF-Binary/Satellite.glb'
  },
  {
    name: 'flight_helmet.glb',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SciFiHelmet/glTF-Binary/SciFiHelmet.glb'
  },
  {
    name: 'airplane.glb',
    url: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/scenegraph-layer/airplane.glb'
  },
  {
    name: 'jet.glb',
    url: 'https://docs.mapbox.com/mapbox-gl-js/assets/airplane.glb'
  }
];

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
          console.log(`Saved: ${dest} (${fs.statSync(dest).size} bytes)`);
          resolve(true);
        });
      } else {
        console.log(`Failed ${url}: status ${res.statusCode}`);
        file.close();
        if (fs.existsSync(dest) && fs.statSync(dest).size === 0) fs.unlinkSync(dest);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`Error ${url}:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  for (const item of downloads) {
    const dest = path.join(modelsDir, item.name);
    console.log(`Downloading ${item.name}...`);
    await download(item.url, dest);
  }
  console.log('All downloads completed. Files in public/models:');
  console.log(fs.readdirSync(modelsDir));
}

main();
