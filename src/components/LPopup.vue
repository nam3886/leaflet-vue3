<script lang="ts" setup>
import { DomEvent, popup, type LatLngExpression } from 'leaflet'

import type LMarker from '@/components/LMarker.vue'
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

type Props = {
  readonly latLng: LatLngExpression
  readonly content?: string
  readonly openOnCreated?: boolean
  readonly options?: Parameters<typeof popup>[0]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof popup>): void
  (e: 'update:visible', isVisible: boolean): void
}>()
defineOptions({ inheritAttrs: false, name: 'LPopup' })

const instance = getCurrentInstance()
const attrs = useAttrs()
const rootRef = ref<InstanceType<typeof HTMLDivElement>>()

const mapObject = ref<ReturnType<typeof popup>>()

const parentContainer = ref<InstanceType<typeof LMarker>>()
const ready = ref(false)

// NOTE: watch props then update layer
const latLng = toRef(props, 'latLng')
const content = toRef(props, 'content')
const options = toRef(props, 'options')
watch(content, () => remove() && create())
watch(latLng, () => remove() && create())
watch(options, () => remove() && create())

onMounted(() => {
  parentContainer.value = findRealParent<InstanceType<typeof LMarker>>(instance?.parent)
  if (!parentContainer.value?.mapObject) return

  create()

  ready.value = true
  nextTick(() => mapObject.value && emit('ready', mapObject.value))
})

onBeforeUnmount(remove)

defineExpose({ close, mapObject, open })

function create() {
  if (!parentContainer.value?.mapObject) {
    throw new Error("Can't not find parent element.")
  }
  if (mapObject.value) {
    throw new Error("Can't not create because object already exists.")
  }

  mapObject.value = popup(options.value)
  mapObject.value.setLatLng(latLng.value)

  DomEvent.on(mapObject.value as unknown as HTMLElement, remapEvents(attrs))

  mapObject.value.setContent(content.value || rootRef.value || '')
  parentContainer.value.mapObject.bindPopup(mapObject.value)

  return true
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.")
  }

  if (parentContainer.value?.unbindPopup) {
    parentContainer.value.unbindPopup()
  } else if (parentContainer.value?.mapObject?.unbindPopup) {
    parentContainer.value.mapObject.unbindPopup()
  }

  DomEvent.off(mapObject.value as unknown as HTMLElement, remapEvents(attrs))

  mapObject.value = undefined

  return true
}

function open() {
  parentContainer.value?.mapObject?.openPopup()
}
function close() {
  parentContainer.value?.mapObject?.closePopup()
}
</script>

<template>
  <div ref="rootRef">
    <slot v-if="ready"></slot>
  </div>
</template>
