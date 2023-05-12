<script lang="ts" setup>
import { DomEvent, tileLayer } from 'leaflet'

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

type Props = {
  readonly url: string
  readonly hidden?: boolean
  readonly layerName?: string
  readonly layerType?: 'base' | 'overlay'
  readonly options?: Parameters<typeof tileLayer>[1]
  readonly titleLayerClass?: typeof tileLayer
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof tileLayer>): void
  (e: 'update:visible', isVisible: boolean): void
}>()
defineOptions({ inheritAttrs: false, name: 'LTileLayer' })

const instance = getCurrentInstance()
const attrs = useAttrs()

const mapObject = ref<ReturnType<typeof tileLayer>>()
const parentContainer = ref<InstanceType<typeof LMap>>()

// NOTE: watch props then update layer
const url = toRef(props, 'url')
const hidden = toRef(props, 'hidden')
const options = toRef(props, 'options')
const titleLayerClass = toRef(props, 'titleLayerClass')
const layerName = toRef(props, 'layerName')
const layerType = toRef(props, 'layerType')
watch(url, () => remove() && create())
watch(hidden, () => remove() && create())
watch(options, () => remove() && create())
watch(titleLayerClass, () => remove() && create())
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

  mapObject.value = (titleLayerClass.value || tileLayer)(url.value, options.value)
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

  mapObject.value = undefined

  return true
}
</script>

<template>
  {{ null }}
</template>
