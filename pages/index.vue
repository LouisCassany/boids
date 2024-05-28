<template>
  <div class="h-dvh w-full overflow-hidden flex justify-center relative">
    <scene3D ref="threeJS" />
    <Icons class="absolute right-4 top-4" @resetSimulation="resetSimulation" />
    <div class="absolute left-4 top-4 size-[250px] bg-white bg-opacity-40 rounded-md p-2">
      <Anemometre class="h-full" />
    </div>
    <MobileControls />
    <Controls />
  </div>
</template>

<script lang="ts" setup>
import Scene3D from "~/components/Scene3D.vue"
import ReconnectingWebSocket from "reconnecting-websocket"

const { input } = useModel()

const rws = new ReconnectingWebSocket("ws:localhost:8080/")

rws.addEventListener("open", () => {
  console.log("Web socket oppened")
})

rws.addEventListener("message", (event: any) => {
  const controls = JSON.parse(event.data)
  if (controls.LeftStickX) input.value.delta.val = controls.LeftStickX * 0.4
  if (controls.RightStickX) input.value.boat_heading_speed.val = controls.RightStickX * 0.5
  if (controls.North == "Button(0)" && threeJS.value) threeJS.value.reset()
})

const threeJS = ref<typeof Scene3D | null>(null)

function resetSimulation() {
  if (threeJS.value) threeJS.value.reset()
}
</script>
