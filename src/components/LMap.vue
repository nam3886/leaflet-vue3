<script lang="ts" setup>
import {
  DomEvent,
  latLng,
  latLngBounds,
  map,
  type FitBoundsOptions,
  type LatLng,
  type LatLngBounds,
  type LatLngBoundsExpression,
  type MapOptions
} from 'leaflet'
import { useAttrs, type StyleValue } from 'vue'

import { debounce, remapEvents } from '@/utils'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// https://github.com/vuejs/core/issues/5551
export interface Props {
  readonly bounds?: LatLngBoundsExpression
  readonly fitBoundsOptions?: FitBoundsOptions
  readonly options?: Parameters<typeof map>[1]
  readonly rootClass?: any
  readonly rootStyle?: StyleValue
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof map>): void
  (e: 'update:zoom', zoom: number): void
  (e: 'update:center', center: LatLng): void
  (e: 'update:bounds', bounds: LatLngBounds): void
}>()
defineOptions({ inheritAttrs: false, name: 'LMap' })

const attrs = useAttrs()

const mapObject = ref<ReturnType<typeof map>>()
const rootRef = ref<InstanceType<typeof HTMLDivElement>>()
const ready = ref(false)

const lastSetCenter = ref<LatLng>()
const lastSetBounds = ref<LatLngBounds>()

const controlLayer = ref<MapControlLayer>()
const layersToAdd = ref<MapLayer[]>([])
const layersInControl = ref<MapLayer[]>([])

const debouncedMoveEndHandler = ref(debounce(moveEndHandler, 100))

watch(() => props.options?.zoom, setZoom)
watch(() => props.options?.crs, setCrs)
watch(() => props.options?.center, setCenter)
watch(() => props.bounds, setBounds)

onMounted(() => {
  create(props.options)
  props.bounds && fitBounds(props.bounds)

  ready.value = true
  nextTick(() => mapObject.value && emit('ready', mapObject.value))
})

onBeforeUnmount(remove)

defineExpose({
  fitBounds,
  handleAddLayer,
  handleRemoveLayer,
  mapObject,
  moveEndHandler,
  overlayAddHandler,
  overlayRemoveHandler,
  registerControlLayer,
  setBounds,
  setCenter,
  setCrs,
  setZoom
})

function create(options: Props['options'] | undefined) {
  if (!rootRef.value) {
    throw new Error("Can't not find root element")
  }
  if (mapObject.value) {
    throw new Error("Can't not create because object already exists.")
  }

  mapObject.value = map(rootRef.value, options)

  // @ts-expect-error: TS2769 because the library definition is wrong
  mapObject.value.on('moveend', debouncedMoveEndHandler.value)
  mapObject.value.on('overlayadd', overlayAddHandler)
  mapObject.value.on('overlayremove', overlayRemoveHandler)

  DomEvent.on(mapObject.value as unknown as HTMLElement, remapEvents(attrs))
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.")
  }

  DomEvent.off(mapObject.value as unknown as HTMLElement, remapEvents(attrs))
  debouncedMoveEndHandler.value.cancel()
  mapObject.value.remove()
}

// NOTE: update props
function setZoom(newVal: MapOptions['zoom']) {
  if (!mapObject.value || typeof newVal !== 'number') return

  mapObject.value.setZoom(newVal, { animate: props.options?.zoomAnimation })
  cacheMapView()
}
function setCrs(newVal: MapOptions['crs']) {
  if (!mapObject.value) return

  const prevBounds = mapObject.value.getBounds()
  mapObject.value.options.crs = newVal
  fitBounds(prevBounds, { animate: false })
}
function setCenter(newVal: MapOptions['center']) {
  if (!mapObject.value || !newVal) return

  const newCenter = latLng(newVal)
  const oldCenter = lastSetCenter.value || mapObject.value.getCenter()
  if (newCenter.equals(oldCenter)) return

  lastSetCenter.value = newCenter
  mapObject.value.panTo(newCenter, { animate: props.options?.zoomAnimation })
  cacheMapView(undefined, newCenter)
}
function setBounds(newVal: Props['bounds']) {
  if (!mapObject.value || !newVal) return

  const newBounds = latLngBounds(newVal as Parameters<typeof latLngBounds>[0])
  if (!newBounds.isValid()) return

  const oldBounds = lastSetBounds.value || mapObject.value.getBounds()
  if (oldBounds.equals(newBounds)) return

  fitBounds(newBounds)
  cacheMapView(newBounds)
}
function cacheMapView(bounds?: LatLngBounds, center?: LatLng) {
  if (!mapObject.value) return

  // Cache the last values used to define the map view by mutating props.
  lastSetBounds.value = bounds || mapObject.value.getBounds()
  lastSetCenter.value = center || lastSetBounds.value?.getCenter()
}
function fitBounds(
  bounds: Parameters<ReturnType<typeof map>['fitBounds']>[0],
  options?: Parameters<ReturnType<typeof map>['fitBounds']>[1]
) {
  mapObject.value?.fitBounds(bounds, { ...props.fitBoundsOptions, ...options })
}

// NOTE: map actions
function registerControlLayer(newControlLayer: MapControlLayer) {
  if (!mapObject.value) return

  controlLayer.value = newControlLayer
  mapObject.value.addControl(newControlLayer.mapObject)

  layersToAdd.value.forEach((layer) => newControlLayer.handleAddLayer?.(layer as MapLayer))
  layersToAdd.value = []
}
function handleRemoveLayer(layer: MapLayer, alreadyRemoved?: boolean) {
  if (!mapObject.value) return

  if (layer.type) {
    if (!controlLayer.value) {
      layersToAdd.value = layersToAdd.value.filter(({ name }) => name !== layer.name)
    } else {
      controlLayer.value.handleRemoveLayer?.(layer)
      layersInControl.value = layersInControl.value.filter(
        (l) => l.mapObject._leaflet_id !== layer.mapObject._leaflet_id
      )
    }
  }

  if (!alreadyRemoved) {
    mapObject.value.removeLayer(layer.mapObject)
  }
}
function handleAddLayer(layer: MapLayer, alreadyAdded?: boolean) {
  if (!mapObject.value) return

  if (layer.type) {
    if (!controlLayer.value) {
      layersToAdd.value.push(layer)
    } else {
      const exist = layersInControl.value.find(
        (l) => l.mapObject._leaflet_id === layer.mapObject._leaflet_id
      )

      if (!exist) {
        controlLayer.value.handleAddLayer?.(layer)
        layersInControl.value.push(layer)
      }
    }
  }

  if (!alreadyAdded && layer.visible) {
    mapObject.value.addLayer(layer.mapObject)
  }
}

// NOTE: Event handlers
function overlayAddHandler(e: { name: string }) {
  layersInControl.value.find((l) => l.name === e.name)?.updateVisibleProp?.(true)
}
function overlayRemoveHandler(e: { name: string }) {
  layersInControl.value.find((l) => l.name === e.name)?.updateVisibleProp?.(false)
}
function moveEndHandler() {
  if (!mapObject.value) return

  emit('update:zoom', mapObject.value.getZoom())
  emit('update:center', mapObject.value.getCenter())
  emit('update:bounds', mapObject.value.getBounds())
}
</script>

<template>
  <div ref="rootRef" :class="rootClass" class="vue-leaflet-map" :style="rootStyle">
    <slot v-if="ready"></slot>
  </div>
</template>

<style scoped>
.vue-leaflet-map {
  height: 100%;
  width: 100%;
}
</style>
