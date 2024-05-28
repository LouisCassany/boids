<template>
  <div class="h-full">
    <canvas ref="canvas" />
  </div>
</template>

<script setup lang="ts">
//@ts-expect-error
import { Chart, registerables } from "chart.js"
//@ts-expect-error
import ChartStreaming from "chartjs-plugin-streaming"
import "chartjs-adapter-luxon"

Chart.register(...registerables)
Chart.register(ChartStreaming)
Chart.defaults.font.weight = "bold"

const props = defineProps<{
  labels: string[]
  dataToPlot: { time: number; values: number[] } | null
  convertToDegrees?: boolean
  yAxisLimits?: { min: number; max: number }
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const chart = ref<Chart | null>(null)

onMounted(() => {
  if (canvas.value) {
    chart.value = new Chart(canvas.value, chartConfig.value)
  }
})

onUnmounted(() => {
  chart.value?.destroy()
})

const datasets = computed(() => {
  const out = props.labels.map((label, index) => {
    return {
      label: label,
      data: [],
      borderColor: standardColors[index % standardColors.length],
      backgroundColor: "rgba(0,0,0,0)",
    }
  })
  return out
})

const chartConfig = computed(() => {
  const config = {
    type: "line",
    data: {
      datasets: datasets.value,
    },
    options: {
      elements: {
        point: {
          radius: 0,
        },
      },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: {
          type: "realtime",
          ticks: {
            color: "black",
          },
        },
        y: {
          min: props.yAxisLimits?.min,
          max: props.yAxisLimits?.max,
          ticks: {
            color: "black",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "black",
          },
        },
        streaming: {
          refresh: 100,
          frameRate: 25,
          delay: 100,
        },
        tooltip: {
          enabled: false,
        },
        datalabels: {
          display: false,
        },
      },
      parsing: false,
      normalized: false,
    },
  }
  return config
})

let lastTime = 0

watchEffect(() => {
  if (!props.dataToPlot || !chart.value) return
  const currentTime = props.dataToPlot.time

  if (currentTime - lastTime < 50) return

  lastTime = currentTime

  props.dataToPlot.values.forEach((value, index) => {
    chart.value?.data.datasets[index]?.data?.push({
      x: currentTime,
      y: props.convertToDegrees ? (value * 180) / Math.PI : value,
    })
  })
})

const standardColors = [
  "rgba(87, 13, 248, 1)", // Blue
  "rgba(255, 99, 132, 1)", // Red
  "rgba(255, 206, 86, 1)", // Yellow
  "rgba(75, 192, 192, 1)", // Green
  "rgba(153, 102, 255, 1)", // Purple
  "rgba(255, 159, 64, 1)", // Orange
  "rgba(255, 0, 0, 1)", // Red
  "rgba(0, 255, 0, 1)", // Lime
  "rgba(0, 0, 255, 1)", // Blue
  "rgba(255, 255, 0, 1)", // Yellow
  "rgba(0, 255, 255, 1)", // Cyan / Aqua
  "rgba(255, 0, 255, 1)", // Magenta / Fuchsia
  "rgba(128, 0, 0, 1)", // Maroon
  "rgba(0, 128, 0, 1)", // Green
  "rgba(0, 0, 128, 1)", // Navy
  "rgba(128, 128, 0, 1)", // Olive
  "rgba(128, 0, 128, 1)", // Purple
  "rgba(0, 128, 128, 1)", // Teal
  "rgba(139, 69, 19, 1)", // Saddle Brown
  "rgba(184, 134, 11, 1)", // Dark Goldenrod
  "rgba(218, 165, 32, 1)", // Goldenrod
  "rgba(255, 0, 0, 1)", // Red
  "rgba(255, 165, 0, 1)", // Orange
  "rgba(255, 255, 0, 1)", // Yellow
  "rgba(0, 128, 0, 1)", // Green
  "rgba(0, 0, 255, 1)", // Blue
  "rgba(75, 0, 130, 1)", // Indigo
  "rgba(238, 130, 238, 1)", // Violet
  "rgba(255, 255, 255, 1)", // White
  "rgba(0, 0, 0, 1)", // Black
]
</script>
