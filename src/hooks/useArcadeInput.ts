
import { useEffect, useRef } from 'react';
import { useStore } from '../app/store/useStore';
import { PLANES } from '../app/components/ui/tabs/data';
import { MenuTabId } from '../types';

export const useArcadeInput = (isActive: boolean, activeTab: MenuTabId = 'hangar') => {
    // We use the actions directly, but avoid depending on 'localParty' in the effect dependency array
    // by using useStore.getState() inside the loop. This prevents the loop from breaking on cursor updates.
    const setPilotCursor = useStore((state) => state.setPilotCursor);
    const setPilotStatus = useStore((state) => state.setPilotStatus);
    const updatePilot = useStore((state) => state.updatePilot);
    const updatePilotViewRotation = useStore((state) => state.updatePilotViewRotation);
    const joinParty = useStore((state) => state.joinParty);
    const leaveParty = useStore((state) => state.leaveParty);

    // Per-controller state for debouncing and hold timers
    const controllerStates = useRef<Map<number, {
        activeDirection: string | null;
        nextActionTime: number;
        currentDelay: number;
        releaseTimer: number;
        lastButtons: boolean[];
        bHoldStartTime: number;
        joinTime: number; // NEW: Track when this controller joined
    }>>(new Map());

    // Keyboard state
    const keysRef = useRef<{ [key: string]: boolean }>({});

    // To prevent rapid-fire joining
    const joinLockoutRef = useRef<number>(0);

    useEffect(() => {
        if (!isActive) return;

        // --- KEYBOARD LISTENERS ---
        const onKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
        const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        let reqId: number;
        let lastTime = performance.now();

        const poll = (time: number) => {
            const dt = time - lastTime;
            lastTime = time;

            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const state = useStore.getState();
            const localParty = state.localParty;

            // --- 1. NEW PLAYER DETECTION ---
            // Iterate over ALL connected gamepads to see if any UNASSIGNED ones are pressing A or Start
            if (time > joinLockoutRef.current) {
                // GAMEPADS
                for (let i = 0; i < gamepads.length; i++) {
                    const gp = gamepads[i];
                    if (!gp) continue;

                    // Check if this gamepad index is already assigned to a pilot
                    const isAssigned = localParty.some(p => p.input.type === 'gamepad' && p.input.gamepadIndex === gp.index);

                    if (!isAssigned) {
                        // Check for Join Inputs: A (0) or Start (9)
                        if (gp.buttons[0]?.pressed || gp.buttons[9]?.pressed) {
                            joinParty({ type: 'gamepad', gamepadIndex: gp.index });
                            joinLockoutRef.current = time + 1000; // 1 second lockout
                        }
                    }
                }

                // KEYBOARD JOIN (Enter or Space)
                const isKeyboardAssigned = localParty.some(p => p.input.type === 'mouse_kb' || p.input.type.startsWith('keyboard'));
                if (!isKeyboardAssigned) {
                    if (keysRef.current['Enter'] || keysRef.current['Space']) {
                        joinParty({ type: 'mouse_kb', gamepadIndex: -1 });
                        joinLockoutRef.current = time + 1000;
                    }
                }
            }

            // --- 2. EXISTING PILOT INPUT ---
            localParty.forEach((pilot, pilotIndex) => {
                // Host Logic: If we are NOT in Hangar, Host (Pilot 0) is controlling the DOM Menu via useGamepadMenu.
                // So we skip Arcade Input for them to prevent moving the background cursor while navigating tabs.
                if (activeTab !== 'hangar' && pilotIndex === 0) return;

                const input = pilot.input;

                // --- INPUT SOURCE ABSTRACTION ---
                let up = false, down = false, left = false, right = false;
                let btnA = false, btnB = false;
                let rightStickX = 0;
                let rightStickY = 0;
                let gpIndex = -1;

                if (input.type === 'gamepad' && input.gamepadIndex !== -1) {
                    gpIndex = input.gamepadIndex;
                    const gp = gamepads[gpIndex];
                    if (gp) {
                        btnA = gp.buttons[0]?.pressed;
                        btnB = gp.buttons[1]?.pressed;

                        // NAVIGATION: D-PAD ONLY (Axes removed per user request)
                        up = gp.buttons[12]?.pressed;
                        down = gp.buttons[13]?.pressed;
                        left = gp.buttons[14]?.pressed;
                        right = gp.buttons[15]?.pressed;

                        // Right Stick (Axes 2 & 3) for View Rotation
                        if (Math.abs(gp.axes[2]) > 0.1) rightStickX = gp.axes[2];
                        if (Math.abs(gp.axes[3]) > 0.1) rightStickY = gp.axes[3];
                    }
                } else if (input.type.includes('keyboard') || input.type === 'mouse_kb') {
                    // Map to Virtual "Gamepad ID" for state tracking. 
                    // We use 100 + pilotIndex for keyboard "controllers"
                    gpIndex = 100 + pilotIndex;

                    if (input.type === 'keyboard_wasd' || input.type === 'mouse_kb') {
                        up = keysRef.current['KeyW'];
                        down = keysRef.current['KeyS'];
                        left = keysRef.current['KeyA'];
                        right = keysRef.current['KeyD'];
                        btnA = keysRef.current['Space'] || keysRef.current['Enter'];
                        btnB = keysRef.current['Escape'];
                    }
                    else if (input.type === 'keyboard_arrows') {
                        up = keysRef.current['ArrowUp'];
                        down = keysRef.current['ArrowDown'];
                        left = keysRef.current['ArrowLeft'];
                        right = keysRef.current['ArrowRight'];
                        btnA = keysRef.current['Enter'] || keysRef.current['ShiftRight'];
                        btnB = keysRef.current['Backspace'];
                    }
                }

                if (gpIndex === -1) return; // Touch or undefined

                // --- VIEW ROTATION LOGIC (HANGAR ONLY) ---
                if (activeTab === 'hangar') {
                    if (Math.abs(rightStickX) > 0.05 || Math.abs(rightStickY) > 0.05) {
                        const rotationSpeed = 0.05; // Radians per frame
                        // Invert Y for intuitive pitch
                        updatePilotViewRotation(pilotIndex, rightStickX * rotationSpeed, rightStickY * rotationSpeed);
                    }
                }

                // Get or Init Controller State
                let cState = controllerStates.current.get(gpIndex);
                if (!cState) {
                    const initialButtons = new Array(16).fill(false);
                    if (input.type === 'gamepad' && gamepads[gpIndex]) {
                        const gp = gamepads[gpIndex];
                        if (gp) {
                            for (let k = 0; k < gp.buttons.length; k++) {
                                if (gp.buttons[k]?.pressed) initialButtons[k] = true;
                            }
                        }
                    }

                    cState = {
                        activeDirection: null,
                        nextActionTime: 0,
                        currentDelay: 400,
                        releaseTimer: 0,
                        lastButtons: initialButtons,
                        bHoldStartTime: 0,
                        joinTime: time // Set Join Timestamp
                    };
                    controllerStates.current.set(gpIndex, cState);
                }

                // Input Lockout: Prevent input processing for 500ms after joining to avoid "bounce"
                const isInputLocked = (time - cState.joinTime) < 500;

                // Debounce Helper
                const justPressedA = btnA && !cState.lastButtons[0];
                const justPressedB = btnB && !cState.lastButtons[1];

                // --- 1. SELECTION LOGIC (A / B) ---
                if (justPressedA && !isInputLocked) {
                    if (pilot.ui.status === 'selecting') {
                        setPilotStatus(pilotIndex, 'ready');
                        const planeId = PLANES[pilot.ui.cursorIndex]?.id;
                        if (planeId) updatePilot(pilotIndex, { airplane: planeId });
                    }
                }

                if (justPressedB) {
                    if (pilot.ui.status === 'ready') {
                        setPilotStatus(pilotIndex, 'selecting');
                    }
                }

                // --- 2. DROP OUT LOGIC (Hold B) ---
                // Allow any pilot to leave (including P1/Host)
                if (btnB) {
                    if (cState.bHoldStartTime === 0) {
                        cState.bHoldStartTime = time;
                    } else if (time - cState.bHoldStartTime > 2000) {
                        // HELD FOR 2 SECONDS -> DROP OUT
                        leaveParty(pilot.id);
                        // Critical: Remove controller state to ensure clean re-join logic
                        controllerStates.current.delete(gpIndex);

                        cState.bHoldStartTime = 0;
                        joinLockoutRef.current = time + 1000;
                    }
                } else {
                    cState.bHoldStartTime = 0;
                }

                // --- 3. NAVIGATION LOGIC (Only if Selecting) ---
                if (pilot.ui.status === 'selecting') {
                    let currentDir: 'left' | 'right' | null = null;
                    // Linear Logic: Only Left/Right
                    if (left) currentDir = 'left';
                    else if (right) currentDir = 'right';

                    const applyMove = (dir: string) => {
                        let nextIdx = pilot.ui.cursorIndex;
                        const total = PLANES.length;

                        if (dir === 'left') nextIdx -= 1;
                        if (dir === 'right') nextIdx += 1;

                        // Wrap around
                        if (nextIdx < 0) nextIdx = (nextIdx + total) % total;
                        else if (nextIdx >= total) nextIdx = nextIdx % total;

                        const planeId = PLANES[nextIdx].id;
                        updatePilot(pilotIndex, { airplane: planeId });
                        setPilotCursor(pilotIndex, nextIdx);
                    };

                    if (currentDir) {
                        cState.releaseTimer = 0;
                        if (cState.activeDirection !== currentDir) {
                            if (cState.activeDirection === null) {
                                applyMove(currentDir);
                                cState.activeDirection = currentDir;
                                cState.currentDelay = 400;
                                cState.nextActionTime = time + cState.currentDelay;
                            }
                        } else {
                            if (time >= cState.nextActionTime) {
                                applyMove(currentDir);
                                cState.currentDelay = Math.max(100, cState.currentDelay * 0.8);
                                cState.nextActionTime = time + cState.currentDelay;
                            }
                        }
                    } else {
                        if (cState.activeDirection !== null) {
                            cState.releaseTimer += dt;
                            if (cState.releaseTimer > 100) cState.activeDirection = null;
                        }
                    }
                }

                // Update History
                cState.lastButtons[0] = btnA;
                cState.lastButtons[1] = btnB;
            });

            reqId = requestAnimationFrame(poll);
        };

        reqId = requestAnimationFrame(poll);

        return () => {
            cancelAnimationFrame(reqId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [isActive, activeTab, setPilotCursor, setPilotStatus, updatePilot, updatePilotViewRotation, joinParty, leaveParty]);
};
