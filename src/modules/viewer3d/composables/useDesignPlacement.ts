import { useViewer3dStore } from '../store'

export function useDesignPlacement() {
  const store = useViewer3dStore()

  function fitDesignToArea() {
    store.autoFitDesign()
  }

  function centerDesign() {
    store.setTextureMappingConfig({
      offsetX: 0.5,
      offsetY: 0.5,
    })
  }

  function resetPlacement() {
    store.autoFitDesign()
  }

  return {
    fitDesignToArea,
    centerDesign,
    resetPlacement,
  }
}
