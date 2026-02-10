
import React from 'react';
import { AirplaneType } from '../../types';
import { Interceptor } from './airplanes/Interceptor';
import { Raptor } from './airplanes/Raptor';
import { Bomber } from './airplanes/Bomber';
import { Scout } from './airplanes/Scout';
import { Viper } from './airplanes/Viper';
import { Manta } from './airplanes/Manta';
import { Corsair } from './airplanes/Corsair';
import { Eagle } from './airplanes/Eagle';
import { Falcon } from './airplanes/Falcon';
import { Tempest } from './airplanes/Tempest';
import { Phantom } from './airplanes/Phantom';
import { Starling } from './airplanes/Starling';
import { useStore } from '../store/useStore';

interface AirplaneGeometryProps {
  type: AirplaneType;
  playerId?: number;
  throttle?: number; // Optional override for remote players
  throttleRef?: React.MutableRefObject<number>; // Optional 60fps override
}

export const AirplaneGeometry: React.FC<AirplaneGeometryProps> = ({ type, playerId = 1, throttle, throttleRef }) => {
  // If no explicit throttle provided, look up from store based on pilot ID
  const pilotThrottle = useStore((state) => state.localParty[(playerId || 1) - 1]?.throttle ?? 0.5);
  const effectiveThrottle = throttle !== undefined ? throttle : pilotThrottle;

  switch (type) {
    case 'interceptor': return <Interceptor playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'raptor': return <Raptor playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'bomber': return <Bomber playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'scout': return <Scout playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'viper': return <Viper playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'manta': return <Manta playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'corsair': return <Corsair playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'eagle': return <Eagle playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'falcon': return <Falcon playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'tempest': return <Tempest playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'phantom': return <Phantom playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    case 'starling': return <Starling playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
    default: return <Interceptor playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} />;
  }
};
