<template>
  <div class="flex flex-col gap-4">
    <Action keyboardShortcut="p" class="hidden">
      <Cog6ToothIcon class="size-8 text-blue-500" />
    </Action>

    <Action keyboardShortcut="f" @click="toggleFullScreen">
      <ArrowsPointingInIcon v-if="isFullScreen" class="size-8 text-blue-500" />
      <ArrowsPointingOutIcon v-else class="size-8 text-blue-500" />
    </Action>

    <Action keyboardShortcut="r" @click="$emit('resetSimulation')">
      <ArrowPathIcon class="size-8 text-blue-500" />
    </Action>
  </div>
</template>

<script lang="ts" setup>
import { ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon, Cog6ToothIcon } from "@heroicons/vue/24/solid"

const isFullScreen = ref(false)
const emit = defineEmits(["resetSimulation"])

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "f") {
      toggleFullScreen()
    }
  })
})

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullScreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullScreen.value = false
      // setTimeout(() => emit("resetSimulation"), 500)
    }
  }
}
</script>
