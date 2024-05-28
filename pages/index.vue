<template>
  <div
    class="h-dvh w-full overflow-hidden flex justify-center relative bg-red-200"
  >
    <scene3D ref="threeJS" />
    <Icons class="absolute right-4 top-4" @resetSimulation="resetSimulation" />
  </div>
</template>

<script lang="ts" setup>
import Scene3D from "~/components/Scene3D.vue";

const threeJS = ref<typeof Scene3D | null>(null);

function resetSimulation() {
  if (threeJS.value) threeJS.value.reset();
}
</script>
