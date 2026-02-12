
import React, { useRef, useCallback } from 'react';
import { useStore } from '../../../store/useStore';
import { PilotHangarView } from '@/src/app/components/ui/tabs/PilotHangarView';
import { PLANES } from './data';

export const SquadronTab: React.FC = () => {
    const localParty = useStore((state) => state.localParty);
    const setPilotCursor = useStore((state) => state.setPilotCursor);
    const updatePilot = useStore((state) => state.updatePilot);

    const handleCycle = useCallback((pilotId: number, direction: number) => {
        const pilot = localParty.find(p => p.id === pilotId);
        if (!pilot || pilot.ui.status !== 'selecting') return;

        let nextIdx = pilot.ui.cursorIndex + direction;
        const total = PLANES.length;

        // Wrap
        nextIdx = (nextIdx % total + total) % total;

        const planeId = PLANES[nextIdx].id;
        updatePilot(pilotId, { airplane: planeId });
        setPilotCursor(pilotId, nextIdx);
    }, [localParty, setPilotCursor, updatePilot]);

    // Grid columns logic
    const gridCols = localParty.length <= 1 ? 'grid-cols-1' : 'grid-cols-2';

    return (
        <div className={`grid ${gridCols} gap-4 h-full w-full min-h-[300px]`}>
            {localParty.map((pilot) => (
                <div
                    key={pilot.id}
                    className="relative rounded-xl overflow-hidden bg-slate-900/40 border border-white/5 group h-full min-h-[150px]"
                    onWheel={(e) => {
                        // Prevent too sensitive cycling
                        if (Math.abs(e.deltaY) > 50) {
                            handleCycle(pilot.id, e.deltaY > 0 ? 1 : -1);
                        }
                    }}
                >
                    <PilotHangarView pilot={pilot} onCycle={(dir) => handleCycle(pilot.id, dir)} />
                </div>
            ))}
        </div>
    );
};
