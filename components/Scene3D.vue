<template>
  <div ref="parent" class="w-full h-full flex relative">
    <div class="h-full w-full" ref="container" />
  </div>
</template>

<script lang="ts" setup>
import * as THREE from "three";
import {
  createWater,
  createCamera,
  createRenderer,
  createControls,
  createSky,
  updateRendererSize,
  resetCameraPosition,
} from "../physics/landscape"; // Custom made functions to draw the water, the sky etc
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import Boid from "../physics/boids";

const container = ref<HTMLElement | null>(null);
const parent = ref<HTMLElement | null>(null);

let water: Water;
let controls: OrbitControls;
let renderer: THREE.WebGLRenderer;
let scene = new THREE.Scene();
let camera: THREE.PerspectiveCamera;
const cameraFov = 75; //°
const boids: Boid[] = [];

defineExpose({ reset });

onMounted(async () => {
  const axisHelper = new THREE.AxesHelper(100);
  scene.add(axisHelper);

  initBoids(100);
  initScene();
  reset();
  animate();
});

function initBoids(numberOfBoids: number) {
  const geometry = new THREE.ConeGeometry(4, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

  for (let id = 0; id < numberOfBoids; id++) {
    // Randomly place boids in the scene
    const pos = new THREE.Vector3(
      Math.random() * 100 - 50,
      Math.random() * 100,
      Math.random() * 100 - 50
    );
    const speed = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos.x, pos.y, pos.z);

    boids.push(new Boid(pos, speed, mesh, id));
  }

  boids.forEach((boid) => {
    scene.add(boid.mesh);
  });
}

function reset() {
  resetCameraPosition(controls);
  updateRendererSize(parent, container, renderer, camera, cameraFov);
}

function initScene() {
  window.addEventListener("resize", reset);
  window.addEventListener("keydown", (e) => {
    if (e.key === "r") {
      reset();
    }
  });

  if (!container.value) return;

  // Set up Three.js environment
  camera = createCamera(container.value, cameraFov);
  renderer = createRenderer(container.value);
  water = createWater(scene);
  createSky(water, scene, renderer);
  container.value.appendChild(renderer.domElement);
  controls = createControls(camera, renderer);
  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(water);
  scene.add(light);
}

function animate() {
  // stats.begin()
  if (document.hidden) return;
  // Animate water
  water.material.uniforms["time"].value += 1.0 / 60.0;

  // Animate boids
  boids.forEach((boid) => {
    boid.update(boids, 0.5, {
      aliCoef: 5,
      cohCoef: 0.05,
      sepCoef: 2,
    });
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
</script>
