<script lang="ts" setup>
import 'leaflet.locatecontrol';

import { control } from 'leaflet';

import type LMap from '@/components/LMap.vue';
import { findRealParent } from '@/utils';
import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue';

type Props = {
  readonly options?: Parameters<typeof control.locate>[0];
};
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'ready', mapObject: ReturnType<typeof control.locate>): void;
}>();
defineOptions({ inheritAttrs: false, name: 'LControlLocate' });

const instance = getCurrentInstance();

const mapObject = ref<ReturnType<typeof control.locate>>();
const parentContainer = ref<InstanceType<typeof LMap>>();

// NOTE: watch props then update control
const options = toRef(props, 'options');
watch(options, () => remove() && create());

onMounted(() => {
  parentContainer.value = findRealParent<InstanceType<typeof LMap>>(instance?.parent);
  if (!parentContainer.value?.mapObject) return;

  create();
  nextTick(() => mapObject.value && emit('ready', mapObject.value));
});

onBeforeUnmount(remove);

defineExpose({ mapObject });

function create() {
  if (!parentContainer.value?.mapObject) {
    throw new Error("Can't not find parent element.");
  }
  if (mapObject.value) {
    throw new Error("Can't not create because object already exists.");
  }

  mapObject.value = control.locate(options.value);
  mapObject.value.addTo(parentContainer.value.mapObject);

  return true;
}

function remove() {
  if (!mapObject.value) {
    throw new Error("Can't not remove because object doesn't exist.");
  }

  mapObject.value.remove();
  mapObject.value = undefined;

  return true;
}
</script>

<template>
  {{ null }}
</template>
