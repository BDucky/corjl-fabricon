import { watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useViewer3dStore } from '../store'

const PRINT_AREA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const PRINT_AREA_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBorderColor;
  uniform float uBorderWidth;
  uniform float uOpacity;
  uniform vec2 uMinUV;
  uniform vec2 uMaxUV;

  varying vec2 vUv;

  void main() {
    // Normalize UV to [0,1] within the print area
    vec2 areaSize = uMaxUV - uMinUV;
    vec2 areaUv = (vUv - uMinUV) / areaSize;

    // Check if we're inside the print area
    if (areaUv.x < 0.0 || areaUv.x > 1.0 || areaUv.y < 0.0 || areaUv.y > 1.0) {
      discard;
    }

    // Check if we're on the border (dashed)
    float bw = uBorderWidth;
    bool onBorder = areaUv.x < bw || areaUv.x > (1.0 - bw) || areaUv.y < bw || areaUv.y > (1.0 - bw);

    if (!onBorder) {
      discard;
    }

    // Dashed pattern
    float edgeDist = (areaUv.x < bw || areaUv.x > (1.0 - bw)) ? areaUv.y : areaUv.x;
    float dashPattern = step(0.5, fract(edgeDist * 20.0));

    if (dashPattern < 0.5) {
      discard;
    }

    gl_FragColor = vec4(uBorderColor, uOpacity);
  }
`

export function usePrintAreaOverlay(getCurrentModel: () => THREE.Object3D | null) {
  const store = useViewer3dStore()
  let overlayMesh: THREE.Mesh | null = null

  function findTargetMesh(model: THREE.Object3D): THREE.Mesh | null {
    let target: THREE.Mesh | null = null
    model.traverse((child) => {
      if (!target && child instanceof THREE.Mesh && child.geometry?.attributes?.uv) {
        target = child
      }
    })
    return target
  }

  function createOverlay(model: THREE.Object3D) {
    removeOverlay()

    const targetMesh = findTargetMesh(model)
    if (!targetMesh) return

    const printArea = store.effectivePrintAreaUV
    const geometry = targetMesh.geometry.clone()

    const material = new THREE.ShaderMaterial({
      vertexShader: PRINT_AREA_VERTEX_SHADER,
      fragmentShader: PRINT_AREA_FRAGMENT_SHADER,
      uniforms: {
        uBorderColor: { value: new THREE.Color(0x00cccc) },
        uBorderWidth: { value: 0.02 },
        uOpacity: { value: 0.6 },
        uMinUV: { value: new THREE.Vector2(printArea.minU, printArea.minV) },
        uMaxUV: { value: new THREE.Vector2(printArea.maxU, printArea.maxV) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })

    overlayMesh = new THREE.Mesh(geometry, material)
    overlayMesh.name = '__print_area_overlay__'

    // Copy transform from target mesh
    overlayMesh.position.copy(targetMesh.position)
    overlayMesh.rotation.copy(targetMesh.rotation)
    overlayMesh.scale.copy(targetMesh.scale)
    targetMesh.getWorldPosition(overlayMesh.position)
    targetMesh.getWorldQuaternion(overlayMesh.quaternion)
    targetMesh.getWorldScale(overlayMesh.scale)

    // Add to parent scene (not to model, to avoid transform stacking)
    let scene: THREE.Object3D = model
    while (scene.parent) scene = scene.parent
    scene.add(overlayMesh)
  }

  function removeOverlay() {
    if (overlayMesh) {
      overlayMesh.geometry.dispose()
      ;(overlayMesh.material as THREE.Material).dispose()
      overlayMesh.removeFromParent()
      overlayMesh = null
    }
  }

  function updateUniforms() {
    if (!overlayMesh) return
    const printArea = store.effectivePrintAreaUV
    const material = overlayMesh.material as THREE.ShaderMaterial
    material.uniforms.uMinUV.value.set(printArea.minU, printArea.minV)
    material.uniforms.uMaxUV.value.set(printArea.maxU, printArea.maxV)
  }

  // Watch show/hide
  watch(() => store.showPrintArea, (show) => {
    if (show) {
      const model = getCurrentModel()
      if (model) createOverlay(model)
    } else {
      removeOverlay()
    }
  })

  // Rebuild when model changes
  watch(getCurrentModel, (model) => {
    if (store.showPrintArea && model) {
      createOverlay(model)
    } else {
      removeOverlay()
    }
  })

  // Update uniforms when effective print area changes
  watch(() => store.effectivePrintAreaUV, () => {
    if (store.showPrintArea) {
      updateUniforms()
    }
  }, { deep: true })

  onUnmounted(() => {
    removeOverlay()
  })
}
