<template>
  <div class="flex items-center gap-4">
    <kbd v-if="props.keyboardShortcut" class="kbd bg-white bg-opacity-50 text-black">{{ props.keyboardShortcut }}</kbd>
    <div class="btn p-2 border-0 bg-white bg-opacity-40 rounded-md">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  keyboardShortcut: string
}>()
</script>
