import type { Map as LeafletMap } from 'leaflet'
import type { ComponentInternalInstance, SetupContext } from 'vue'
import { Icon } from 'leaflet'

/**
 * It takes a function and returns a new function that will call the original function after a certain
 * amount of time has passed
 * @param fn - The function that you want to debounce.
 * @param {number} [time] - The time in milliseconds to wait before calling the function.
 * @returns A function that will call the passed in function after a certain amount of time.
 */
export const debounce = <T, D>(fn: (...agrs: T[]) => D, time?: number) => {
  let timeout: NodeJS.Timeout | undefined

  function debouncedFunction(...args: T[]) {
    // @ts-expect-error: TS2683 because in here we can get this
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      fn.apply(context, args)
      timeout = undefined
    }, time)
  }

  debouncedFunction.cancel = function () {
    if (timeout) {
      clearTimeout(timeout)
    }
  }

  return debouncedFunction
}

/**
 * It takes an object of attributes and returns an object of event handlers
 * @param attrs - SetupContext['attrs']
 * @returns An object with the event names as keys and the event handlers as values.
 */
export function remapEvents(attrs: SetupContext['attrs']) {
  const result: Record<string, (...agrs: unknown[]) => void> = {}

  for (const attrName in attrs) {
    if (attrName.startsWith('on') && !attrName.startsWith('onUpdate') && attrName !== 'onReady') {
      const eventName = attrName.slice(2).toLocaleLowerCase()
      result[eventName] = attrs[attrName] as (...agrs: unknown[]) => void
    }
  }

  return result
}

/**
 * It takes an object and returns a new object with all the null and undefined values removed
 * @param options - Record<string, any>
 * @returns A function that takes an object and returns a new object with all the null and undefined
 * values removed.
 */
export function collectionCleaner(options: Record<string, any>) {
  const result: Record<string, any> = {}

  for (const key in options) {
    const value = options[key]
    if (value !== null && value !== undefined) {
      result[key] = value
    }
  }

  return result
}

/**
 * If the text is not null or undefined, return the first character of the text in uppercase, followed
 * by the rest of the text.
 * @param {string} [text] - The text to capitalize.
 * @returns The first letter of the string is being capitalized and the rest of the string is being
 * returned.
 */
export function capitalizeFirstLetter(text?: string) {
  if (!text || typeof text.charAt !== 'function') {
    return text
  }

  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * This TypeScript function finds the real parent of a component instance that has a Leaflet map
 * object.
 * @param {(ComponentInternalInstance & { mapObject?: LeafletMap }) | null | undefined} parentInstance
 * - The `parentInstance` parameter is a variable of type `(ComponentInternalInstance & { mapObject?:
 * LeafletMap }) | null | undefined`. It represents the parent component instance that we want to find
 * the real parent of. The `mapObject` property is an optional property that is used to check
 * @returns a value of type `T` or `undefined`. The type `T` is a generic type that is determined by
 * the caller of the function. The function is finding the first parent instance that has a `mapObject`
 * property and returning its `exposed` property as type `T`. If no parent instance with a `mapObject`
 * property is found, the function returns
 */
export function findRealParent<T>(
  parentInstance: (ComponentInternalInstance & { mapObject?: LeafletMap }) | null | undefined
): T | undefined {
  let found = false

  while (parentInstance && !found) {
    if (!parentInstance.exposed?.mapObject) {
      parentInstance = parentInstance.parent
    } else {
      found = true
    }
  }

  return parentInstance?.exposed as T
}

export async function resetIcons() {
  const modules = await Promise.all([
    import('leaflet/dist/images/marker-icon-2x.png'),
    import('leaflet/dist/images/marker-icon.png'),
    import('leaflet/dist/images/marker-shadow.png')
  ])

  type D = Icon.Default & { _getIconUrl?: string }
  delete (Icon.Default.prototype as D)._getIconUrl

  Icon.Default.mergeOptions({
    iconRetinaUrl: modules[0].default,
    iconUrl: modules[1].default,
    shadowUrl: modules[2].default
  })
}
