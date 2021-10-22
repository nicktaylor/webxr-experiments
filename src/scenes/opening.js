import * as THREE from 'three'
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

export default function OpeningScene(renderer, hasXR, onReady) {
  const scene = new THREE.Scene();
  const donuts = [];

  let textures = {};
  let fonts = {};
  let text = null;
  let sceneEnded = false;
  let camera = null;
  let controls = null;

  // TODO: Move to generic loader class and return all textures and fonts from resolved promise
  const loadTextures = async () => {
    const textureLoader = new THREE.TextureLoader()
    textures["text"] = textureLoader.load('/textures/matcaps/9.png');
  };

  const loadFont = (name, src) => {
    const fontLoader = new THREE.FontLoader();

    return new Promise((resolve, reject) => {
      fontLoader.load(
          src,
          (font) => {
            resolve([name, font]);
          },
          () => {

          },
          () => {
            reject();
          })
    })
  }

  const loadFonts = async () => {
    let results = await Promise.all([loadFont("wotfard", "/fonts/wotfard-semibold.json")])
    fonts = Object.assign(...results.map(([key, val]) => ({[key]: val})))
    console.dir(fonts)
  };
  // TODO: END

  const add = (object) => {
    scene.add(object);
  }

  const createCamera = () => {
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 );
    camera.position.set(0, 0, 5)
    if (!hasXR) {
      scene.add(camera)
    }
  }

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const init = async () => {
    createCamera();

    await Promise.all([loadTextures(), loadFonts()]);

    const textGeometry = new THREE.TextGeometry(
        "Hello, world!",
        {
          font: fonts["wotfard"],
          size: 0.5,
          height: 0.2,
          curveSegments: 10,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 4
        }
    )
    const textTexture = textures["text"]
    const material = new THREE.MeshMatcapMaterial({matcap: textTexture})
    const text = new THREE.Mesh(textGeometry, material)

    textGeometry.center()

    add(text)

    const donutGeometry = new THREE.TorusBufferGeometry(
        0.3,
        0.2,
        20,
        45
    );

    const donutMaterial = new THREE.MeshMatcapMaterial({matcap: textTexture});

    for (let i = 0; i < 100; i++) {
      const donut = new THREE.Mesh(donutGeometry, donutMaterial);
      donut.position.x = (Math.random() - 0.5) * 10;
      donut.position.y = (Math.random() - 0.5) * 10;
      donut.position.z = (Math.random() - 0.5) * 10;

      donut.rotation.x = Math.random() * Math.PI;
      donut.rotation.z = Math.random() * Math.PI;

      const scale = Math.random();
      donut.scale.set(scale, scale, scale);

      donuts.push(donut);
      add(donut);
    }


    if (!hasXR) {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
    } else {
      renderer.xr.enabled = true;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    window.addEventListener('resize', onWindowResize);
  };


  const render = () => {
    renderer.render(scene, camera);
    console.log("RENDERING")
    if (!hasXR) {
      controls.update();
    }
  }

  const run = () => {
    return new Promise((resolve, reject) => {
      try {
        console.log("HERER")
        renderer.setAnimationLoop(render);

        renderer.xr.addEventListener('sessionend', () => {
          resolve();
        });
      } catch (ex) {
        reject(ex);
      }
    });
  }

  init().then(() => onReady());

  return {
    add,
    scene,
    run
  }
}