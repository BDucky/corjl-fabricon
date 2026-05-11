/// <reference types="vite/client" />
/// <reference types="@capacitor/core" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare module 'gifenc' {
  export function GIFEncoder(): {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: { palette?: number[][]; delay?: number }): void
    finish(): void
    bytes(): Uint8Array
  }
  export function quantize(rgba: Uint8Array, maxColors: number): number[][]
  export function applyPalette(rgba: Uint8Array, palette: number[][]): Uint8Array
}
