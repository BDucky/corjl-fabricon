import { watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import type { SceneStagingPresetId } from '../types'

export function useSceneStaging(getScene: () => THREE.Scene | null) {
  const store = useViewer3dStore()
  let currentGroup: THREE.Group | null = null
  let floorY = -0.5

  function createPresetGroup(presetId: SceneStagingPresetId): THREE.Group | null {
    if (presetId === 'none') return null

    const group = new THREE.Group()
    group.name = '__scene_staging__'

    switch (presetId) {
      case 'wooden-table': {
        const slabGeo = new THREE.BoxGeometry(6, 0.15, 4)
        const slabMat = new THREE.MeshStandardMaterial({
          color: 0x8b6914,
          roughness: 0.6,
          metalness: 0.05,
        })
        const slab = new THREE.Mesh(slabGeo, slabMat)
        slab.receiveShadow = true
        group.add(slab)
        break
      }
      case 'marble-surface': {
        const planeGeo = new THREE.PlaneGeometry(8, 8)
        planeGeo.rotateX(-Math.PI / 2)
        const planeMat = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0,
          roughness: 0.2,
          metalness: 0.1,
        })
        const plane = new THREE.Mesh(planeGeo, planeMat)
        plane.receiveShadow = true
        group.add(plane)
        break
      }
    }

    return group
  }

  function removeCurrentStaging() {
    const s = getScene()
    if (currentGroup && s) {
      currentGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      s.remove(currentGroup)
      currentGroup = null
    }
  }

  function setGridVisibility(visible: boolean) {
    const s = getScene()
    if (!s) return
    const grid = s.getObjectByName('__grid__')
    if (grid) grid.visible = visible
    const groundFade = s.getObjectByName('__ground_fade__')
    if (groundFade) groundFade.visible = visible
  }

  function applyPreset(presetId: SceneStagingPresetId) {
    removeCurrentStaging()

    if (presetId === 'none') {
      setGridVisibility(true)
      return
    }

    setGridVisibility(false)

    const group = createPresetGroup(presetId)
    if (group) {
      group.position.y = floorY
      const s = getScene()
      if (s) {
        s.add(group)
        currentGroup = group
      }
    }
  }

  function updateFloorLevel(y: number) {
    floorY = y
    if (currentGroup) {
      currentGroup.position.y = y
    }
  }

  watch(() => store.sceneStagingPresetId, (id) => {
    applyPreset(id)
  })

  onUnmounted(() => {
    removeCurrentStaging()
  })

  return { updateFloorLevel }
}
