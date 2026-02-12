import React from 'react';
import { useStore } from '../../../../store/useStore';
import { PlayerSlot } from '../components/PlayerSlot';

export const HubScreen: React.FC = () => {
    const localParty = useStore(state => state.localParty);

    // Sort active players
    const sortedParty = [...localParty].sort((a, b) => a.id - b.id);

    // Find next available slot index (0-3)
    let nextId = -1;
    const occupied = new Set(localParty.map(p => p.id));
    for (let i = 0; i < 4; i++) {
        if (!occupied.has(i)) {
            nextId = i;
            break;
        }
    }

    return (
        <div className="w-full h-full flex flex-col landscape:flex-row md:flex-row gap-4 p-4 items-stretch justify-center">
            {sortedParty.map(p => (
                <PlayerSlot key={p.id} index={p.id} />
            ))}

            {/* Show Add Button if room allows */}
            {nextId !== -1 && (
                <PlayerSlot key={`empty-${nextId}`} index={nextId} />
            )}
        </div>
    );
};
