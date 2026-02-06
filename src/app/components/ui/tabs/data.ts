
import { AirplaneType, TerrainParams } from '../../../types';

export const PLANES: { id: AirplaneType; name: string; desc: string }[] = [
  { id: 'interceptor', name: 'Interceptor', desc: 'Balanced multi-role fighter.' },
  { id: 'raptor', name: 'Stealth Raptor', desc: 'Air superiority fighter.' },
  { id: 'bomber', name: 'Heavy Bomber', desc: 'High durability, low speed.' },
  { id: 'scout', name: 'Adv. Scout', desc: 'High speed reconnaissance.' },
  { id: 'viper', name: 'Viper Zero', desc: 'Forward-swept aggression.' },
  { id: 'manta', name: 'Deep Manta', desc: 'Experimental bio-wing.' },
  { id: 'corsair', name: 'Corsair II', desc: 'Bent-wing naval striker.' },
  { id: 'eagle', name: 'Golden Eagle', desc: 'Heavy orbital cruiser.' },
  { id: 'falcon', name: 'Falcon X', desc: 'Hyper-agile interceptor.' },
  { id: 'tempest', name: 'Tempest Heavy', desc: 'Twin-boom heavy fighter.' },
  { id: 'phantom', name: 'Phantom Ray', desc: 'Stealth drone prototype.' },
  { id: 'starling', name: 'Starling Racer', desc: 'Civilian racing modification.' },
];

export const PRESETS: { name: string; desc: string; params: Partial<TerrainParams> }[] = [
  { name: 'Tiny', desc: 'Dense & jagged.', params: { planetRadius: 30, waterLevel: 0.40, mountainScale: 0.85, mountainFrequency: 4.0 } },
  { name: 'Small', desc: 'Standard flyable world.', params: { planetRadius: 50, waterLevel: 0.33, mountainScale: 1.0, mountainFrequency: 2.5 } },
  { name: 'Medium', desc: 'Expansive horizons.', params: { planetRadius: 100, waterLevel: 0.28, mountainScale: 1.0, mountainFrequency: 3.0 } },
  { name: 'Large', desc: 'Massive scale.', params: { planetRadius: 150, waterLevel: 0.28, mountainScale: 1.0, mountainFrequency: 3.0 } },
];
