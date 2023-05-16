# leaflet-vue-next

Vue-leaflet, written and compatible with Vue 3!

This is a Beta version! And may yet be unstable! If you want to help, please reach out in an
[issue](https://github.com/vue-leaflet/vue-leaflet/issues) or on [discord](https://discord.gg/uVZAfUf),
or join the [discussions](https://github.com/vue-leaflet/vue-leaflet/discussions).

## What works

<!-- - LCircle -->
<!-- - LCircleMarker -->

- LControl
<!-- - LControlAttribution -->
- LControlLayers
<!-- - LControlScale -->
- LControlZoom
<!-- - LFeatureGroup -->
- LGeoJson
- LIcon
<!-- - LImageOverlay -->
- LMap
- LMarker
- LPolygon
- LPolyline
- LPopup
<!-- - LRectangle -->
- LTileLayer
- LTooltip
<!-- - LWmsTileLayer -->

## Installation

```bash
yarn add -D vue-leaflet-next
```

or

```bash
npm i -D vue-leaflet-next
```

## Usage

Until the complete documentation is ready, please check the
[component playground](https://github.com/vue-leaflet/vue-leaflet/tree/master/src/playground/views) examples or the
[demo project](https://github.com/vue-leaflet/vue3-demo-project/blob/master/src/App.vue) for usage with Vue 3.
Most component props mimic the vanilla [Leaflet options](https://leafletjs.com/reference-1.7.1.html) as closely as
possible, and generally remain the same as in their [Vue2Leaflet counterparts](https://vue2-leaflet.netlify.app/components/).

### Quickstart

```vue
<template>
  <div style="height:600px; width:800px">
    <l-map ref="map" v-model:zoom="zoom" :center="[47.41322, -1.219482]">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
    </l-map>
  </div>
</template>

<script>
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'

export default {
  components: {
    LMap,
    LTileLayer
  },
  data() {
    return {
      zoom: 2
    }
  }
}
</script>

<style></style>
```
