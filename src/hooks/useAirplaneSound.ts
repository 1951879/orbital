
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../app/store/useStore';
import { AirplaneType } from '../types';

// ==================================================================================
// CRITICAL: AUDIO CONFIGURATION LOCKED
// ==================================================================================

interface AudioConfig {
  engineBaseFreq: number;
  engineType: OscillatorType;
  engineMix: number;
  whineBaseFreq: number;
  whineType: OscillatorType;
  whineModulation: number;
  whineMix: number;
  rumbleMix: number;
  rumbleFilterFreq: number;
  windMix: number;
  windTone: number;
  maneuverNoiseOffset: number;
  volMult: number;
}

const AIRPLANE_AUDIO_CONFIG: Record<AirplaneType, AudioConfig> = {
  interceptor: {
    engineBaseFreq: 110, engineType: 'sawtooth', engineMix: 0.18,
    whineBaseFreq: 800, whineType: 'sine', whineModulation: 800, whineMix: 0.04,
    rumbleMix: 0.7, rumbleFilterFreq: 350,
    windMix: 0.6, windTone: 200, maneuverNoiseOffset: 2.0, volMult: 0.3
  },
  raptor: {
    engineBaseFreq: 75, engineType: 'sawtooth', engineMix: 0.25,
    whineBaseFreq: 1000, whineType: 'sine', whineModulation: 600, whineMix: 0.02,
    rumbleMix: 0.8, rumbleFilterFreq: 150,
    windMix: 0.45, windTone: 400, maneuverNoiseOffset: 1.5, volMult: 0.25
  },
  bomber: {
    engineBaseFreq: 50, engineType: 'square', engineMix: 0.35,
    whineBaseFreq: 300, whineType: 'sine', whineModulation: 100, whineMix: 0.01,
    rumbleMix: 1.4, rumbleFilterFreq: 400,
    windMix: 0.8, windTone: 50, maneuverNoiseOffset: 3.0, volMult: 0.35
  },
  scout: {
    engineBaseFreq: 180, engineType: 'triangle', engineMix: 0.1,
    whineBaseFreq: 500, whineType: 'sine', whineModulation: 1000, whineMix: 0.06,
    rumbleMix: 0.2, rumbleFilterFreq: 800,
    windMix: 0.5, windTone: 800, maneuverNoiseOffset: 1.5, volMult: 0.2
  },
  viper: {
    engineBaseFreq: 140, engineType: 'sawtooth', engineMix: 0.25,
    whineBaseFreq: 1200, whineType: 'triangle', whineModulation: 1500, whineMix: 0.08,
    rumbleMix: 0.6, rumbleFilterFreq: 400,
    windMix: 0.5, windTone: 600, maneuverNoiseOffset: 2.5, volMult: 0.32
  },
  manta: {
    engineBaseFreq: 40, engineType: 'sine', engineMix: 0.6,
    whineBaseFreq: 200, whineType: 'square', whineModulation: 50, whineMix: 0.03,
    rumbleMix: 0.3, rumbleFilterFreq: 100,
    windMix: 0.3, windTone: 100, maneuverNoiseOffset: 1.0, volMult: 0.28
  },
  corsair: {
    engineBaseFreq: 90, engineType: 'square', engineMix: 0.4,
    whineBaseFreq: 400, whineType: 'sawtooth', whineModulation: 400, whineMix: 0.05,
    rumbleMix: 1.0, rumbleFilterFreq: 300,
    windMix: 0.7, windTone: 300, maneuverNoiseOffset: 2.0, volMult: 0.3
  },
  eagle: {
    engineBaseFreq: 55, engineType: 'triangle', engineMix: 0.4,
    whineBaseFreq: 250, whineType: 'sine', whineModulation: 200, whineMix: 0.02,
    rumbleMix: 1.6, rumbleFilterFreq: 200,
    windMix: 1.0, windTone: 50, maneuverNoiseOffset: 3.5, volMult: 0.4
  },
  falcon: {
    engineBaseFreq: 130, engineType: 'sawtooth', engineMix: 0.2,
    whineBaseFreq: 1500, whineType: 'sine', whineModulation: 1000, whineMix: 0.06,
    rumbleMix: 0.5, rumbleFilterFreq: 400,
    windMix: 0.6, windTone: 800, maneuverNoiseOffset: 2.2, volMult: 0.3
  },
  tempest: {
    engineBaseFreq: 60, engineType: 'square', engineMix: 0.3,
    whineBaseFreq: 400, whineType: 'sawtooth', whineModulation: 200, whineMix: 0.03,
    rumbleMix: 1.2, rumbleFilterFreq: 250,
    windMix: 0.8, windTone: 200, maneuverNoiseOffset: 2.8, volMult: 0.35
  },
  phantom: {
    engineBaseFreq: 40, engineType: 'sine', engineMix: 0.15,
    whineBaseFreq: 2000, whineType: 'sine', whineModulation: 100, whineMix: 0.01,
    rumbleMix: 0.4, rumbleFilterFreq: 100,
    windMix: 0.9, windTone: 100, maneuverNoiseOffset: 1.0, volMult: 0.25
  },
  starling: {
    engineBaseFreq: 200, engineType: 'triangle', engineMix: 0.4,
    whineBaseFreq: 600, whineType: 'square', whineModulation: 1200, whineMix: 0.08,
    rumbleMix: 0.4, rumbleFilterFreq: 600,
    windMix: 0.4, windTone: 1000, maneuverNoiseOffset: 1.8, volMult: 0.28
  }
};

const AUDIO_ENABLED = true;

// SINGLETON AUDIO CONTEXT
let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      sharedAudioCtx = new Ctx();
    }
  }
  return sharedAudioCtx;
};

export const useAirplaneSound = (
  type: AirplaneType,
  currentSpeedRef: React.MutableRefObject<number>,
  inputRef: React.MutableRefObject<{ x: number; y: number }>,
  maxSpeed: number,
  pan: number = 0 // -1.0 (Left) to 1.0 (Right)
) => {
  const isPaused = useStore((state) => state.isPaused);

  // Audio Context Ref (Reference to Singleton)
  const ctxRef = useRef<AudioContext | null>(null);

  const masterGain = useRef<GainNode | null>(null);
  const stereoPanner = useRef<StereoPannerNode | null>(null);

  // --- Nodes ---
  const coreOsc = useRef<OscillatorNode | null>(null);
  const coreGain = useRef<GainNode | null>(null);
  const whineOsc = useRef<OscillatorNode | null>(null);
  const whineGain = useRef<GainNode | null>(null);
  const rumbleNode = useRef<AudioBufferSourceNode | null>(null);
  const rumbleGain = useRef<GainNode | null>(null);
  const rumbleFilter = useRef<BiquadFilterNode | null>(null);
  const windNode = useRef<AudioBufferSourceNode | null>(null);
  const windGain = useRef<GainNode | null>(null);
  const windFilter = useRef<BiquadFilterNode | null>(null);

  // 1. Initialize Audio Graph (Only depends on TYPE)
  useEffect(() => {
    if (!AUDIO_ENABLED) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    ctxRef.current = ctx;

    const config = AIRPLANE_AUDIO_CONFIG[type];

    // Master Volume
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0;

    // Stereo Panner (Spatial Isolation)
    let pannerNode: StereoPannerNode | null = null;
    if (ctx.createStereoPanner) {
      pannerNode = ctx.createStereoPanner();
      pannerNode.pan.value = pan;
      mainGain.connect(pannerNode);
      pannerNode.connect(ctx.destination);
    } else {
      mainGain.connect(ctx.destination);
    }

    masterGain.current = mainGain;
    stereoPanner.current = pannerNode;

    // --- NOISE BUFFER GENERATION ---
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    // Layer 1: Core
    const cOsc = ctx.createOscillator();
    cOsc.type = config.engineType;
    cOsc.frequency.value = config.engineBaseFreq;
    const cGain = ctx.createGain();
    cGain.gain.value = config.engineMix;
    cOsc.connect(cGain);
    cGain.connect(mainGain);
    cOsc.start();
    coreOsc.current = cOsc;
    coreGain.current = cGain;

    // Layer 2: Whine
    const wOsc = ctx.createOscillator();
    wOsc.type = config.whineType;
    wOsc.frequency.value = config.whineBaseFreq;
    const wGain = ctx.createGain();
    wGain.gain.value = config.whineMix;
    wOsc.connect(wGain);
    wGain.connect(mainGain);
    wOsc.start();
    whineOsc.current = wOsc;
    whineGain.current = wGain;

    // Layer 3: Rumble
    const rSrc = ctx.createBufferSource();
    rSrc.buffer = buffer;
    rSrc.loop = true;
    const rFilter = ctx.createBiquadFilter();
    rFilter.type = 'lowpass';
    rFilter.frequency.value = config.rumbleFilterFreq;
    const rGain = ctx.createGain();
    rGain.gain.value = 0;
    rSrc.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(mainGain);
    rSrc.start();
    rumbleNode.current = rSrc;
    rumbleFilter.current = rFilter;
    rumbleGain.current = rGain;

    // Layer 4: Wind
    const wdSrc = ctx.createBufferSource();
    wdSrc.buffer = buffer;
    wdSrc.loop = true;
    const wdFilter = ctx.createBiquadFilter();
    wdFilter.type = 'highpass';
    wdFilter.frequency.value = config.windTone;
    const wdGain = ctx.createGain();
    wdGain.gain.value = 0;
    wdSrc.connect(wdFilter);
    wdFilter.connect(wdGain);
    wdGain.connect(mainGain);
    wdSrc.start();
    windNode.current = wdSrc;
    windFilter.current = wdFilter;
    windGain.current = wdGain;

    // Cleanup: Disconnect nodes but DO NOT close the shared context
    return () => {
      try {
        // Stop oscillators
        cOsc.stop(); wOsc.stop(); rSrc.stop(); wdSrc.stop();
        // Disconnect from graph
        mainGain.disconnect();
        if (pannerNode) pannerNode.disconnect();
      } catch (e) {
        console.warn("Audio cleanup error", e);
      }
    };
  }, [type]); // Re-run if type changes

  // 2. Dynamic Panning Update
  useEffect(() => {
    if (ctxRef.current && stereoPanner.current) {
      const now = ctxRef.current.currentTime;
      stereoPanner.current.pan.setTargetAtTime(pan, now, 0.1);
    }
  }, [pan]);

  // 3. Frame Loop (Volume & Pitch Modulation)
  useFrame(() => {
    if (!AUDIO_ENABLED) return;
    const ctx = ctxRef.current;
    if (!ctx || !masterGain.current) return;

    // Resume context if suspended
    if (!isPaused && ctx.state === 'suspended') {
      ctx.resume();
    }

    if (isPaused) {
      masterGain.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      return;
    }

    const config = AIRPLANE_AUDIO_CONFIG[type];
    const speedRatio = currentSpeedRef.current / maxSpeed;
    const now = ctx.currentTime;

    // Master Volume
    const baseVol = 0.05 + (speedRatio * config.volMult);
    masterGain.current.gain.setTargetAtTime(baseVol, now, 0.1);

    // Forces
    const gForce = Math.abs(inputRef.current.x) + Math.abs(inputRef.current.y);

    // Update Core
    if (coreOsc.current) {
      let pitch = config.engineBaseFreq + (speedRatio * 50) + (gForce * 15);
      const throbRate = 10 + (speedRatio * 20);
      const throbDepth = 2 + (speedRatio * 2) + (gForce * 5);
      const throb = Math.sin(now * throbRate * Math.PI * 2) * throbDepth;
      coreOsc.current.frequency.setTargetAtTime(pitch + throb, now, 0.05);
    }

    // Update Whine
    if (whineOsc.current && whineGain.current) {
      const pitch = config.whineBaseFreq + (speedRatio * config.whineModulation) + (gForce * 150);
      whineOsc.current.frequency.setTargetAtTime(pitch, now, 0.1);
      let dynamicVol = (Math.pow(speedRatio, 1.5) * config.whineMix);
      dynamicVol += (gForce * config.whineMix * 0.8);
      whineGain.current.gain.setTargetAtTime(dynamicVol, now, 0.1);
    }

    // Update Rumble
    if (rumbleGain.current && rumbleFilter.current) {
      let vol = speedRatio * config.rumbleMix;
      vol += gForce * config.rumbleMix * 0.6;
      rumbleGain.current.gain.setTargetAtTime(vol, now, 0.1);
      const cutoff = config.rumbleFilterFreq + (speedRatio * 200) + (gForce * 150);
      rumbleFilter.current.frequency.setTargetAtTime(cutoff, now, 0.1);
    }

    // Update Wind
    if (windGain.current && windFilter.current) {
      let vol = Math.pow(speedRatio, 2) * config.windMix;
      vol += gForce * speedRatio * config.maneuverNoiseOffset;
      windGain.current.gain.setTargetAtTime(vol, now, 0.1);
      windFilter.current.frequency.setTargetAtTime(config.windTone + (speedRatio * 200) + (gForce * 100), now, 0.1);
    }
  });
};
