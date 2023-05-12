<script lang="ts" setup generic="CData extends any">
import { DomEvent, geoJSON } from 'leaflet'

import type LMap from '@/components/LMap.vue'
import { findRealParent, remapEvents } from '@/utils'
import {
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRef,
  useAttrs,
  watch
} from 'vue'

type Props<CData> = {
  readonly geojson: Parameters<typeof geoJSON<CData>>[0]
  readonly hidden?: boolean
  readonly layerName?: string
  readonly layerType?: 'base' | 'overlay'
  readonly options?: Parameters<typeof geoJSON<CData>>[1]
}
const props = defineProps<Props<CData>>()
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof geoJSON<CData>>): void
  (e: 'update:visible', isVisible: boolean): void
}>()
defineOptions({ inheritAttrs: false, name: 'LGeoJson' })

const instance = getCurrentInstance()
const attrs = useAttrs()

const mapObject = ref<ReturnType<typeof geoJSON<CData>>>()
const parentContainer = ref<InstanceType<typeof LMap>>()

const geojson = toRef(props, 'geojson')
const hidden = toRef(props, 'hidden')
const options = toRef(props, 'options')
const layerName = toRef(props, 'layerName')
const layerType = toRef(props, 'layerType')
watch(geojson, () => remove() && create())
watch(hidden, () => remove() && create())
watch(options, () => remove() && create())
watch(layerName, () => remove() && create())
watch(layerType, () => remove() && create())

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

  mapObject.value = geoJSON(geojson.value, options.value)
  parentContainer.value.handleAddLayer(
    {
      handleAddLayer,
      handleRemoveLayer,
      mapObject: mapObject.value,
      name: layerName.value,
      type: layerType.value,
      updateVisibleProp: (isVisible) => emit('update:visible', isVisible),
      visible: !hidden.value
    },
    hidden.value
  )

  DomEvent.on(mapObject.value as unknown as HTMLElement, remapEvents(attrs))

  return true
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.")
  }

  parentContainer.value?.handleRemoveLayer({
    handleAddLayer,
    handleRemoveLayer,
    mapObject: mapObject.value,
    name: layerName.value,
    type: layerType.value,
    updateVisibleProp: (isVisible) => emit('update:visible', isVisible),
    visible: !hidden.value
  })

  DomEvent.off(mapObject.value as unknown as HTMLElement, remapEvents(attrs))

  mapObject.value = undefined

  return true
}

function handleAddLayer(layer: MapLayer, alreadyAdded?: boolean) {
  if (!alreadyAdded) {
    mapObject.value?.addLayer(layer.mapObject)
  }
  parentContainer.value?.handleAddLayer(layer, true)
}

function handleRemoveLayer(layer: MapLayer, alreadyRemoved?: boolean) {
  if (!alreadyRemoved) {
    mapObject.value?.removeLayer(layer.mapObject)
  }
  parentContainer.value?.handleRemoveLayer(layer, true)
}
</script>

<template>
  {{ null }}
</template>
