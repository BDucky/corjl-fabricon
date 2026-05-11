import * as THREE from 'three'

/**
 * Recursively dispose all geometries, materials, and textures in an Object3D tree.
 */
export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        if (material) {
          disposeMaterialTextures(material as THREE.MeshStandardMaterial)
          material.dispose()
        }
      }
    }
  })

  obj.removeFromParent()
}

function disposeMaterialTextures(material: THREE.MeshStandardMaterial): void {
  const textureKeys: (keyof THREE.MeshStandardMaterial)[] = [
    'map', 'normalMap', 'roughnessMap', 'metalnessMap',
    'aoMap', 'emissiveMap', 'alphaMap', 'envMap',
    'lightMap', 'bumpMap', 'displacementMap',
  ]

  for (const key of textureKeys) {
    const texture = material[key]
    if (texture instanceof THREE.Texture) {
      texture.dispose()
    }
  }
}
