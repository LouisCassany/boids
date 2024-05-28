<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const vw = ref(0);

onMounted(() => {
  vw.value = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
});

// Update the viewport width on resize
window.addEventListener("resize", () => {
  vw.value = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
});
</script>
