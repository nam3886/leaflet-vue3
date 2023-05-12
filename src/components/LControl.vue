<script lang="ts" setup>
import { type ControlOptions, Control, DomEvent } from 'leaflet'

import type LMap from '@/components/LMap.vue'
import { findRealParent } from '@/utils'
import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'

type Props = {
  readonly disableClickPropagation?: boolean
  readonly disableScrollPropagation?: boolean
  readonly options?: ControlOptions
}
const props = defineProps<Props>()

type MapObject = {
  element: HTMLDivElement | undefined
  onAdd(): HTMLDivElement | undefined
  setElement(el: HTMLDivElement | undefined): void
} & Control
const emit = defineEmits<{
  (e: 'ready', mapObject: MapObject): void
}>()
defineOptions({ inheritAttrs: false, name: 'LControl' })

const instance = getCurrentInstance()

const mapObject = ref<MapObject>()
const rootRef = ref<InstanceType<typeof HTMLDivElement>>()
const parentContainer = ref<InstanceType<typeof LMap>>()
const ready = ref(false)

// NOTE: watch props then update control
const options = toRef(props, 'options')
watch(options, () => remove() && create())

onMounted(() => {
  parentContainer.value = findRealParent<InstanceType<typeof LMap>>(instance?.parent)
  if (!parentContainer.value?.mapObject) return

  create()

  ready.value = true
  nextTick(() => mapObject.value && emit('ready', mapObject.value))
})

onBeforeUnmount(remove)

defineExpose({ mapObject })

function create() {
  if (!parentContainer.value?.mapObject) {
    throw new Error("Can't not find parent element.")
  }
  if (mapObject.value) {
    throw new Error("Can't not create because object already exists.")
  }

  const LControl = Control.extend({
    element: undefined as HTMLDivElement | undefined,
    onAdd() {
      return this.element
    },
    setElement(el: HTMLDivElement | undefined) {
      this.element = el
    }
  })

  mapObject.value = new LControl(options.value)
  mapObject.value.setElement(rootRef.value)
  if (props.disableClickPropagation && rootRef.value) {
    DomEvent.disableClickPropagation(rootRef.value)
  }
  if (props.disableScrollPropagation && rootRef.value) {
    DomEvent.disableScrollPropagation(rootRef.value)
  }
  mapObject.value.addTo(parentContainer.value.mapObject)

  return true
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.")
  }

  mapObject.value.remove()
  mapObject.value = undefined

  return true
}
</script>

<template>
  <div ref="rootRef">
    <slot v-if="ready"></slot>
  </div>
</template>
