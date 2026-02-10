
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, AdditiveBlending, ShaderMaterial, CylinderGeometry } from 'three';
import { useStore } from '../../store/useStore';

export const ScannerCone: React.FC = () => {
  const meshRef = useRef<any>(null);
  const config = useStore((state) => state.hideAndSeekConfig);
  const hasState = useStore((state) => state.hideAndSeekState);

  // Calculate Geometry based on config
  // Cone Angle is total angle. 
  // Radius at max distance = tan(angle/2) * distance
  const dist = config.catchDistance;
  const angleRad = (config.coneAngle * Math.PI) / 180;
  const radius = Math.tan(angleRad / 2) * dist;

  const geometry = useMemo(() => {
      // Cylinder with top radius 0 = Cone. 
      // We use Cylinder to control open-endedness easily if needed, but standard Cone is fine.
      // Origin of Cylinder is center.
      const geo = new CylinderGeometry(0, radius, dist, 32, 1, true);
      // Shift so tip is at (0,0,0) and it projects along +Y (which we rotate to -Z later)
      geo.translate(0, -dist / 2, 0); 
      geo.rotateX(-Math.PI / 2); // Point along -Z
      return geo;
  }, [radius, dist]);

  const material = useMemo(() => {
      return new ShaderMaterial({
          uniforms: {
              uTime: { value: 0 },
              uColor: { value: [1, 0.2, 0.2] }, // Red
              uLock: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vPos;
            void main() {
                vUv = uv;
                vPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uLock;
            varying vec2 vUv;
            varying vec3 vPos;

            void main() {
                // Fresnel-like edge fade
                // vUv.x wraps 0-1 around perimeter.
                
                // Scanline moving away from ship
                float scan = fract(vUv.y * 5.0 - uTime * 2.0);
                float scanLine = smoothstep(0.0, 0.1, scan) * smoothstep(0.2, 0.1, scan);
                
                // Distance fade (fades out at max range)
                float distFade = 1.0 - smoothstep(0.8, 1.0, 1.0 - vUv.y);
                
                float alpha = 0.1 + (0.2 * scanLine);
                alpha *= distFade;
                
                // Pulse on lock
                if (uLock > 0.0) {
                    float pulse = sin(uTime * 20.0) * 0.5 + 0.5;
                    alpha += pulse * 0.3 * uLock;
                }

                gl_FragColor = vec4(uColor, alpha);
            }
          `,
          transparent: true,
          blending: AdditiveBlending,
          depthWrite: false,
          side: DoubleSide,
      });
  }, []);

  useFrame((state) => {
      if (meshRef.current) {
          meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
          
          // Visualize lock intensity?
          // We can check max lock state
          const locks = hasState.currentLocks;
          const maxLock = Math.max(0, ...Object.values(locks) as number[]);
          meshRef.current.material.uniforms.uLock.value = maxLock;
          
          // Color shift on lock
          if (maxLock > 0) {
              meshRef.current.material.uniforms.uColor.value = [1, 0, 0];
          } else {
              meshRef.current.material.uniforms.uColor.value = [0.2, 0.8, 1]; // Blue scanning
          }
      }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};
