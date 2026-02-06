
import React, { useRef, useMemo, useEffect } from 'react';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

interface JetExhaustProps {
  color?: string;
  scale?: number; // visual scale factor
  opacity?: number;
  length?: number;
  throttle?: number; // 0 to 1
}

export const JetExhaust: React.FC<JetExhaustProps> = ({ 
  color = "#ffaa00", 
  scale = 1.0, 
  opacity = 0.8,
  length = 3.0,
  throttle = 0.5
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Keep a ref to throttle for the render loop to avoid closure staleness if not re-rendering whole tree
  // though in this setup the parent re-renders on throttle change anyway.
  const throttleRef = useRef(throttle);
  useEffect(() => { throttleRef.current = throttle; }, [throttle]);
  
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.0, 0.25, length, 16, 4, true);
    geo.translate(0, length / 2, 0); 
    return geo;
  }, [length]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uThrottle: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uThrottle;
        varying vec2 vUv;
        
        void main() {
          float fade = pow(1.0 - vUv.y, 1.2);
          
          // Shock diamonds pattern
          float diamond = sin(vUv.y * (15.0 + uThrottle * 10.0) - uTime * (20.0 + uThrottle * 10.0)); 
          diamond = smoothstep(0.1, 0.9, diamond);
          
          // Core intensity 
          float core = 1.0 - abs(vUv.x - 0.5) * 2.0;
          core = pow(core, 2.0);

          float intensity = (0.4 + 0.6 * uThrottle) + (0.4 * diamond * uThrottle);
          
          // White hot core
          vec3 finalColor = mix(uColor, vec3(1.0, 1.0, 1.0), intensity * 0.8 * fade * core * uThrottle);

          float alpha = uOpacity * fade * intensity * core * (0.2 + 0.8 * uThrottle);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [color, opacity]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentThrottle = throttleRef.current;
    const flicker = 1.0 + Math.sin(time * 60.0) * 0.05 * currentThrottle;

    if (meshRef.current) {
        meshRef.current.scale.set(scale * (0.8 + 0.4 * currentThrottle), scale * flicker, scale * (0.8 + 0.4 * currentThrottle));
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uThrottle.value = currentThrottle;
    }

    if (lightRef.current) {
      // Significantly increased brightness and range to help with altitude perception
      // Base intensity + Throttle boost
      lightRef.current.intensity = (10.0 + currentThrottle * 50.0) * flicker;
      // Increased distance so it hits the ground from higher up
      lightRef.current.distance = 40.0;
    }
  });

  return (
    <group> 
       {/* The Volumetric Flame */}
       <mesh 
         ref={meshRef} 
         geometry={geometry} 
         rotation={[-Math.PI / 2, 0, 0]}
       > 
         <primitive object={shaderMaterial} attach="material" />
       </mesh>
       
       {/* Point Light emitting into the scene */}
       <pointLight 
         ref={lightRef}
         color={color}
         decay={1.5}
         position={[0, 0, -3.0]} // Moved further back to avoid self-illumination
       />
    </group>
  );
};
