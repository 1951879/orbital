
import React, { useRef, useMemo } from 'react';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { useFrame, ThreeElements } from '@react-three/fiber';
import { Mesh, Color, SphereGeometry, ShaderMaterial, FrontSide, MeshStandardMaterial, AdditiveBlending, BackSide, Vector3, Group, MathUtils } from 'three';
import { useStore } from '../../store/useStore';
import { SimplexNoise, getTerrainElevation } from '../../../engine/utils/terrain';

export const BlueprintSphere: React.FC = () => {
  const terrainRef = useRef<Mesh>(null);
  const oceanRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const materialShaderRef = useRef<any>(null);

  const terrainSeed = useStore((state) => state.terrainSeed);
  const terrainParams = useStore((state) => state.terrainParams);
  const isPaused = useStore((state) => state.isPaused);
  const isOnline = useStore((state) => state.isOnline); // Check online status
  const activeMenuTab = useStore((state) => state.activeMenuTab); // For rotation logic
  const isCameraTransitioning = useStore((state) => state.isCameraTransitioning);
  const planetRadius = terrainParams.planetRadius;

  // Calculate dynamic atmosphere radius to ensure it clears the highest peaks
  // Increased buffer from +8.0 to +12.0 for a thicker volume
  const maxTerrainHeight = Math.max(15, 25 * terrainParams.mountainScale);
  const atmosphereRadius = planetRadius + maxTerrainHeight + 12.0;

  const sunWorldDir = useMemo(() => new Vector3(20000, 10000, 10000).normalize(), []);
  const sunLocalVec = useMemo(() => new Vector3(), []);

  // 1. Generate Hybrid "Flyable" Geometry 
  const { terrainGeometry } = useMemo(() => {
    // Vertex density
    const segments = Math.min(384, Math.floor(planetRadius * 12));
    const geo = new SphereGeometry(planetRadius, segments, segments);
    const posAttribute = geo.attributes.position;
    const vertexCount = posAttribute.count;

    const simplex = new SimplexNoise(terrainSeed);

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      const z = posAttribute.getZ(i);

      const h = getTerrainElevation(x, y, z, simplex, terrainParams);

      const currentRadius = Math.sqrt(x * x + y * y + z * z);
      const scale = (planetRadius + h) / currentRadius;
      posAttribute.setXYZ(i, x * scale, y * scale, z * scale);
    }

    geo.computeVertexNormals();
    return { terrainGeometry: geo };
  }, [terrainSeed, terrainParams, planetRadius]);

  // 2. Terrain Material
  const terrainMaterial = useMemo(() => {
    const mat = new MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false,
    });

    mat.onBeforeCompile = (shader) => {
      materialShaderRef.current = shader;
      shader.uniforms.uForest = { value: terrainParams.forestDensity };
      shader.uniforms.uRadius = { value: planetRadius };
      shader.uniforms.uTime = { value: 0.0 };
      shader.uniforms.uAtmosphereColor = { value: new Color("#88ccff") };
      shader.uniforms.uP1Pos = { value: new Vector3(0, 0, 0) };
      shader.uniforms.uP2Pos = { value: new Vector3(0, 0, 0) };
      shader.uniforms.uP3Pos = { value: new Vector3(0, 0, 0) };
      shader.uniforms.uP4Pos = { value: new Vector3(0, 0, 0) };
      shader.uniforms.uSunPos = { value: new Vector3(0, 1, 0) }; // Init with dummy

      const noiseChunk = `
        uniform float uForest;
        uniform float uRadius;
        uniform float uTime;
        uniform vec3 uAtmosphereColor;
        uniform vec3 uP1Pos;
        uniform vec3 uP2Pos;
        uniform vec3 uP3Pos;
        uniform vec3 uP4Pos;
        uniform vec3 uSunPos;

        // ... Standard Simplex Noise ...
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        float fbm(vec3 x) {
          float v = 0.0;
          float a = 0.5;
          vec3 shift = vec3(100.0);
          for (int i = 0; i < 4; ++i) { 
            v += a * snoise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        // Return raw proximity factor (0.0 to 1.0)
        float getSpotFactor(vec3 fragPos, vec3 playerPos) {
             // 1. Check altitude
             float pDist = length(playerPos);
             float altitude = pDist - uRadius;
             
             // Fade out if plane is too high (> 40 units)
             float alpha = 1.0 - clamp(altitude / 40.0, 0.0, 1.0);
             if (alpha <= 0.0) return 0.0;

             // 2. Project player position to unit sphere direction
             vec3 nFrag = normalize(fragPos);
             vec3 nPlayer = normalize(playerPos);
             
             // 3. Dot product gives cosine of angle
             float dp = dot(nFrag, nPlayer);
             float angle = acos(clamp(dp, -1.0, 1.0));
             float dist = angle * uRadius;
             
             float spotRadius = 0.5; // Diameter ~1.0u
             
             // Sharp falloff
             float spot = 1.0 - smoothstep(spotRadius * 0.5, spotRadius, dist);
             
             return spot * alpha;
        }
      `;

      shader.vertexShader = `
        varying vec3 vPosition;
        varying vec3 vObjectNormal;
        varying float vDist;
        ${shader.vertexShader}
      `.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPosition = position;
        vObjectNormal = normal; 
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vDist = length(mvPos.xyz);
        `
      );

      shader.fragmentShader = `
        varying vec3 vPosition;
        varying vec3 vObjectNormal;
        varying float vDist;
        ${noiseChunk}
        
        vec3 col_snow = vec3(0.96, 0.98, 1.0);
        vec3 col_rock = vec3(0.35, 0.32, 0.30);
        vec3 col_rock_dark = vec3(0.15, 0.14, 0.13); 
        vec3 col_grass = vec3(0.18, 0.35, 0.12);
        vec3 col_sand = vec3(0.55, 0.50, 0.35);
        vec3 col_deep = vec3(0.004, 0.106, 0.259);
        vec3 col_shallow = vec3(0.20, 0.55, 0.65);

        ${shader.fragmentShader}
      `.replace(
        '#include <color_fragment>',
        `
        float dist = length(vPosition);
        float height = dist - uRadius; 
        
        vec3 nNormal = normalize(vObjectNormal);
        vec3 nUp = normalize(vPosition);
        float slope = dot(nNormal, nUp);
        
        float textureNoise = fbm(vPosition * 4.0);
        
        vec3 finalCol = col_rock;

        if (height < 12.0) {
           float grassCover = smoothstep(12.0, 2.0, height); 
           grassCover *= smoothstep(0.6, 0.8, slope);
           vec3 groundCol = mix(col_grass, col_sand, smoothstep(2.0, 0.0, height));
           finalCol = mix(finalCol, groundCol, grassCover);
        }

        float snowLine = 15.0 + (textureNoise * 5.0);
        float snowAmt = smoothstep(snowLine, snowLine + 5.0, height);
        float snowSlope = smoothstep(0.5, 0.7, slope); 
        float finalSnow = snowAmt * (height > 25.0 ? 1.0 : snowSlope);
        finalCol = mix(finalCol, col_snow, finalSnow);

        if (height <= 0.0) {
            float depthFactor = smoothstep(-30.0, -2.0, height);
            vec3 waterBase = mix(col_deep, col_shallow, depthFactor);
            finalCol = waterBase;
            finalCol += vec3(0.05) * textureNoise;
        }

        // --- DYNAMIC SPOT PROJECTION (SHADOW vs LIGHT) ---
        vec3 sunDir = normalize(uSunPos);
        vec3 playerSpotColor = vec3(1.0, 0.9, 0.7);

        // Player 1
        float spot1 = getSpotFactor(vPosition, uP1Pos);
        if (spot1 > 0.001) {
             float pDay = dot(normalize(uP1Pos), sunDir);
             float isDay = smoothstep(-0.2, 0.2, pDay);
             float isNight = 1.0 - isDay;
             finalCol = mix(finalCol, vec3(0.0), spot1 * 0.7 * isDay);
             finalCol += playerSpotColor * spot1 * 2.0 * isNight;
        }

        // Player 2
        float spot2 = getSpotFactor(vPosition, uP2Pos);
        if (spot2 > 0.001) {
             float pDay = dot(normalize(uP2Pos), sunDir);
             float isDay = smoothstep(-0.2, 0.2, pDay);
             float isNight = 1.0 - isDay;
             finalCol = mix(finalCol, vec3(0.0), spot2 * 0.7 * isDay);
             finalCol += playerSpotColor * spot2 * 2.0 * isNight;
        }

        // Player 3
        float spot3 = getSpotFactor(vPosition, uP3Pos);
        if (spot3 > 0.001) {
             float pDay = dot(normalize(uP3Pos), sunDir);
             float isDay = smoothstep(-0.2, 0.2, pDay);
             float isNight = 1.0 - isDay;
             finalCol = mix(finalCol, vec3(0.0), spot3 * 0.7 * isDay);
             finalCol += playerSpotColor * spot3 * 2.0 * isNight;
        }

        // Player 4
        float spot4 = getSpotFactor(vPosition, uP4Pos);
        if (spot4 > 0.001) {
             float pDay = dot(normalize(uP4Pos), sunDir);
             float isDay = smoothstep(-0.2, 0.2, pDay);
             float isNight = 1.0 - isDay;
             finalCol = mix(finalCol, vec3(0.0), spot4 * 0.7 * isDay);
             finalCol += playerSpotColor * spot4 * 2.0 * isNight;
        }

        float fogFactor = smoothstep(uRadius * 0.8, uRadius * 5.0, vDist);
        float altitudeFactor = smoothstep(uRadius + 30.0, uRadius, length(vPosition));
        float hazeIntensity = max(fogFactor * 0.7, altitudeFactor * 0.15);
        finalCol = mix(finalCol, uAtmosphereColor, hazeIntensity);

        diffuseColor.rgb = finalCol;
        `
      );
    };

    return mat;
  }, [terrainSeed, terrainParams, planetRadius]);

  const oceanGeometry = useMemo(() => new SphereGeometry(planetRadius, 128, 128), [planetRadius]);

  // 3. Transparent Ocean Surface Shader
  const oceanMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorHighlight: { value: new Color("#a5dbff") },
        uSunPosition: { value: new Vector3(20000, 10000, 10000).normalize() },
        uRadius: { value: planetRadius }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorHighlight;
        uniform vec3 uSunPosition;
        uniform float uRadius;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        // Simplex Noise (3D) Helper
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 = v - i + dot(i, C.xxx) ;
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute( permute( permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
            float n_ = 0.142857142857;
            vec3  ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                            dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vec3 viewDir = normalize(vViewPosition);
          vec3 normal = normalize(vNormal);

          float t = uTime * 0.4;
          vec3 pos = vPosition * 0.15; 
          
          float specNoise = snoise(vec3(pos.x * 3.0 + t, pos.y * 3.0, pos.z * 3.0 - t));
          
          vec3 halfVector = normalize(uSunPosition + viewDir);
          float NdotH = max(0.0, dot(normal, halfVector));
          
          float specular = pow(NdotH, 150.0);
          specular *= (0.5 + 0.5 * specNoise); 
          
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 4.0);
          
          vec3 surfColor = vec3(0.0, 0.4, 0.8);
          vec3 finalColor = surfColor + (uColorHighlight * specular * 1.5);
          float alpha = 0.3 + (0.6 * fresnel);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }, [planetRadius]);

  const tempVec = useMemo(() => new Vector3(), []);
  const _origin = useMemo(() => new Vector3(0, 0, 0), []);

  // Visual Radius Interpolation
  const visualRadiusRef = useRef(planetRadius);
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    // Interpolate Visual Radius -> Target (planetRadius)
    // Use MathUtils.lerp for smooth transition
    // Speed factor 2.0 to match camera Feel
    if (Math.abs(visualRadiusRef.current - planetRadius) > 0.05) {
      visualRadiusRef.current = MathUtils.lerp(visualRadiusRef.current, planetRadius, delta * 2.0);
    } else {
      visualRadiusRef.current = planetRadius;
    }

    // Apply SCALING to the Group
    // Scale = Visual / Target (Geometry baked at Target)
    const scale = visualRadiusRef.current / planetRadius;
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
    }

    // Rotation logic
    // CRITICAL: Disable rotation when online to ensure coordinate systems match across clients.
    // CRITICAL: Disable rotation during flight to prevent terrain/collision mismatch.
    const hasPilots = useStore.getState().localParty.length > 0;
    const isFlying = !isPaused; // If not paused, we're flying

    // Rotate ONLY if: Paused AND No Pilots AND Not transitioning
    // This gives the "Orbit" feel when the lobby is empty
    const shouldRotate = isPaused && !hasPilots && !isCameraTransitioning && !isOnline;

    if (shouldRotate) {
      const rotationSpeed = delta * 0.005; // Gentle rotation

      const currentRot = useStore.getState().terrainRotation;
      const newRot = currentRot + rotationSpeed;
      useStore.getState().terrainRotation = newRot;

      if (terrainRef.current) terrainRef.current.rotation.y = newRot;
      if (oceanRef.current) oceanRef.current.rotation.y = newRot;
      if (atmosphereRef.current) atmosphereRef.current.rotation.y = newRot * 1.1;
    } else {
      // When flying or online, reset rotation to 0 for consistency
      const shouldResetRotation = isFlying || isOnline;

      if (shouldResetRotation) {
        useStore.getState().terrainRotation = 0;
        if (terrainRef.current) terrainRef.current.rotation.y = 0;
        if (oceanRef.current) oceanRef.current.rotation.y = 0;
        if (atmosphereRef.current) atmosphereRef.current.rotation.y = 0;
      } else {
        // Paused but with pilots - freeze rotation at current value
        const currentRot = useStore.getState().terrainRotation;
        if (terrainRef.current) terrainRef.current.rotation.y = currentRot;
        if (oceanRef.current) oceanRef.current.rotation.y = currentRot;
        if (atmosphereRef.current) atmosphereRef.current.rotation.y = currentRot * 1.1;
      }
    }

    if (materialShaderRef.current) {
      materialShaderRef.current.uniforms.uForest.value = terrainParams.forestDensity;
      // We keep uRadius as Target (planetRadius) because Geometry is baked at Target.
      // Shader logic usually relies on Vertex Position vs Radius. Since we scaled the Mesh, 
      // Vertex Position (Local) is still Target sized. So uRadius must match Target.
      materialShaderRef.current.uniforms.uRadius.value = planetRadius;
      materialShaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      const currentRot = useStore.getState().terrainRotation;
      const pilotPositions = useStore.getState().pilotPositions;
      const party = useStore.getState().localParty;

      // UPDATE SHADOW UNIFORMS (Supports up to 4)
      for (let i = 0; i < 4; i++) {
        const uniformName = `uP${i + 1}Pos`; // uP1Pos, uP2Pos...
        if (!materialShaderRef.current.uniforms[uniformName]) continue;

        // Only send if pilot exists
        if (party[i] && pilotPositions[i]) {
          tempVec.copy(pilotPositions[i]);
          if (currentRot !== 0) tempVec.applyAxisAngle(new Vector3(0, 1, 0), -currentRot);
          // Inverse scale the Player Position to local space?
          // If we scaled the Planet DOWN, the Player World Pos is still normal.
          // Wait, shadows are projected onto surface.
          // If surface is scaled 0.5x, and player is at 100 distance.
          // The shader computes SpotFactor.
          // Player Pos (100) vs Fragment (Target 100 * Local 1.0).
          // If we passed unscaled PPos to scaled mesh shader...
          // Vertex (Local) is 100. PPos is 100. Shader sees match.
          // BUT Visual Mesh is at 50.
          // Correct: We do not need to scale PPos if Shader logic is in Local Space (Target dependent).
          materialShaderRef.current.uniforms[uniformName].value.copy(tempVec);
        } else {
          materialShaderRef.current.uniforms[uniformName].value.copy(_origin);
        }
      }

      // SYNC SUN POSITION
      tempVec.copy(sunWorldDir);
      if (currentRot !== 0) tempVec.applyAxisAngle(new Vector3(0, 1, 0), -currentRot);
      materialShaderRef.current.uniforms.uSunPos.value.copy(tempVec);
    }

    if (oceanRef.current && (oceanRef.current.material as ShaderMaterial).uniforms) {
      (oceanRef.current.material as ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
      (oceanRef.current.material as ShaderMaterial).uniforms.uRadius.value = planetRadius;
    }
  });

  const atmosphereMaterial = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        color: { value: new Color("#88ccff") },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float viewDot = dot(normalize(vNormal), vec3(0, 0, 1.0));
          float intensity = pow(max(0.0, 1.0 - viewDot), 2.5);
          gl_FragColor = vec4(color, intensity * 1.3); 
        }
      `,
      side: FrontSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh
        name="GlobalTerrain"
        ref={terrainRef}
        geometry={terrainGeometry}
        material={terrainMaterial}
        receiveShadow
        castShadow
      />
      <mesh
        name="GlobalOcean"
        ref={oceanRef}
        geometry={oceanGeometry}
        material={oceanMaterial}
        receiveShadow
      />
      <mesh ref={atmosphereRef} material={atmosphereMaterial}>
        <sphereGeometry args={[atmosphereRadius, 64, 64]} />
      </mesh>
    </group>
  );
};
