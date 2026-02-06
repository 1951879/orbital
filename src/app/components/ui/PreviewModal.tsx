
import React, { Suspense } from 'react';
// Fix: Import ThreeElements to provide JSX intrinsic types
import { Canvas, ThreeElements } from '@react-three/fiber';
import { Environment, OrbitControls, Stage, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { AirplanePreview } from './AirplanePreview';
import { PLANES } from './tabs/data';
import { AirplaneType } from '../../../types';

interface Props {
  previewPlane: AirplaneType;
  setPreviewPlane: (p: AirplaneType | null) => void;
  hangarPlayer: 1 | 2;
}

export const PreviewModal: React.FC<Props> = ({ previewPlane, setPreviewPlane, hangarPlayer }) => {
  const gameMode = useStore((state) => state.gameMode);
  const effectivePlayer = gameMode === 'single' ? 1 : hangarPlayer;

  const updatePilot = useStore((state) => state.updatePilot);

  const setAirplaneType = (type: AirplaneType) => {
    updatePilot(effectivePlayer - 1, { airplane: type });
  };

  const planeData = PLANES.find(p => p.id === previewPlane);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md pointer-events-auto p-4 md:p-10">
      <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setPreviewPlane(null)}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 hover:bg-red-500/80 rounded-full text-white transition-colors border border-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Label */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <h2 className="text-3xl font-bold text-white tracking-widest uppercase drop-shadow-md">
            {planeData?.name}
          </h2>
          <p className="text-slate-400 mt-1 text-lg">
            {planeData?.desc}
          </p>
        </div>

        {/* 3D Viewport */}
        <div className="flex-1 w-full h-full bg-gradient-to-b from-slate-800 to-slate-900">
          <Canvas camera={{ position: [4, 2, 6], fov: 40 }} dpr={[1, 2]}>
            <ambientLight intensity={0.4} />
            <spotLight position={[10, 10, 5]} angle={0.5} penumbra={1} intensity={2} castShadow />
            <pointLight position={[-10, -5, -5]} intensity={1} color="#60a5fa" />

            <Environment preset="city" />
            <Stage intensity={0.5} environment="city" adjustCamera={false}>
              <AirplanePreview type={previewPlane} />
            </Stage>
            <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
            </GizmoHelper>
          </Canvas>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end">
          <button
            onClick={() => {
              setAirplaneType(previewPlane);
              setPreviewPlane(null);
            }}
            className={`px-6 py-2 text-white font-bold rounded shadow-lg transition-transform active:scale-95 ${effectivePlayer === 1
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
          >
            EQUIP PLAYER {effectivePlayer}
          </button>
        </div>
      </div>
    </div>
  );
};
