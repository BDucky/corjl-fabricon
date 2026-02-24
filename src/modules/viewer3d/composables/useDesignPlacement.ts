import { useViewer3dStore } from '../store'

export function useDesignPlacement() {
  const store = useViewer3dStore()

  function fitDesignToArea() {
    store.autoFitDesign()
  }

  function centerDesign() {
    store.setTextureMappingConfig({
      offsetX: 0,
      offsetY: 0,
    })
  }

  function resetPlacement() {
    store.resetTextureMapping()
  }

  return {
    fitDesignToArea,
    centerDesign,
    resetPlacement,
  }
}
