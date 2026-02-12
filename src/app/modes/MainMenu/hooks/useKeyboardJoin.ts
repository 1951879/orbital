import { useEffect } from 'react';
import { useStore } from '../../../store/useStore';
import { SessionState } from '../../../../engine/session/SessionState';

export const useKeyboardJoin = () => {
    const localParty = useStore(state => state.localParty);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // console.log('[useKeyboardJoin] Key:', e.code); // Debug log

            // F -> Join as KB1
            if (e.code === 'KeyF') {
                const hasKb1 = localParty.some(p => p.input.deviceId === 'kb1');
                if (!hasKb1) {
                    for (let i = 0; i < 4; i++) {
                        if (!localParty.find(p => p.id === i)) {
                            console.log('[useKeyboardJoin] Adding KB1 to slot', i);
                            SessionState.addPlayer('kb1', i);
                            break;
                        }
                    }
                }
            }

            // Enter -> Join as KB2
            if (e.code === 'Enter') {
                const hasKb2 = localParty.some(p => p.input.deviceId === 'kb2');
                if (!hasKb2) {
                    for (let i = 0; i < 4; i++) {
                        if (!localParty.find(p => p.id === i)) {
                            console.log('[useKeyboardJoin] Adding KB2 to slot', i);
                            SessionState.addPlayer('kb2', i);
                            break;
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [localParty]);
};
