<template>
  <div class="absolute bottom-4 w-[90%] sm:w-[50%] lg:hidden sm:right-4 flex flex-col bg-white bg-opacity-50 p-2 font-mono font-bold rounded-md">
    <div class="w-full">
      <div class="flex justify-between">
        <div>Commande différentielle (m)</div>
        <div class="text-xl">{{ Number(input.delta.val).toFixed(2) }}</div>
      </div>
      <input type="range" class="w-full" v-model="input.delta.val" :min="input.delta.min" :max="input.delta.max" :step="input.delta.step" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { input } = useModel()
</script>

<style scoped>
input[orient="vertical"] {
  writing-mode: vertical-lr;
  direction: rtl;
}
</style>
