import { useViewer3dStore } from '../store'
import { DEFAULT_TEXTURE_MAPPING } from '../constants'

export function useDesignPlacement() {
  const store = useViewer3dStore()

  function fitDesignToArea() {
    const dims = store.designDimensions
    if (!dims) return

    const aspectRatio = dims.width / dims.height

    // Adjust repeat values to maintain the design's aspect ratio
    // When repeatX/Y = 1, the texture covers the full UV space
    // We adjust so the design fits proportionally
    if (aspectRatio > 1) {
      // Landscape: scale Y up to compensate
      store.setTextureMappingConfig({
        repeatX: 1,
        repeatY: 1 / aspectRatio,
        offsetX: 0,
        offsetY: (1 - 1 / aspectRatio) / 2,
        rotation: 0,
      })
    } else {
      // Portrait or square: scale X up to compensate
      store.setTextureMappingConfig({
        repeatX: aspectRatio,
        repeatY: 1,
        offsetX: (1 - aspectRatio) / 2,
        offsetY: 0,
        rotation: 0,
      })
    }
  }

  function centerDesign() {
    store.setTextureMappingConfig({
      offsetX: 0,
      offsetY: 0,
    })
  }

  function resetPlacement() {
    store.setTextureMappingConfig({ ...DEFAULT_TEXTURE_MAPPING })
  }

  return {
    fitDesignToArea,
    centerDesign,
    resetPlacement,
  }
}
