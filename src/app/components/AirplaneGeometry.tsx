
import React from 'react';
import { AirplaneType } from '../types';
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
}

export const AirplaneGeometry: React.FC<AirplaneGeometryProps> = ({ type, playerId = 1, throttle }) => {
  // If no explicit throttle provided, look up from store based on pilot ID
  const pilotThrottle = useStore((state) => state.localParty[(playerId || 1) - 1]?.throttle ?? 0.5);
  const effectiveThrottle = throttle !== undefined ? throttle : pilotThrottle;

  switch (type) {
    case 'interceptor': return <Interceptor playerId={playerId} throttle={effectiveThrottle} />;
    case 'raptor': return <Raptor playerId={playerId} throttle={effectiveThrottle} />;
    case 'bomber': return <Bomber playerId={playerId} throttle={effectiveThrottle} />;
    case 'scout': return <Scout playerId={playerId} throttle={effectiveThrottle} />;
    case 'viper': return <Viper playerId={playerId} throttle={effectiveThrottle} />;
    case 'manta': return <Manta playerId={playerId} throttle={effectiveThrottle} />;
    case 'corsair': return <Corsair playerId={playerId} throttle={effectiveThrottle} />;
    case 'eagle': return <Eagle playerId={playerId} throttle={effectiveThrottle} />;
    case 'falcon': return <Falcon playerId={playerId} throttle={effectiveThrottle} />;
    case 'tempest': return <Tempest playerId={playerId} throttle={effectiveThrottle} />;
    case 'phantom': return <Phantom playerId={playerId} throttle={effectiveThrottle} />;
    case 'starling': return <Starling playerId={playerId} throttle={effectiveThrottle} />;
    default: return <Interceptor playerId={playerId} throttle={effectiveThrottle} />;
  }
};
