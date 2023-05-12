<script lang="ts" setup>
import { DomEvent, marker } from 'leaflet'

import type LMap from '@/components/LMap.vue'
import { debounce, findRealParent, remapEvents } from '@/utils'
import {
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toRef,
  useAttrs,
  watch
} from 'vue'

type Props = {
  readonly latLng: Parameters<typeof marker>[0]
  readonly hidden?: boolean
  readonly layerName?: string
  readonly layerType?: 'base' | 'overlay'
  readonly options?: Parameters<typeof marker>[1]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof marker>): void
  (e: 'update:visible', isVisible: boolean): void
  (e: 'update:lat-lng', latLng: Props['latLng']): void
}>()
defineOptions({ inheritAttrs: false, name: 'LMarker' })

const instance = getCurrentInstance()
const attrs = useAttrs()

const mapObject = ref<ReturnType<typeof marker>>()
provide('_MapObject', mapObject)

const parentContainer = ref<InstanceType<typeof LMap>>()
const debouncedLatLngSync = ref(debounce(latLngSync, 100))
const ready = ref(false)

// NOTE: watch props then update layer
const latLng = toRef(props, 'latLng')
const hidden = toRef(props, 'hidden')
const options = toRef(props, 'options')
const layerName = toRef(props, 'layerName')
const layerType = toRef(props, 'layerType')
watch(latLng, () => remove() && create())
watch(hidden, () => remove() && create())
watch(options, () => remove() && create())
watch(layerName, () => remove() && create())
watch(layerType, () => remove() && create())

onMounted(() => {
  parentContainer.value = findRealParent<InstanceType<typeof LMap>>(instance?.parent)
  if (!parentContainer.value?.mapObject) return

  create()

  ready.value = true
  nextTick(() => mapObject.value && emit('ready', mapObject.value))
})

onBeforeUnmount(remove)

defineExpose({ mapObject, unbindPopup, unbindTooltip })

function create() {
  if (!parentContainer.value?.mapObject) {
    throw new Error("Can't not find parent element.")
  }
  if (mapObject.value) {
    throw new Error("Can't not create because object already exists.")
  }

  mapObject.value = marker(latLng.value, options.value)
  parentContainer.value.handleAddLayer(
    {
      mapObject: mapObject.value,
      name: layerName.value,
      type: layerType.value,
      updateVisibleProp: (isVisible) => emit('update:visible', isVisible),
      visible: !hidden.value
    },
    hidden.value
  )

  // @ts-expect-error: TS2769 because the library definition is wrong
  mapObject.value.on('move', debouncedLatLngSync.value)
  DomEvent.on(mapObject.value as unknown as HTMLElement, remapEvents(attrs))

  return true
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.")
  }

  parentContainer.value?.handleRemoveLayer({
    mapObject: mapObject.value,
    name: layerName.value,
    type: layerType.value,
    updateVisibleProp: (isVisible) => emit('update:visible', isVisible),
    visible: !hidden.value
  })

  DomEvent.off(mapObject.value as unknown as HTMLElement, remapEvents(attrs))
  debouncedLatLngSync.value.cancel()

  mapObject.value = undefined

  return true
}

function latLngSync(event: { latlng: Parameters<typeof marker>[0] }) {
  emit('update:lat-lng', event.latlng)
}
function unbindPopup() {
  const popup = mapObject.value?.getPopup()
  popup?.unbindPopup()
}
function unbindTooltip() {
  const tooltip = mapObject.value?.getTooltip()
  tooltip?.unbindTooltip()
}
</script>

<template>
  <div style="display: none">
    <slot v-if="ready"></slot>
  </div>
</template>
