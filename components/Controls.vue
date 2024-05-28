<template>
  <div
    class="absolute hidden lg:flex bottom-4 w-[90%] sm:w-[33%] sm:left-4 bg-white bg-opacity-50 font-mono font-bold rounded-md items-center justify-between gap-4 p-4"
  >
    <div class="w-full flex flex-col">
      <div v-for="controlInput in input" class="w-full">
        <div class="flex justify-between items-center">
          <div>{{ controlInput.name }}</div>
          <div class="text-xl">{{ Number(controlInput.val).toFixed(2) }}</div>
        </div>
        <input type="range" class="w-full" v-model="controlInput.val" :min="controlInput.min" :max="controlInput.max" :step="controlInput.step" />
      </div>
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
