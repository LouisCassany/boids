<template>
  <div class="flex rounded-md bg-green-200">
    <div class="p-2 rounded-l-md border-2 text-white w-full bg-blue-800 border-blue-800 whitespace-nowrap">
      {{ props.name }}
    </div>
    <input
      type="number"
      v-model="model"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      class="text-center border-2 border-blue-800 rounded-r-md p-2 flex w-20"
      :class="{ 'not-selectable': props.disabled, 'bg-gray-400': props.disabled }"
      :disabled="props.disabled"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  name: string
  min: number
  max: number
  step: number
  disabled: boolean
}>()
const model = defineModel<Number>({ required: true })
</script>

<style scoped>
.not-selectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
