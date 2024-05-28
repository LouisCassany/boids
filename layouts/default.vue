<template>
  <div class="drawer lg:drawer-open drawer-end">
    <input id="drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col items-center justify-center">
      <slot />
    </div>
    <div class="drawer-side" v-if="vw > 1024">
      <label for="drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <div class="p-4 w-[400px] min-h-full text-base-content flex flex-col gap-4">
        <CustomChart :dataToPlot="chartData" :labels="chartLabels" class="h-[200px]" />

        <div class="form-control w-52">
          <label class="cursor-pointer label">
            <span class="label-text">Simplify</span>
            <input type="checkbox" class="toggle toggle-primary" v-model="simplifyMode" />
          </label>
        </div>

        <CustomInput
          v-model="settings.disturbance.TWA_mg.val"
          :name="settings.disturbance.TWA_mg.name"
          :max="settings.disturbance.TWA_mg.max"
          :min="settings.disturbance.TWA_mg.min"
          :step="settings.disturbance.TWA_mg.step"
          :disabled="false"
        />

        <CustomInput
          v-model="settings.disturbance.TWS.val"
          :name="settings.disturbance.TWS.name"
          :max="settings.disturbance.TWS.max"
          :min="settings.disturbance.TWS.min"
          :step="settings.disturbance.TWS.step"
          :disabled="false"
        />

        <CustomInput
          v-for="param in settings.modelParams"
          v-model="param.val"
          :name="param.name"
          :max="param.max"
          :min="param.min"
          :step="param.step"
          :disabled="param.disabled"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { settings } = useSettings()
const { output } = useModel()
const simplifyMode = useLocalStorage("simplifyMode", false)

// Reload window when simplify mode is toggled
watch(simplifyMode, () => {
  window.location.reload()
})

const chartLabels = ref(["Traction kite (Kg)"])

const chartData = computed(() => {
  return {
    time: Date.now(),
    values: [output.value.traction / 9.81],
  }
})

const vw = ref(0)

onMounted(() => {
  vw.value = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
})

// Update the viewport width on resize
window.addEventListener("resize", () => {
  vw.value = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
})
</script>

<style scoped>
/* width */
::-webkit-scrollbar {
  width: 5px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: blue;
  border-radius: 10px;
}
</style>
