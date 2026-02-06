
import { useEffect, useRef } from 'react';

interface GamepadMenuHandlers {
  onTogglePause: () => void;
  onTabPrev: () => void;
  onTabNext: () => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onAction: () => void;
  onAltAction?: () => void; // 'Y' / Button 3 (Abort)
  onOptAction?: () => void; // 'Select' / Button 8 (Settings)
  onReset?: () => void;     // 'X' / Button 2
  onBack?: () => void;      // 'B' / Button 1
}

export const useGamepadMenu = (
    isPaused: boolean, 
    handlers: GamepadMenuHandlers, 
    enabled: boolean = true,
    restrictedGamepadIndex: number | null = null // Force specific controller (Host)
) => {
  // Use a ref to store state so it persists across renders without re-triggering effect
  const stateRef = useRef({
    activeDirection: null as 'up' | 'down' | 'left' | 'right' | null,
    nextActionTime: 0,
    currentDelay: 400, // Start slow (400ms)
    releaseTimer: 0,
    // Track start button locks per gamepad to prevent bounce
    startLocks: new Map<number, boolean>(),
    // Track keyboard keys
    keys: {
        up: false, down: false, left: false, right: false,
        action: false, tabPrev: false, tabNext: false, 
        alt: false, opt: false, reset: false, back: false
    },
    keyLock: { 
        action: false, tabPrev: false, tabNext: false, 
        alt: false, opt: false, reset: false, back: false 
    }
  });

  // Keyboard Listeners (Always active if enabled)
  useEffect(() => {
      if (!isPaused || !enabled) return;

      const onKeyDown = (e: KeyboardEvent) => {
          const k = e.key.toLowerCase();
          const s = stateRef.current.keys;
          if (k === 'arrowup' || k === 'w') s.up = true;
          if (k === 'arrowdown' || k === 's') s.down = true;
          if (k === 'arrowleft' || k === 'a') s.left = true;
          if (k === 'arrowright' || k === 'd') s.right = true;
          if (k === 'enter' || k === ' ') s.action = true;
          if (k === 'q') s.tabPrev = true;
          if (k === 'e') s.tabNext = true;
          if (k === 'y' || k === 'c') s.alt = true; 
          if (k === 'tab' || k === 'm') s.opt = true;
          if (k === 'x' || k === 'r') s.reset = true;
          if (k === 'escape' || k === 'backspace') s.back = true;
      };

      const onKeyUp = (e: KeyboardEvent) => {
          const k = e.key.toLowerCase();
          const s = stateRef.current.keys;
          if (k === 'arrowup' || k === 'w') s.up = false;
          if (k === 'arrowdown' || k === 's') s.down = false;
          if (k === 'arrowleft' || k === 'a') s.left = false;
          if (k === 'arrowright' || k === 'd') s.right = false;
          if (k === 'enter' || k === ' ') { s.action = false; stateRef.current.keyLock.action = false; }
          if (k === 'q') { s.tabPrev = false; stateRef.current.keyLock.tabPrev = false; }
          if (k === 'e') { s.tabNext = false; stateRef.current.keyLock.tabNext = false; }
          if (k === 'y' || k === 'c') { s.alt = false; stateRef.current.keyLock.alt = false; }
          if (k === 'tab' || k === 'm') { s.opt = false; stateRef.current.keyLock.opt = false; }
          if (k === 'x' || k === 'r') { s.reset = false; stateRef.current.keyLock.reset = false; }
          if (k === 'escape' || k === 'backspace') { s.back = false; stateRef.current.keyLock.back = false; }
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
      };
  }, [isPaused, enabled]);

  useEffect(() => {
    if (!isPaused) return;

    // PRE-CHECK: If buttons are already held down when menu opens, lock them immediately
    if (restrictedGamepadIndex !== null) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[restrictedGamepadIndex];
        if (gp) {
            // Start Button (9)
            if (gp.buttons[9]?.pressed) stateRef.current.startLocks.set(restrictedGamepadIndex, true);
            // Action Button (0) - 'A'
            if (gp.buttons[0]?.pressed) stateRef.current.startLocks.set(100 + restrictedGamepadIndex, true);
            // Back Button (1) - 'B'
            if (gp.buttons[1]?.pressed) stateRef.current.startLocks.set(500 + restrictedGamepadIndex, true);
            // Bumpers
            if (gp.buttons[4]?.pressed) stateRef.current.startLocks.set(200 + restrictedGamepadIndex, true);
            if (gp.buttons[5]?.pressed) stateRef.current.startLocks.set(300 + restrictedGamepadIndex, true);
            // Alt Button (3) - 'Y'
            if (gp.buttons[3]?.pressed) stateRef.current.startLocks.set(400 + restrictedGamepadIndex, true);
            // Opt Button (8) - 'Select'
            if (gp.buttons[8]?.pressed) stateRef.current.startLocks.set(800 + restrictedGamepadIndex, true);
            // Reset Button (2) - 'X'
            if (gp.buttons[2]?.pressed) stateRef.current.startLocks.set(600 + restrictedGamepadIndex, true);
        }
    }

    let reqId: number;
    let lastTime = performance.now();
    
    const poll = (time: number) => {
        const dt = time - lastTime;
        lastTime = time;

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const state = stateRef.current;

        // --- KEYBOARD LOGIC ---
        // Navigation (Direction)
        let kbDir: 'up' | 'down' | 'left' | 'right' | null = null;
        if (state.keys.up) kbDir = 'up';
        else if (state.keys.down) kbDir = 'down';
        else if (state.keys.left) kbDir = 'left';
        else if (state.keys.right) kbDir = 'right';

        // Actions
        if (state.keys.action && !state.keyLock.action) {
            handlers.onAction();
            state.keyLock.action = true;
        }
        if (state.keys.back && !state.keyLock.back) {
            handlers.onBack?.();
            state.keyLock.back = true;
        }
        if (state.keys.tabPrev && !state.keyLock.tabPrev) {
            handlers.onTabPrev();
            state.keyLock.tabPrev = true;
        }
        if (state.keys.tabNext && !state.keyLock.tabNext) {
            handlers.onTabNext();
            state.keyLock.tabNext = true;
        }
        if (state.keys.alt && !state.keyLock.alt) {
            handlers.onAltAction?.();
            state.keyLock.alt = true;
        }
        if (state.keys.opt && !state.keyLock.opt) {
            handlers.onOptAction?.();
            state.keyLock.opt = true;
        }
        if (state.keys.reset && !state.keyLock.reset) {
            handlers.onReset?.();
            state.keyLock.reset = true;
        }

        // --- GAMEPAD LOGIC ---
        if (restrictedGamepadIndex !== null) {
            const gp = gamepads[restrictedGamepadIndex];
            if (gp) {
                // Navigation D-PAD
                const up = gp.buttons[12]?.pressed;
                const down = gp.buttons[13]?.pressed;
                const left = gp.buttons[14]?.pressed;
                const right = gp.buttons[15]?.pressed;
                
                // Stick as D-Pad
                const stickUp = gp.axes[1] < -0.5;
                const stickDown = gp.axes[1] > 0.5;
                const stickLeft = gp.axes[0] < -0.5;
                const stickRight = gp.axes[0] > 0.5;

                let dir: 'up' | 'down' | 'left' | 'right' | null = kbDir;
                if (up || stickUp) dir = 'up';
                else if (down || stickDown) dir = 'down';
                else if (left || stickLeft) dir = 'left';
                else if (right || stickRight) dir = 'right';

                // Direction Processing
                if (dir) {
                    state.releaseTimer = 0;
                    if (state.activeDirection !== dir) {
                        if (state.activeDirection === null) {
                            handlers.onNavigate(dir);
                            state.activeDirection = dir;
                            state.currentDelay = 400;
                            state.nextActionTime = time + state.currentDelay;
                        }
                    } else {
                        if (time >= state.nextActionTime) {
                            handlers.onNavigate(dir);
                            state.currentDelay = Math.max(100, state.currentDelay * 0.8);
                            state.nextActionTime = time + state.currentDelay;
                        }
                    }
                } else {
                    if (state.activeDirection !== null) {
                        state.releaseTimer += dt;
                        if (state.releaseTimer > 50) state.activeDirection = null; // 50ms release
                    }
                }

                // Helper for button locks
                const checkButton = (btnIdx: number, lockKey: number, callback?: () => void) => {
                    const pressed = gp.buttons[btnIdx]?.pressed;
                    const locked = state.startLocks.get(lockKey);
                    
                    if (pressed && !locked) {
                        state.startLocks.set(lockKey, true);
                        if (callback) callback();
                    } else if (!pressed && locked) {
                        state.startLocks.set(lockKey, false);
                    }
                };

                // Action (A) - 0
                checkButton(0, 100 + restrictedGamepadIndex, handlers.onAction);
                
                // Back (B) - 1
                checkButton(1, 500 + restrictedGamepadIndex, handlers.onBack);

                // Reset (X) - 2
                checkButton(2, 600 + restrictedGamepadIndex, handlers.onReset);

                // Alt (Y) - 3 (ABORT)
                checkButton(3, 400 + restrictedGamepadIndex, handlers.onAltAction);

                // Start (9)
                checkButton(9, restrictedGamepadIndex, handlers.onTogglePause);

                // LB (4) / RB (5)
                checkButton(4, 200 + restrictedGamepadIndex, handlers.onTabPrev);
                checkButton(5, 300 + restrictedGamepadIndex, handlers.onTabNext);

                // Opt (Select) - 8 (SETTINGS)
                checkButton(8, 800 + restrictedGamepadIndex, handlers.onOptAction);
            }
        }

        reqId = requestAnimationFrame(poll);
    };

    reqId = requestAnimationFrame(poll);
    return () => {
        cancelAnimationFrame(reqId);
        window.removeEventListener('keydown', () => {});
        window.removeEventListener('keyup', () => {});
    };
  }, [isPaused, handlers, enabled, restrictedGamepadIndex]);
};
