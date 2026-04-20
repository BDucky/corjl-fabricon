import type { PrintAreaUV } from '../types'

export interface CompositorOptions {
  /** Design scale as fraction of print area (0.80 = 80%). Used in decoration mode. */
  designScale: number
  /** Horizontal position within print area (0.5 = centered) */
  offsetX: number
  /** Vertical position within print area (0.5 = centered) */
  offsetY: number
  /** Rotation in radians */
  rotation: number
  /** Fill mode: true = contain-fit to cover entire region, false = decoration mode */
  fill: boolean
  /** Background color (hex string) for non-design areas */
  backgroundColor: string
  /** Flip the design vertically (for models with inverted V-axis UVs) */
  flipV?: boolean
  /** UV bounds of the printable area. Design is drawn within this region. */
  printAreaUV?: PrintAreaUV
}

const CANVAS_SIZE = 2048

/**
 * Composes a design image onto an offscreen canvas at the desired size/position.
 * Returns a canvas that can be used directly with THREE.CanvasTexture.
 *
 * - Decoration mode (fill=false): draws design centered at designScale fraction, preserving aspect ratio
 * - Fill mode (fill=true): draws design to "contain" fit the canvas/region, preserving aspect ratio
 * - Background filled with product color
 */
export function composeDesignCanvas(
  image: HTMLImageElement,
  options: CompositorOptions,
  existingCanvas?: HTMLCanvasElement,
): HTMLCanvasElement {
  const canvas = existingCanvas ?? document.createElement('canvas')
  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE

  const ctx = canvas.getContext('2d')!

  // Fill entire canvas with background color
  ctx.fillStyle = options.backgroundColor
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // Determine the draw region (full canvas or printAreaUV sub-region)
  let regionX = 0
  let regionY = 0
  let regionW = CANVAS_SIZE
  let regionH = CANVAS_SIZE

  if (options.printAreaUV) {
    const { minU, maxU, minV, maxV } = options.printAreaUV
    regionX = minU * CANVAS_SIZE
    // The CanvasTexture is uploaded with flipY=false, so canvas Y maps directly to UV V
    // (canvas Y=0 → UV V=0). No vertical inversion is needed.
    regionY = minV * CANVAS_SIZE
    regionW = (maxU - minU) * CANVAS_SIZE
    regionH = (maxV - minV) * CANVAS_SIZE
  }

  // Image aspect ratio
  const imgAspect = image.naturalWidth / image.naturalHeight

  let drawW: number
  let drawH: number

  if (options.fill) {
    // Fill mode: "contain" fit within the region
    const regionAspect = regionW / regionH
    if (imgAspect > regionAspect) {
      // Image wider than region — fit to width
      drawW = regionW
      drawH = regionW / imgAspect
    } else {
      // Image taller — fit to height
      drawH = regionH
      drawW = regionH * imgAspect
    }
  } else {
    // Decoration mode: design occupies designScale fraction of the region
    // Use the smaller dimension of the region as the reference
    const refSize = Math.min(regionW, regionH) * options.designScale
    if (imgAspect > 1) {
      // Landscape: width = refSize, height scales down
      drawW = refSize
      drawH = refSize / imgAspect
    } else {
      // Portrait or square: height = refSize, width scales down
      drawH = refSize
      drawW = refSize * imgAspect
    }
  }

  // Position: offset (0.5, 0.5) = centered in the region.
  // offsetY=1 → bottom of canvas region → high UV V → top of model (for typical
  // V-up UV layouts). Slider direction is intuitive: higher slider = higher on model.
  const centerX = regionX + options.offsetX * regionW
  const centerY = regionY + options.offsetY * regionH

  ctx.save()

  // Translate to draw center
  ctx.translate(centerX, centerY)

  // Apply rotation
  if (options.rotation) {
    ctx.rotate(options.rotation)
  }

  // Apply flipV
  if (options.flipV) {
    ctx.scale(1, -1)
  }

  // Draw image centered on origin
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH)

  ctx.restore()

  return canvas
}
