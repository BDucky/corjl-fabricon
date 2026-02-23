import { shallowRef, watch } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import type { LightingPreset } from '../types'

export function useLighting(scene: () => THREE.Scene | null) {
  const store = useViewer3dStore()
  const lightGroup = shallowRef<THREE.Group | null>(null)

  function applyPreset(preset: LightingPreset) {
    const s = scene()
    if (!s) return

    // Remove old lights
    if (lightGroup.value) {
      s.remove(lightGroup.value)
      lightGroup.value = null
    }

    const group = new THREE.Group()
    group.name = '__lighting_rig__'

    // Ambient light
    const ambient = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity)
    group.add(ambient)

    // Preset lights
    for (const lightDef of preset.lights) {
      let light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight

      switch (lightDef.type) {
        case 'directional': {
          light = new THREE.DirectionalLight(lightDef.color, lightDef.intensity)
          if (lightDef.castShadow) {
            light.castShadow = true
            light.shadow.mapSize.set(1024, 1024)
            light.shadow.camera.near = 0.1
            light.shadow.camera.far = 50
            light.shadow.camera.left = -5
            light.shadow.camera.right = 5
            light.shadow.camera.top = 5
            light.shadow.camera.bottom = -5
            light.shadow.bias = -0.001
          }
          break
        }
        case 'point':
          light = new THREE.PointLight(lightDef.color, lightDef.intensity)
          break
        case 'spot':
          light = new THREE.SpotLight(lightDef.color, lightDef.intensity)
          break
      }

      light.position.set(...lightDef.position)
      group.add(light)
    }

    s.add(group)
    lightGroup.value = group
  }

  watch(
    () => store.activeLightingPreset,
    (preset) => {
      if (preset) applyPreset(preset)
    },
  )

  function initialize() {
    applyPreset(store.activeLightingPreset)
  }

  return { initialize, applyPreset }
}
