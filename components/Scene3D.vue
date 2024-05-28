<template>
  <div ref="parent" class="w-full h-full flex relative">
    <div class="h-full w-full" ref="container" />
  </div>
</template>

<script lang="ts" setup>
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
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

const container = ref<HTMLElement | null>(null);
const parent = ref<HTMLElement | null>(null);

let water: Water;
let controls: OrbitControls;
let renderer: THREE.WebGLRenderer;
let scene = new THREE.Scene();
let camera: THREE.PerspectiveCamera;
const cameraFov = 75; //°

defineExpose({ reset });

function reset() {
  resetCameraPosition(controls);
  updateRendererSize(parent, container, renderer, camera, cameraFov);
}

onMounted(async () => {
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
  reset();
  animate();
});

function animate() {
  // stats.begin()
  if (document.hidden) return;
  // Animate water
  water.material.uniforms["time"].value += 1.0 / 60.0;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
</script>
