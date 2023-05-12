import { type Control, type Layer } from 'leaflet'

declare global {
  declare type MapLayer = {
    mapObject: Layer & { _leaflet_id?: string }
    handleAddLayer?: (layer: MapLayer, alreadyAdded?: boolean) => void
    handleRemoveLayer?: (layer: MapLayer, alreadyRemoved?: boolean) => void
    name?: string
    type?: 'base' | 'overlay'
    updateVisibleProp?: (isVisible: boolean) => void
    visible?: boolean
  }

  declare type MapControlLayer = {
    mapObject: Control.Layers & { _leaflet_id?: string }
    handleAddLayer?: (layer: MapLayer, alreadyAdded?: boolean) => void
    handleRemoveLayer?: (layer: MapLayer, alreadyRemoved?: boolean) => void
    updateVisibleProp?: (isVisible: boolean) => void
    visible?: boolean
  }
}

declare module 'leaflet' {
  namespace Control {
    interface MeasureOptions {
      activeColor?: string // base color for map features while actively measuring
      captureZIndex?: number // z-index of the marker used to capture measure events
      completedColor?: string // base color for permenant features generated from completed measure
      decPoint?: string
      popupOptions?: PopupOptions
      position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
      primaryAreaUnit?: 'acres' | 'hectares' | 'sqfeet' | 'sqmeters' | 'sqmiles'
      primaryLengthUnit?: 'feet' | 'meters' | 'miles' | 'kilometers'
      secondaryAreaUnit?: 'acres' | 'hectares' | 'sqfeet' | 'sqmeters' | 'sqmiles'
      secondaryLengthUnit?: 'feet' | 'meters' | 'miles' | 'kilometers'
      thousandsSep?: string
      units?: {
        [key: string]: {
          decimals: number // Required. Factor to apply when converting to this unit. Length in meters or area in sq meters will be multiplied by this factor.
          display: string // Required. How to display in results, like.. "300 Meters (0.3 My New Unit)".
          factor: number // Number of decimals to round results when using this unit. `0` is the default value if not specified.
        }
      }
    }

    class Measure extends Control {
      constructor(locateOptions?: MeasureOptions)
      onAdd(map: Map): HTMLElement
      onRemove(map: Map): void
    }
  }

  /**
   * Creates a Leaflet.Measure control
   */
  namespace control {
    function measure(options?: Control.MeasureOptions): Control.Measure
  }
}
