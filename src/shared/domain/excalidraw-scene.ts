import type { JsonArray, JsonObject } from './json'

export type ExcalidrawScene = {
  readonly elements: JsonArray
  readonly appState: JsonObject
  readonly files: JsonObject
}

export const createEmptyExcalidrawScene = (): ExcalidrawScene => ({
  elements: [],
  appState: {},
  files: {},
})
