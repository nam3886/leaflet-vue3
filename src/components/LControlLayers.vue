<script lang="ts" setup>
import { control } from 'leaflet'

import type LMap from '../components/LMap.vue'
import { findRealParent } from '../utils'
import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'

type Props = {
  readonly options?: Parameters<typeof control.layers>[2]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof control.layers>): void
  (e: 'update:visible', isVisible: boolean): void
}>()
defineOptions({ inheritAttrs: false, name: 'LControlLayers' })

const instance = getCurrentInstance()

const mapObject = ref<ReturnType<typeof control.layers>>()
const parentContainer = ref<InstanceType<typeof LMap>>()

// NOTE: watch props then update control
const options = toRef(props, 'options')
watch(options, () => remove() && create())

onMounted(() => {
  parentContainer.value = findRealParent<InstanceType<typeof LMap>>(instance?.parent)
  if (!parentContainer.value?.mapObject) return

  create()
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

  mapObject.value = control.layers(undefined, undefined, options.value)
  parentContainer.value.registerControlLayer({
    handleAddLayer,
    handleRemoveLayer,
    mapObject: mapObject.value,
    updateVisibleProp: (isVisible) => emit('update:visible', isVisible),
    visible: true
  })

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

function handleAddLayer(layer: MapLayer) {
  if (!layer.name) return

  if (layer.type === 'base') {
    mapObject.value?.addBaseLayer(layer.mapObject, layer.name)
  } else if (layer.type === 'overlay') {
    mapObject.value?.addOverlay(layer.mapObject, layer.name)
  }
}

function handleRemoveLayer(layer: MapLayer, alreadyRemoved?: boolean) {
  if (!alreadyRemoved) {
    mapObject.value?.removeLayer(layer.mapObject)
  }
}
</script>

<template>
  {{ null }}
</template>
