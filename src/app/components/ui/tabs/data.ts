
import { AirplaneType, TerrainParams } from '../../../../types';
import { PLANES as REGISTRY_PLANES } from '../../../core/entities/Airplane/registry';

// Re-export planes from the registry — no more manual duplication.
export const PLANES: { id: AirplaneType; name: string; desc: string }[] =
  REGISTRY_PLANES as { id: AirplaneType; name: string; desc: string }[];

export const PRESETS: { name: string; desc: string; params: Partial<TerrainParams> }[] = [
  { name: 'Tiny', desc: 'Dense & jagged.', params: { planetRadius: 30, waterLevel: 0.40, mountainScale: 0.85, mountainFrequency: 4.0 } },
  { name: 'Small', desc: 'Standard flyable world.', params: { planetRadius: 50, waterLevel: 0.33, mountainScale: 1.0, mountainFrequency: 2.5 } },
  { name: 'Medium', desc: 'Expansive horizons.', params: { planetRadius: 100, waterLevel: 0.28, mountainScale: 1.0, mountainFrequency: 3.0 } },
  { name: 'Large', desc: 'Massive scale.', params: { planetRadius: 150, waterLevel: 0.28, mountainScale: 1.0, mountainFrequency: 3.0 } },
];
