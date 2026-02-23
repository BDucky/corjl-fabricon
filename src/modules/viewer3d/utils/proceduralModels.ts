import * as THREE from 'three'

/**
 * Create a simple coffee mug from primitives.
 * Body is named "Body" to match targetMeshNames in constants.
 */
export function createProceduralMug(): THREE.Group {
  const group = new THREE.Group()

  // Mug body — cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 32)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#e0e0e0',
    roughness: 0.3,
    metalness: 0.1,
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.name = 'Body'
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Inner cavity — slightly smaller dark cylinder
  const innerGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.75, 32)
  const innerMat = new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.8,
    side: THREE.BackSide,
  })
  const inner = new THREE.Mesh(innerGeo, innerMat)
  inner.name = 'inner'
  inner.position.y = 0.05
  group.add(inner)

  // Handle — torus
  const handleGeo = new THREE.TorusGeometry(0.22, 0.04, 12, 24, Math.PI)
  const handleMat = new THREE.MeshStandardMaterial({
    color: '#e0e0e0',
    roughness: 0.3,
    metalness: 0.1,
  })
  const handle = new THREE.Mesh(handleGeo, handleMat)
  handle.name = 'handle'
  handle.rotation.z = -Math.PI / 2
  handle.position.set(0.42, 0, 0)
  handle.castShadow = true
  group.add(handle)

  // Bottom disc
  const bottomGeo = new THREE.CircleGeometry(0.35, 32)
  const bottomMat = new THREE.MeshStandardMaterial({
    color: '#d0d0d0',
    roughness: 0.4,
  })
  const bottom = new THREE.Mesh(bottomGeo, bottomMat)
  bottom.name = 'bottom'
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = -0.4
  group.add(bottom)

  return group
}

/**
 * Create a simple product box from primitives.
 * Front face is named "Front" to match targetMeshNames in constants.
 */
export function createProceduralBox(): THREE.Group {
  const group = new THREE.Group()

  const width = 0.8
  const height = 1.0
  const depth = 0.3

  // Use individual planes so each face can have its own name/material
  const faceMat = new THREE.MeshStandardMaterial({
    color: '#f5f5f5',
    roughness: 0.5,
    metalness: 0.0,
  })
  const sideMat = new THREE.MeshStandardMaterial({
    color: '#e8e8e8',
    roughness: 0.5,
    metalness: 0.0,
  })

  // Front
  const frontGeo = new THREE.PlaneGeometry(width, height)
  const front = new THREE.Mesh(frontGeo, faceMat.clone())
  front.name = 'Front'
  front.position.z = depth / 2
  front.castShadow = true
  front.receiveShadow = true
  group.add(front)

  // Back
  const backGeo = new THREE.PlaneGeometry(width, height)
  const back = new THREE.Mesh(backGeo, faceMat.clone())
  back.name = 'Back'
  back.position.z = -depth / 2
  back.rotation.y = Math.PI
  group.add(back)

  // Left
  const leftGeo = new THREE.PlaneGeometry(depth, height)
  const left = new THREE.Mesh(leftGeo, sideMat.clone())
  left.name = 'Side'
  left.position.x = -width / 2
  left.rotation.y = -Math.PI / 2
  left.castShadow = true
  group.add(left)

  // Right
  const rightGeo = new THREE.PlaneGeometry(depth, height)
  const right = new THREE.Mesh(rightGeo, sideMat.clone())
  right.name = 'right'
  right.position.x = width / 2
  right.rotation.y = Math.PI / 2
  group.add(right)

  // Top
  const topGeo = new THREE.PlaneGeometry(width, depth)
  const top = new THREE.Mesh(topGeo, sideMat.clone())
  top.name = 'top'
  top.position.y = height / 2
  top.rotation.x = -Math.PI / 2
  group.add(top)

  // Bottom
  const bottomGeo = new THREE.PlaneGeometry(width, depth)
  const bottom = new THREE.Mesh(bottomGeo, sideMat.clone())
  bottom.name = 'bottom_face'
  bottom.position.y = -height / 2
  bottom.rotation.x = Math.PI / 2
  group.add(bottom)

  return group
}

/** Map of bundled model IDs → procedural generator functions */
export const PROCEDURAL_GENERATORS: Record<string, () => THREE.Group> = {
  mug: createProceduralMug,
  box: createProceduralBox,
}
