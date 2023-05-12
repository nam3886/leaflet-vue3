<script lang="ts" setup>
import { DomEvent, divIcon, icon, type Marker } from 'leaflet'

import { remapEvents } from '@/utils'
import {
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRef,
  useAttrs,
  watch,
  type Ref
} from 'vue'

type Props = {
  readonly options?: Parameters<typeof icon>[0] | Parameters<typeof divIcon>[0]
}
const props = defineProps<Props>()
type MapObject = ReturnType<typeof divIcon> | ReturnType<typeof icon>
const emit = defineEmits<{
  (e: 'ready', mapObject: MapObject): void
}>()
defineOptions({ inheritAttrs: false, name: 'LIcon' })

const attrs = useAttrs()

const parentContainer = inject<Ref<Marker<any> | undefined>>('_MapObject')
const mapObject = ref<MapObject>()
const rootRef = ref<InstanceType<typeof HTMLDivElement>>()
const ready = ref(false)

const oldMarkerIcon = ref<MapObject>()
const observer = ref<MutationObserver>()
const reCreationNeeded = ref(false)
const htmlSwapNeeded = ref(false)

// NOTE: watch props then update layer
const options = toRef(props, 'options')
watch(options, scheduleUpdateIcon)
watch(() => parentContainer?.value, scheduleUpdateIcon)

onMounted(() => {
  if (!rootRef.value) {
    throw new Error("Can't not find root element")
  }
  if (!parentContainer?.value) {
    throw new Error("Can't not find parent element.")
  }

  oldMarkerIcon.value = parentContainer.value.getIcon()

  observer.value = new MutationObserver(scheduleHtmlSwap)
  observer.value.observe(rootRef.value, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  })

  scheduleUpdateIcon()

  ready.value = true
  nextTick(() => mapObject.value && emit('ready', mapObject.value))
})

onBeforeUnmount(remove)

defineExpose({ mapObject })

function create() {
  if (!parentContainer?.value) {
    throw new Error("Can't not find parent element.")
  }

  // If only html of a divIcon changed, we can just replace the DOM without the need of recreating the whole icon
  if (
    htmlSwapNeeded.value &&
    !reCreationNeeded.value &&
    mapObject.value &&
    parentContainer.value.getElement()
  ) {
    parentContainer.value.getElement()!.innerHTML = rootRef.value?.innerHTML || ''
    htmlSwapNeeded.value = false

    return
  }

  if (!reCreationNeeded.value) return

  if (mapObject.value) {
    DomEvent.off(mapObject.value as unknown as HTMLElement, remapEvents(attrs))
  }

  if (isIconOptions(options.value, rootRef.value?.innerHTML)) {
    mapObject.value = icon(options.value)
  } else {
    mapObject.value = divIcon({
      ...options.value,
      className: options.value?.className || '',
      html: rootRef.value?.innerHTML || options.value?.html
    })
  }

  parentContainer.value.setIcon(mapObject.value)
  DomEvent.on(mapObject.value as unknown as HTMLElement, remapEvents(attrs))

  reCreationNeeded.value = false
  htmlSwapNeeded.value = false

  return true
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.")
  }

  observer.value?.disconnect()
  DomEvent.off(mapObject.value as unknown as HTMLElement, remapEvents(attrs))
  parentContainer?.value?.setIcon(oldMarkerIcon.value!)

  mapObject.value = undefined

  return true
}

function scheduleUpdateIcon() {
  reCreationNeeded.value = true
  nextTick(() => create())
}

function scheduleHtmlSwap() {
  htmlSwapNeeded.value = true
  nextTick(() => create())
}

function isIconOptions(
  options: Props['options'],
  innerHTML: string | undefined
): options is Parameters<typeof icon>[0] {
  return !!options && !('html' in options) && !innerHTML
}
</script>

<template>
  <div ref="rootRef" style="display: none">
    <slot v-if="ready"></slot>
  </div>
</template>
