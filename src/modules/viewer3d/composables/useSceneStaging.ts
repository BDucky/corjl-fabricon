import { watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'
import type { SceneStagingPresetId } from '../types'

export function useSceneStaging(getScene: () => THREE.Scene | null) {
  const store = useViewer3dStore()
  let currentGroup: THREE.Group | null = null
  let floorY = -0.5

  function createSweepGeometry(): THREE.BufferGeometry {
    // Curved infinity cove — a plane that bends upward at the back
    const width = 8
    const depth = 6
    const height = 5
    const segW = 1
    const segD = 20

    const geo = new THREE.PlaneGeometry(width, depth + height, segW, segD)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const halfLen = (depth + height) / 2
      const normalized = (y + halfLen) / (depth + height) // 0 = front, 1 = back
      if (normalized > depth / (depth + height)) {
        // Curve upward
        const t = (normalized - depth / (depth + height)) / (height / (depth + height))
        const curveAngle = t * Math.PI / 2
        positions.setY(i, -halfLen + depth + Math.sin(curveAngle) * height * 0.5)
        positions.setZ(i, -Math.cos(curveAngle) * height * 0.5)
      } else {
        // Flat floor portion
        positions.setZ(i, 0)
        positions.setY(i, y)
      }
    }
    geo.computeVertexNormals()

    // Rotate to be horizontal
    geo.rotateX(-Math.PI / 2)
    return geo
  }

  function createPresetGroup(presetId: SceneStagingPresetId): THREE.Group | null {
    if (presetId === 'none') return null

    const group = new THREE.Group()
    group.name = '__scene_staging__'

    switch (presetId) {
      case 'studio-sweep': {
        const geo = createSweepGeometry()
        const mat = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.8,
          metalness: 0,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.receiveShadow = true
        group.add(mesh)
        break
      }
      case 'wooden-table': {
        // Table slab
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
      case 'fabric-backdrop': {
        const geo = createSweepGeometry()
        // Add vertex noise for fabric texture feel
        const positions = geo.attributes.position
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i)
          const y = positions.getY(i)
          const z = positions.getZ(i)
          const noise = Math.sin(x * 5) * Math.cos(z * 5) * 0.01
          positions.setY(i, y + noise)
        }
        geo.computeVertexNormals()

        const mat = new THREE.MeshStandardMaterial({
          color: 0x1b2a4a,
          roughness: 1.0,
          metalness: 0,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.receiveShadow = true
        group.add(mesh)
        break
      }
      case 'gradient-sweep': {
        const geo = createSweepGeometry()
        // Vertex colors: dark at back/top, light at front
        const colors: number[] = []
        const positions = geo.attributes.position
        for (let i = 0; i < positions.count; i++) {
          const z = positions.getZ(i)
          const y = positions.getY(i)
          const t = Math.max(0, Math.min(1, (z + 3) / 6)) // front=light, back=dark
          const yt = Math.max(0, Math.min(1, y / 3)) // higher=darker
          const blend = Math.min(1, t * 0.7 + (1 - yt) * 0.3)
          const dark = new THREE.Color(0x222222)
          const light = new THREE.Color(0xcccccc)
          const c = new THREE.Color().lerpColors(dark, light, blend)
          colors.push(c.r, c.g, c.b)
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.6,
          metalness: 0,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.receiveShadow = true
        group.add(mesh)
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
