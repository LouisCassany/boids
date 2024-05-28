<template>
  <div ref="container" class="relative flex min-h-0 min-w-0 grow items-center justify-center">
    <div class="bg-primary text-primary-content absolute right-1 top-1 flex flex-col items-center rounded-md px-3 py-1 leading-none">
      <span :style="{ fontSize: _options.font - 8 + 'px' }">AWS</span>
      <span :style="{ fontSize: _options.font + 8 + 'px' }">
        {{ (state.aws * 1.94384).toFixed(1) }}
        <span :style="{ fontSize: _options.font - 8 + 'px' }">kts</span></span
      >
    </div>

    <div class="bg-secondary text-secondary-content absolute left-1 top-auto flex flex-col items-center rounded-md px-3 py-1 leading-none">
      <span :style="{ fontSize: _options.font - 8 + 'px' }">SOG</span>
      <span :style="{ fontSize: _options.font + 8 + 'px' }">
        {{ (state.boat_speed * 1.94384).toFixed(1) }}
        <span :style="{ fontSize: _options.font - 8 + 'px' }">kts</span></span
      >
    </div>

    <div class="bg-secondary text-secondary-content absolute left-1 top-1 flex flex-col items-center rounded-md px-3 py-1 leading-none">
      <span :style="{ fontSize: _options.font - 5 + 'px' }">TWS</span>
      <span :style="{ fontSize: _options.font + 8 + 'px' }">
        {{ settings.disturbance.TWS.val.toFixed(1) }}
        <span :style="{ fontSize: _options.font - 5 + 'px' }">kts</span>
      </span>
    </div>

    <div class="bg-primary text-primary-content absolute bottom-1 right-1 flex flex-col items-center rounded-md px-3 py-1 leading-none">
      <span :style="{ fontSize: _options.font - 8 + 'px' }">AWA</span>
      <span :style="{ fontSize: _options.font + 8 + 'px' }">{{ Math.abs(AWA).toFixed(0) }}°</span>
    </div>

    <div class="bg-secondary text-secondary-content absolute bottom-1 left-1 flex flex-col items-center rounded-md px-3 py-1 leading-none">
      <span :style="{ fontSize: _options.font - 5 + 'px' }">TWA</span>
      <span :style="{ fontSize: _options.font + 8 + 'px' }">{{ Math.abs(TWA).toFixed(0) }}°</span>
    </div>

    <svg :height="diameter" :width="diameter" class="gauge-svg">
      <!-- background circle -->
      <circle :cx="radius" :cy="radius" :r="radius" fill="transparent"></circle>

      <!-- sections -->
      <template v-for="item in _options.ranges">
        <path :d="createArcPath(item)" :fill="item.background"></path>
      </template>

      <!-- divisions -->
      <template v-for="item in division_properties.divisions">
        <img src="/boatPrint.svg" class="absolute h-1/2" />
        <line
          stroke="black"
          :x1="calcX(item.pos)"
          :x2="calcInnerX(item.pos)"
          :y1="calcY(item.pos)"
          :y2="calcInnerY(item.pos)"
          stroke-width="2"
        ></line>
        <text
          :style="{ fill: 'black', fontSize: _options.font + 'px' }"
          :x="calcLabelX(item.pos)"
          :y="calcLabelY(item.pos)"
          class="gauge-division-label"
        >
          {{ Math.abs(item.pos) + _options.unit }}
        </text>
      </template>

      <!-- subdivisions -->
      <template v-for="item in division_properties.subdivisions">
        <line
          stroke="black"
          :x1="calcInnerX(item.pos, _options.width / 2)"
          :x2="calcInnerX(item.pos)"
          :y1="calcInnerY(item.pos, _options.width / 2)"
          :y2="calcInnerY(item.pos)"
          class="gauge-subdivision"
        ></line>
      </template>

      <path :d="apparentArrowPath" fill="#570DF8"></path>
      <path :d="trueArrowPath" fill="#CC009C"></path>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue"
const { state } = useModel()
const { settings } = useSettings()

const TWA = computed(() => {
  return ((Math.PI + state.value.twa_b) * 180) / Math.PI > 180
    ? ((Math.PI + state.value.twa_b) * 180) / Math.PI - 360
    : ((Math.PI + state.value.twa_b) * 180) / Math.PI
})

const AWA = computed(() => {
  return ((Math.PI + state.value.awa_b) * 180) / Math.PI > 180
    ? ((Math.PI + state.value.awa_b) * 180) / Math.PI - 360
    : ((Math.PI + state.value.awa_b) * 180) / Math.PI
})

const props = defineProps<{
  fontSize?: number
}>()

// ##################
// ### PARAMETRES ###
// ##################

// For compatibility with other svg builded componenent, _options have to be a ref
const _options = ref({
  width: 20,
  divs: 12,
  ranges: [
    { background: "#d3d3d3", min: -180, max: -60 },
    { background: "red", min: -60, max: 0 },
    { background: "green", min: 0, max: 60 },
    { background: "#d3d3d3", min: 60, max: 180 },
  ],
  background: "#fff",
  subdivs: 4,
  font: props.fontSize || 16,
  decimal: 0,
  unit: "°",
})

const arrow_width = 18
const center_radius = 22

// ##################
// ### FIN PARAMS ###
// ##################

const diameter = ref(200)
const AWS_label_width = ref(10)
const radius = computed(() => diameter.value / 2)
const inner_radius = computed(() => radius.value - _options.value.width)
const AWA_label_top = ref(0)

// ######################
// ### GESTION RESIZE ###
// ######################

//Enter font size for each diameter in decreasing order (diameter in px)
// Ex : diam>300 => font=20; diam>200 => font=16; diam>100 => font=14
const fontsize = [
  { diam: 300, font: 20 },
  { diam: 200, font: 16 },
  { diam: 100, font: 14 },
]

const container = ref<HTMLElement | null>(null)
onMounted(() => {
  window.addEventListener("resize", updateParentSize)
  updateParentSize()
})

function updateParentSize() {
  if (!container.value) return
  diameter.value = Math.min(container.value.clientWidth, container.value.clientHeight) * 0.95
  AWS_label_width.value = container.value.clientWidth / 2 - radius.value + 15
  AWA_label_top.value = container.value.clientHeight / 2 - center_radius - _options.value.font - 15
}

const division_properties = computed(() => {
  let spread = min_max.value[1] - min_max.value[0]
  let divisions = []
  let subdivisions = []
  let val = min_max.value[0]
  let step = Math.round(spread / _options.value.divs)

  for (let i = 1; i <= _options.value.divs; i++) {
    let subval = val
    for (let n = 1; n < _options.value.subdivs; n++) {
      subval += Math.round(step / _options.value.subdivs)
      subdivisions.push({ pos: subval })
    }
    val += step
    divisions.push({ pos: val })
  }

  let subval = val
  for (let n = 1; n < _options.value.subdivs; n++) {
    subval += Math.round(step / _options.value.subdivs)
    subdivisions.push({ pos: subval })
  }

  return { divisions: divisions, subdivisions: subdivisions }
})

const min_max = computed(() => {
  let min_max = [_options.value.ranges[0].min, _options.value.ranges[0].max]
  for (let item of _options.value.ranges) {
    if (min_max[0] > item.min) min_max[0] = item.min
    if (min_max[1] < item.max) min_max[1] = item.max
  }
  return min_max
})

// ############################
// ### CALCULS DE POSITIONS ###
// ############################

function calcX(value: number, offset = 0) {
  const angle = calcAngle(value)
  return radius.value + (radius.value + offset) * Math.cos(angle + Math.PI)
}

function calcInnerX(value: number, offset = 0) {
  const angle = calcAngle(value)
  return radius.value + (inner_radius.value + offset) * Math.cos(angle + Math.PI)
}

function calcY(value: number, offset = 0) {
  const angle = calcAngle(value)
  return radius.value + (radius.value + offset) * Math.sin(angle + Math.PI)
}

function calcInnerY(value: number, offset = 0) {
  const angle = calcAngle(value)
  return radius.value + (inner_radius.value + offset) * Math.sin(angle + Math.PI)
}

function calcLabelX(value: number) {
  const angle = calcAngle(value)
  const labelRadius =
    inner_radius.value - ((Math.max(String(min_max.value[1]).length, String(min_max.value[0]).length) / 2) * _options.value.font) / 2
  return radius.value + labelRadius * Math.cos(angle + Math.PI)
}

function calcLabelY(value: number) {
  const angle = calcAngle(value)
  const labelRadius = inner_radius.value - _options.value.font / 2.5 - 5
  return radius.value + labelRadius * Math.sin(angle + Math.PI)
}

function calcAngle(value: number) {
  const spread = min_max.value[1] - min_max.value[0]
  const anglePerUnit = (Math.PI * 2) / spread
  return (value - min_max.value[0]) * anglePerUnit - Math.PI / 2
}

// ################
// ### SVG PATH ###
// ################

type Item = {
  background: string
  min: number
  max: number
}

function createArcPath(item: Item) {
  const startAngle = calcAngle(item.min)
  const endAngle = calcAngle(item.max)
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1"
  const path = [
    `M ${calcX(item.min)} ${calcY(item.min)}`,
    `A ${radius.value} ${radius.value} 0 ${largeArcFlag} 1 ${calcX(item.max)} ${calcY(item.max)}`,
    `L ${calcInnerX(item.max)} ${calcInnerY(item.max)}`,
    `A ${inner_radius.value} ${inner_radius.value} 0 ${largeArcFlag} 0 ${calcInnerX(item.min)} ${calcInnerY(item.min)}`,
    `Z`,
  ].join(" ")
  return path
}

const apparentArrowPath = computed(() => {
  const angle = calcAngle(AWA.value)
  const beta = Math.asin(arrow_width / 2 / center_radius)
  const arrow_dx1 = Math.cos(angle - beta + Math.PI) * center_radius
  const arrow_dx2 = Math.cos(angle + beta + Math.PI) * center_radius
  const arrow_dy = Math.sin(angle - beta + Math.PI) * center_radius
  const arrow_dy2 = Math.sin(angle + beta + Math.PI) * center_radius

  const path = [
    `M ${radius.value + arrow_dx1} ${radius.value + arrow_dy}`,
    `L ${calcInnerX(AWA.value)} ${calcInnerY(AWA.value)}`,
    `L ${radius.value + arrow_dx2} ${radius.value + arrow_dy2}`,
    `A ${center_radius * 0.2} ${center_radius * 0.2} 0 1 1 ${radius.value + arrow_dx1} ${radius.value + arrow_dy}`,
    `Z`,
  ].join(" ")
  return path
})

const trueArrowPath = computed(() => {
  const angle = calcAngle(TWA.value)
  const beta = Math.asin(arrow_width / 2 / center_radius)
  const arrow_dx1 = Math.cos(angle - beta + Math.PI) * center_radius
  const arrow_dx2 = Math.cos(angle + beta + Math.PI) * center_radius
  const arrow_dy = Math.sin(angle - beta + Math.PI) * center_radius
  const arrow_dy2 = Math.sin(angle + beta + Math.PI) * center_radius

  const path = [
    `M ${radius.value + arrow_dx1} ${radius.value + arrow_dy}`,
    `L ${calcInnerX(TWA.value)} ${calcInnerY(TWA.value)}`,
    `L ${radius.value + arrow_dx2} ${radius.value + arrow_dy2}`,
    `A ${center_radius * 0.2} ${center_radius * 0.2} 0 1 1 ${radius.value + arrow_dx1} ${radius.value + arrow_dy}`,
    `Z`,
  ].join(" ")
  return path
})
</script>

<style scoped>
.gauge-svg {
  overflow: visible;
}

.gauge-division-label {
  fill: #000;
  stroke: none;
  font-size: 12px;
  text-anchor: middle;
  alignment-baseline: central;
}
</style>
