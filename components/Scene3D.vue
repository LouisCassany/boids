<template>
  <div ref="parent" class="w-full h-full flex relative">
    <div class="h-full w-full" ref="container" />
    <div class="inset-center bg-blue-800 text-white p-4 rounded-md" :class="{ hidden: loadingProgress.finished }">
      Chargement... ({{ loadingProgress.progress.toFixed(2) }}%)
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { createWater, createCamera, createRenderer, createControls, createSky, updateRendererSize, resetCameraPosition } from "../physics/landscape" // Custom made functions to draw the water, the sky etc
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Water } from "three/addons/objects/Water.js"
import Stats from "three/examples/jsm/libs/stats.module.js"

const { settings, defaultSettings } = useSettings()
const { state, input, output, resetModelInput, resetModelState, resetModelOutput, nextSimulationStep } = useModel()

const modelParams = settings.value.modelParams
const container = ref<HTMLElement | null>(null)
const parent = ref<HTMLElement | null>(null)
const loadingProgress = ref({ progress: 0, finished: false })
const simplifyMode = useLocalStorage("simplifyMode", false)
// var stats = new Stats()
// stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom)

// Settings
const scalingFactor = (4.5e-5 * Math.sqrt(modelParams.A_k.val)) / Math.sqrt(0.1)
const cameraFov = 75 //°;

let water: Water
let controls: OrbitControls
let voile: THREE.Group
let boat: THREE.Group
let renderer: THREE.WebGLRenderer
let scene = new THREE.Scene()
let camera: THREE.PerspectiveCamera
const leftLine = createLine("white")
const rightLine = createLine("white")
let trueWindHelper: THREE.ArrowHelper
const clock = new THREE.Clock()
let flightWindow: THREE.Group

defineExpose({ reset })

function reset() {
  resetCameraPosition(controls, modelParams.r.val)
  updateRendererSize(parent, container, renderer, camera, modelParams.r.val, cameraFov)
  resetModelInput()
  resetModelState()
  resetModelOutput()
  settings.value = defaultSettings
}

onMounted(async () => {
  window.addEventListener("resize", reset)
  window.addEventListener("keydown", (e) => {
    if (e.key === "r") {
      reset()
    }
  })

  if (!container.value) return

  // Set up Three.js environment
  camera = createCamera(container.value, cameraFov)
  renderer = createRenderer(container.value)
  water = createWater(scene)
  createSky(water, scene, renderer)
  container.value.appendChild(renderer.domElement)
  controls = createControls(camera, renderer)
  const light = new THREE.AmbientLight(0x404040) // soft white light
  scene.add(water)
  scene.add(light)
  scene.add(leftLine, rightLine)

  trueWindHelper = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), settings.value.disturbance.TWS.val, "pink")
  scene.add(trueWindHelper)

  // Create the flight window
  if (!simplifyMode.value) {
    flightWindow = createFlightWindow(modelParams.r.val + 1, 10)
    scene.add(flightWindow)
  }

  // Load and add kite model
  voile = (await load_model("/assets/voile.glb")) as THREE.Group
  if (!voile) return
  voile.position.set(0, 0, 0)
  voile.scale.set(scalingFactor, scalingFactor, scalingFactor)
  scene.add(voile)

  // Load and add boat model
  const boat_model = (await load_model("/assets/coast_guard.glb", true)) as THREE.Group
  if (!boat_model) return
  boat = new THREE.Group()
  boat.add(boat_model)
  boat_model.position.set(-5, 0, 0)
  scene.add(boat)

  if (!simplifyMode.value) {
    // Load island
    const island1 = (await load_model("/assets/island.glb", true)) as THREE.Group
    if (!island1) return
    island1.scale.set(3, 3, 3)
    island1.position.set(200, 0, -100)
    scene.add(island1)

    // Load island
    const island2 = (await load_model("/assets/island.glb", true)) as THREE.Group
    if (!island2) return
    island2.position.set(100, 5, 25)
    island2.rotateY(Math.PI / 2)
    scene.add(island2)
  }

  loadingProgress.value.finished = true
  reset()
  animate()
})

function animate() {
  // stats.begin()
  if (document.hidden) return
  const deltaTime = clock.getDelta()

  // Orient true wind helper
  trueWindHelper.rotation.y = radians(-settings.value.disturbance.TWA_mg.val)
  trueWindHelper.setLength(settings.value.disturbance.TWS.val, 1, 1)

  // Animate water
  water.material.uniforms["time"].value += 1.0 / 60.0

  // Update simultation state
  const out = nextSimulationStep(state.value, input.value, deltaTime)
  state.value = out.state
  output.value = out.output

  // Update the kite position
  displayKite(voile)

  // Update the boat position
  boat.rotation.y = -state.value.boat_heading
  if (!simplifyMode.value) flightWindow.rotation.z = state.value.awa_mg

  controls.update()
  renderer.render(scene, camera)
  // stats.end()
  requestAnimationFrame(animate)
}

function load_model(path: string, isBoat: boolean = false) {
  return new Promise((resolve, _) => {
    const voile_loader = new GLTFLoader()
    voile_loader.load(
      path,
      (gltf) => {
        // const light = new THREE.AmbientLight(0x404040) // soft white ligh
        // gltf.scene.add(light)
        resolve(gltf.scene)
      },
      (event: any) => {
        if (isBoat) loadingProgress.value.progress = Math.min(90, (event.loaded / event.total) * 90)
      }
    )
  })
}

function displayKite(voile: THREE.Group) {
  // BTS phi convention convertion
  const phi = -state.value.phi
  const { theta, psi } = state.value
  const r = modelParams.r.val
  const { leftTether, rightTether } = output.value

  // Polar to cartesian transformation
  voile.position.x = Math.cos(phi) * Math.cos(theta) * r // + state.value.boat_px
  voile.position.y = Math.sin(theta) * r
  voile.position.z = Math.sin(phi) * Math.cos(theta) * r // + state.value.boat_py

  // Reset the kite position because the 3D model is facing the wrong way when we import it
  voile.rotation.set(Math.PI + psi, Math.PI / 2, 0)

  // Define 2 vector to retate around
  var yAxis = new THREE.Vector3(0, 1, 0)
  var zAxis = new THREE.Vector3(0, 0, 1)

  voile.rotateOnWorldAxis(zAxis, theta) // Elevation resulting rotation
  voile.rotateOnWorldAxis(yAxis, -phi) // Azimuth resulting rotation

  // Show the tethers
  leftLine.geometry.attributes.position.setXYZ(1, leftTether[0], -leftTether[2], -leftTether[1])
  leftLine.geometry.attributes.position.needsUpdate = true
  rightLine.geometry.attributes.position.setXYZ(1, rightTether[0], -rightTether[2], -rightTether[1])
  rightLine.geometry.attributes.position.needsUpdate = true
}

function createLine(color: THREE.ColorRepresentation | undefined) {
  const material2 = new THREE.LineBasicMaterial({ color })
  const points = []
  points.push(new THREE.Vector3(0, 0, 0))
  points.push(new THREE.Vector3(0, 20, 20))

  const geometry2 = new THREE.BufferGeometry().setFromPoints(points)
  const line = new THREE.Line(geometry2, material2)
  return line
}

function createFlightWindow(radius: number, sections: number) {
  const path = new THREE.Path()
  const group = new THREE.Group()
  const material = new THREE.LineBasicMaterial({
    color: "black",
  })

  for (let theta = 0; theta <= radians(90); theta += radians(90) / sections) {
    path.absarc(0, 0, radius, -radians(90), radians(90))
    const points = path.getPoints(20)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material)
    line.rotateY(theta)
    group.add(line)
  }

  for (let phi = radians(180) / sections; phi <= radians(180) - radians(180) / sections; phi += radians(180) / sections) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, radians(90), false, 0)
    const points = curve.getPoints(20)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const ellipse = new THREE.Line(geometry, material)
    ellipse.rotateY(radians(90))
    ellipse.rotateZ(radians(-90))
    ellipse.rotateY(-phi)
    group.add(ellipse)
  }

  group.rotation.x = radians(90)
  return group
}

function radians(degrees: number) {
  return (degrees * Math.PI) / 180
}
</script>

<style scoped>
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer components {
  .icon {
    @apply bg-blue-400 bg-opacity-50 w-12 h-12 rounded-md text-white cursor-pointer hover:bg-blue-800 p-3;
  }
}
.inset-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
