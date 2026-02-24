import { watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import type { EnvironmentPresetId } from '../types'

export function useEnvironmentMap(
  getScene: () => THREE.Scene | null,
  getRenderer: () => THREE.WebGLRenderer | null,
) {
  const store = useViewer3dStore()
  let currentEnvTexture: THREE.Texture | null = null
  let pmremGenerator: THREE.PMREMGenerator | null = null

  function buildProceduralScene(presetId: EnvironmentPresetId): THREE.Scene {
    const envScene = new THREE.Scene()

    switch (presetId) {
      case 'studio': {
        // Grey hemisphere with emissive softbox planes
        const hemiGeo = new THREE.SphereGeometry(5, 32, 16)
        const hemiMat = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.BackSide })
        envScene.add(new THREE.Mesh(hemiGeo, hemiMat))

        // Softbox panels
        const panelGeo = new THREE.PlaneGeometry(2, 2)
        const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        const panel1 = new THREE.Mesh(panelGeo, panelMat)
        panel1.position.set(3, 2, 0)
        panel1.lookAt(0, 0, 0)
        envScene.add(panel1)

        const panel2 = new THREE.Mesh(panelGeo.clone(), panelMat.clone())
        panel2.position.set(-3, 2, 0)
        panel2.lookAt(0, 0, 0)
        envScene.add(panel2)

        const panel3 = new THREE.Mesh(panelGeo.clone(), panelMat.clone())
        panel3.position.set(0, 4, 0)
        panel3.lookAt(0, 0, 0)
        envScene.add(panel3)
        break
      }
      case 'outdoor': {
        // Blue-to-green gradient sphere
        const skyGeo = new THREE.SphereGeometry(5, 32, 16)
        const skyColors = []
        const positions = skyGeo.attributes.position
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i)
          const t = (y / 5 + 1) / 2 // 0 = bottom, 1 = top
          const color = new THREE.Color()
          if (t > 0.5) {
            color.lerpColors(new THREE.Color(0x87ceeb), new THREE.Color(0x1e90ff), (t - 0.5) * 2)
          } else {
            color.lerpColors(new THREE.Color(0x228b22), new THREE.Color(0x87ceeb), t * 2)
          }
          skyColors.push(color.r, color.g, color.b)
        }
        skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3))
        const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
        envScene.add(new THREE.Mesh(skyGeo, skyMat))

        // Bright sun emissive
        const sunGeo = new THREE.SphereGeometry(0.5, 16, 8)
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffcc })
        const sun = new THREE.Mesh(sunGeo, sunMat)
        sun.position.set(3, 4, 2)
        envScene.add(sun)
        break
      }
      case 'warehouse': {
        // Dark grey sphere
        const wallGeo = new THREE.SphereGeometry(5, 32, 16)
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.BackSide })
        envScene.add(new THREE.Mesh(wallGeo, wallMat))

        // Rectangular emissive ceiling lights
        const lightGeo = new THREE.PlaneGeometry(3, 0.5)
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        for (let i = -1; i <= 1; i++) {
          const light = new THREE.Mesh(lightGeo.clone(), lightMat.clone())
          light.position.set(i * 2, 4.9, 0)
          light.rotation.x = Math.PI / 2
          envScene.add(light)
        }
        break
      }
      case 'sunset': {
        // Orange-pink gradient sphere
        const sunsetGeo = new THREE.SphereGeometry(5, 32, 16)
        const sunsetColors = []
        const sunsetPos = sunsetGeo.attributes.position
        for (let i = 0; i < sunsetPos.count; i++) {
          const y = sunsetPos.getY(i)
          const t = (y / 5 + 1) / 2
          const color = new THREE.Color()
          if (t > 0.5) {
            color.lerpColors(new THREE.Color(0xff6b6b), new THREE.Color(0x1a1a2e), (t - 0.5) * 2)
          } else {
            color.lerpColors(new THREE.Color(0xff8c42), new THREE.Color(0xff6b6b), t * 2)
          }
          sunsetColors.push(color.r, color.g, color.b)
        }
        sunsetGeo.setAttribute('color', new THREE.Float32BufferAttribute(sunsetColors, 3))
        const sunsetMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
        envScene.add(new THREE.Mesh(sunsetGeo, sunsetMat))

        // Horizon sun
        const hSunGeo = new THREE.SphereGeometry(0.8, 16, 8)
        const hSunMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 })
        const hSun = new THREE.Mesh(hSunGeo, hSunMat)
        hSun.position.set(4, 0.5, 2)
        envScene.add(hSun)
        break
      }
      case 'neutral': {
        // Uniform mid-grey sphere
        const neutralGeo = new THREE.SphereGeometry(5, 32, 16)
        const neutralMat = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.BackSide })
        envScene.add(new THREE.Mesh(neutralGeo, neutralMat))
        break
      }
    }

    return envScene
  }

  function disposeEnv() {
    const s = getScene()
    if (currentEnvTexture) {
      currentEnvTexture.dispose()
      currentEnvTexture = null
    }
    if (s) {
      s.environment = null
    }
  }

  function applyPreset(presetId: EnvironmentPresetId | null) {
    const s = getScene()
    const r = getRenderer()
    if (!s || !r) return

    disposeEnv()

    if (!presetId) return

    if (!pmremGenerator) {
      pmremGenerator = new THREE.PMREMGenerator(r)
      pmremGenerator.compileCubemapShader()
    }

    const envScene = buildProceduralScene(presetId)
    currentEnvTexture = pmremGenerator.fromScene(envScene, 0, 0.1, 100).texture
    s.environment = currentEnvTexture
    // environmentIntensity added in Three.js r155+
    if ('environmentIntensity' in s) {
      (s as Record<string, unknown>).environmentIntensity = store.environmentIntensity
    }

    // Dispose the procedural scene geometry
    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  watch(() => store.environmentPresetId, (id) => {
    applyPreset(id)
  })

  watch(() => store.environmentIntensity, (intensity) => {
    const s = getScene()
    if (s && 'environmentIntensity' in s) {
      (s as Record<string, unknown>).environmentIntensity = intensity
    }
  })

  onUnmounted(() => {
    disposeEnv()
    if (pmremGenerator) {
      pmremGenerator.dispose()
      pmremGenerator = null
    }
  })
}
