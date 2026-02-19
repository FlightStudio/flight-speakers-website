import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Premium flowing gradient shader - light theme with subtle warmth
const vertexShader = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform vec2 uMouse;

  //
  // GLSL textureless classic 3D noise "cnoise"
  //
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

  void main() {
    vUv = uv;

    // Layered noise for organic movement
    float noise1 = cnoise(vec3(position.x * 0.4, position.y * 0.4, uTime * 0.12));
    float noise2 = cnoise(vec3(position.x * 0.6 + 100.0, position.y * 0.6, uTime * 0.08));
    float noise3 = cnoise(vec3(position.x * 0.25, position.y * 0.25, uTime * 0.15));

    float elevation = noise1 * 0.35 + noise2 * 0.25 + noise3 * 0.2;

    // Flowing wave
    elevation += sin(position.x * 0.3 + uTime * 0.25) * 0.15;
    elevation += cos(position.y * 0.25 + uTime * 0.2) * 0.12;

    // Mouse influence - create ripple effect
    float dist = length(position.xy - uMouse * 4.0);
    float ripple = exp(-dist * 0.2) * 0.2 * sin(uTime * 3.0 - dist * 0.5);
    elevation += ripple;

    vElevation = elevation;

    vec3 newPosition = position;
    newPosition.z += elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uDarkMode;

  void main() {
    // Light color palette
    vec3 warmWhite = vec3(0.98, 0.97, 0.95);     // #FAF8F2
    vec3 softCream = vec3(0.96, 0.94, 0.90);     // #F5EFE6
    vec3 blushPink = vec3(0.97, 0.92, 0.91);     // #F8EBE8
    vec3 paleGold = vec3(0.98, 0.95, 0.88);      // #FAF2E0
    vec3 softLavender = vec3(0.95, 0.94, 0.97);  // #F2F0F8

    // Dark color palette
    vec3 deepBlack = vec3(0.04, 0.04, 0.04);     // #0A0A0A
    vec3 darkCharcoal = vec3(0.07, 0.07, 0.07);  // #121212
    vec3 darkWarm = vec3(0.08, 0.06, 0.05);      // #140F0D
    vec3 darkCool = vec3(0.05, 0.06, 0.08);      // #0D0F14
    vec3 darkPurple = vec3(0.06, 0.05, 0.08);    // #0F0D14

    // Mix palettes based on dark mode
    vec3 c1 = mix(warmWhite, deepBlack, uDarkMode);
    vec3 c2 = mix(softCream, darkCharcoal, uDarkMode);
    vec3 c3 = mix(blushPink, darkWarm, uDarkMode);
    vec3 c4 = mix(paleGold, darkCool, uDarkMode);
    vec3 c5 = mix(softLavender, darkPurple, uDarkMode);

    // Create flowing gradient
    float mixStrength = (vElevation + 0.5) * 0.8;
    mixStrength = clamp(mixStrength, 0.0, 1.0);

    // Time-based color shifting
    float timeFlow = sin(uTime * 0.08) * 0.5 + 0.5;
    float timeFlow2 = cos(uTime * 0.06) * 0.5 + 0.5;

    // Base gradient
    vec3 color = mix(c1, c2, vUv.y * 0.5 + vUv.x * 0.3);

    // Layer in warm and cool tones based on elevation and position
    color = mix(color, c3, mixStrength * 0.4 * (1.0 - vUv.x));
    color = mix(color, c4, mixStrength * 0.3 * vUv.x * timeFlow);
    color = mix(color, c5, (1.0 - mixStrength) * 0.25 * timeFlow2);

    // Subtle iridescent shimmer (reduced in dark mode)
    float shimmer = sin(vUv.x * 30.0 + uTime * 0.5) * cos(vUv.y * 30.0 + uTime * 0.3);
    color += shimmer * mix(0.012, 0.006, uDarkMode);

    // Elevation-based luminance (reduced in dark mode)
    color += vElevation * mix(0.04, 0.02, uDarkMode);

    // Soft edges
    float alpha = 0.9;
    alpha *= smoothstep(0.0, 0.2, vUv.x);
    alpha *= smoothstep(1.0, 0.8, vUv.x);
    alpha *= smoothstep(0.0, 0.2, vUv.y);
    alpha *= smoothstep(1.0, 0.8, vUv.y);

    gl_FragColor = vec4(color, alpha);
  }
`

function GradientPlane() {
  const meshRef = useRef()
  const { viewport } = useThree()
  const mouse = useRef({ x: 0, y: 0 })
  const darkModeTarget = useRef(0)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uDarkMode: { value: 0 },
  }), [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Watch for theme changes
  useEffect(() => {
    const update = () => {
      darkModeTarget.current = document.documentElement.getAttribute('data-theme') === 'dark' ? 1 : 0
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime

      // Smooth mouse follow
      const currentMouse = meshRef.current.material.uniforms.uMouse.value
      currentMouse.x += (mouse.current.x - currentMouse.x) * 0.03
      currentMouse.y += (mouse.current.y - currentMouse.y) * 0.03

      // Smooth dark mode transition
      const dm = meshRef.current.material.uniforms.uDarkMode
      dm.value += (darkModeTarget.current - dm.value) * 0.04
    }
  })

  const scale = Math.max(viewport.width, viewport.height) * 1.4

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0, -2]}>
      <planeGeometry args={[scale, scale, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Floating gradient orbs
function FloatingOrbs() {
  const groupRef = useRef()
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'
  )

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const lightColors = ['#f8f0e8', '#f0e8f4', '#e8f0f8', '#f8f4e8', '#f4e8f0', '#e8f4f0']
  const darkColors = ['#1a1410', '#16101a', '#101418', '#1a1810', '#181016', '#101816']

  const orbs = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        -3 - Math.random() * 3
      ],
      scale: 0.3 + Math.random() * 0.5,
      speed: 0.15 + Math.random() * 0.2,
      offset: Math.random() * Math.PI * 2,
    }))
  , [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((orb, i) => {
        const { speed, offset } = orbs[i]
        orb.position.y += Math.sin(state.clock.elapsedTime * speed + offset) * 0.003
        orb.position.x += Math.cos(state.clock.elapsedTime * speed * 0.7 + offset) * 0.002
      })
    }
  })

  const colors = isDark ? darkColors : lightColors

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 32, 32]} />
          <meshBasicMaterial
            color={colors[i]}
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  )
}

// Check for reduced motion preference
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return reducedMotion
}

// Check if WebGL is supported
function useWebGLSupport() {
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setSupported(!!gl)
    } catch {
      setSupported(false)
    }
  }, [])

  return supported
}

export default function GradientMesh() {
  const reducedMotion = useReducedMotion()
  const webglSupported = useWebGLSupport()

  if (reducedMotion || !webglSupported) {
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
    return (
      <div
        className="gradient-mesh gradient-mesh--fallback"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0e0e12 100%)'
            : 'linear-gradient(135deg, #faf8f2 0%, #f5efe6 50%, #f8ebe8 100%)',
        }}
      />
    )
  }

  return (
    <div className="gradient-mesh">
      <Canvas
        camera={{ position: [0, 3, 6], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        dpr={[1, 2]}
        frameloop="always"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <GradientPlane />
        <FloatingOrbs />
      </Canvas>
    </div>
  )
}
