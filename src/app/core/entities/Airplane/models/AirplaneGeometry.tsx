
import React from 'react';
import { AIRPLANE_REGISTRY } from '../registry';
import { useStore } from '../../../../store/useStore';

interface AirplaneGeometryProps {
  type: string;
  playerId?: number;
  throttle?: number; // Optional override for remote players
  throttleRef?: React.MutableRefObject<number>; // Optional 60fps override
}

export const AirplaneGeometry: React.FC<AirplaneGeometryProps> = ({ type, playerId = 1, throttle, throttleRef }) => {
  // If no explicit throttle provided, look up from store based on pilot ID
  const pilotThrottle = useStore((state) => state.localParty[(playerId || 1) - 1]?.throttle ?? 0.5);
  const effectiveThrottle = throttle !== undefined ? throttle : pilotThrottle;

  const def = AIRPLANE_REGISTRY[type] || AIRPLANE_REGISTRY['interceptor'];
  const Component = def.Component;

  return <Component playerId={playerId} throttle={effectiveThrottle} throttleRef={throttleRef} scale={def.scale} />;
};
