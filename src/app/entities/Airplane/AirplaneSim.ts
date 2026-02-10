import { Vector3, Quaternion, MathUtils, Euler } from 'three';
import { AIRPLANE_CONFIG, COLLISION_POINTS, AIRPLANE_SCALES } from './AirplaneConfig';
import { SessionState } from '../../../engine/session/SessionState';
import { HapticManager } from '../../../engine/kernel/HapticManager';
import { Time } from '../../../engine/kernel/Time';
import { TerrainManager } from '../../../engine/sim/terrain/TerrainManager';
import { useStore } from '../../store/useStore';
import { AirplaneType } from '../../../types';
import { FlightTuning } from '../../tuning/FlightTuning';

/**
 * AirplaneSim - Spherical Flight Model
 * 
 * Uses radial positioning (altitude = distance from planet center)
 * and gravity alignment to keep the plane oriented to the planet surface.
 * 
 * Now handles:
 * - Input Processing
 * - Physics Integration
 * - Terrain Collision (Single & Multi-point)
 * - Visual Rotation State (for View)
 */
export class AirplaneSim {
    public position = new Vector3(0, 50, 0);
    public quaternion = new Quaternion();
    public currentSpeed = 0;
    public throttle = 0; // 0-1

    // Configuration
    public readonly type: AirplaneType;

    // Spherical flight state
    public altitude = 0;

    // Visual rotation targets (for View layer to read)
    public targetRoll = 0;
    public targetPitch = 0;

    // Collision State
    public isGrounded = false;

    // Reusable temp vectors
    private _velocity = new Vector3();
    private _forward = new Vector3();
    private _planetUp = new Vector3();
    private _shipUp = new Vector3();
    private _alignQuat = new Quaternion();
    private _turnQuat = new Quaternion();
    private _tempPoint = new Vector3();
    private _queryPos = new Vector3();

    // Collision helpers
    private _visualQuat = new Quaternion();
    private _euler = new Euler();


    // State for smoothed "Heavy" flight
    private _inputRoll = 0;
    private _inputPitch = 0;
    private _inputYaw = 0;
    private _currentYawRate = 0;
    public get inputState() {
        return {
            x: this._inputYaw, // Use yaw for X-axis sound modulation (rudder/turn)
            y: this._inputPitch
        };
    }

    constructor(public readonly playerId: number, startPos: Vector3, type: AirplaneType = 'interceptor') {
        this.position.copy(startPos);
        this.altitude = startPos.length();
        this.type = type;
        this.throttle = 0;
    }

    public update() {
        // 0. Pause Check
        if (useStore.getState().isPaused) return;

        const dt = Time.dt;
        const tuning = FlightTuning;

        // Input Retrieval
        let pPitch = 0, pRoll = 0, pYaw = 0, axisThrottle = 0;
        let bFire = false, bBoost = false, bBrake = false;
        let bThrottleUp = false, bThrottleDown = false;

        const player = SessionState.getPlayer(this.playerId);
        if (player) {
            const input = player.input;
            pPitch = input.getAxis("PITCH");
            pRoll = input.getAxis("ROLL");
            pYaw = input.getAxis("YAW");
            axisThrottle = input.getAxis("THROTTLE");

            bThrottleUp = input.getButton("THROTTLE_UP");
            bThrottleDown = input.getButton("THROTTLE_DOWN");

            bBoost = input.getButton("BOOST");
            bBrake = input.getButton("BRAKE");
            bFire = input.getButton("FIRE");
        }

        // 0. Update Throttle
        // Analog Overrides Digital
        if (axisThrottle > 0) {
            // Use analog throttle directly (deadzone already applied in InputMapper)
            this.throttle = axisThrottle;
        } else {
            // Keyboard / Digital Handling
            const THROTTLE_RATE = 0.6;
            if (bThrottleUp) {
                this.throttle += THROTTLE_RATE * dt;
            } else if (bThrottleDown) {
                this.throttle -= THROTTLE_RATE * dt;
            } else if (bBrake) {
                // Air Brake (Throttle Cut)
                this.throttle -= THROTTLE_RATE * dt * 3.0;
            } else {
                // No analog input and no keyboard input - reset to 0
                this.throttle = 0;
            }
        }

        this.throttle = MathUtils.clamp(this.throttle, 0, 1);


        // 1. Calculate Target Speed
        const baseSpeed = tuning.Speed.baseSpeed.value;
        const boostMult = bBoost ? tuning.Speed.boostMultiplier.value : 1.0;
        const targetSpeed = baseSpeed * this.throttle * boostMult;

        // Accelerate/Decelerate
        this.currentSpeed = MathUtils.damp(this.currentSpeed, targetSpeed, tuning.Speed.accelerationRate.value, dt);

        // 2. Agility Multipliers
        // Speed Ratio (0..1)
        const speedRatio = MathUtils.clamp(this.currentSpeed / baseSpeed, 0, 1);

        // Agility Curve: Planes turn better at slower speeds (to a point), stiffen up at high speed
        const agilityMult = 1.0 + (1.0 - speedRatio) * tuning.Agility.minSpeedAgilityMultiplier.value;

        // 3. Input Smoothing (The "Weight" Factor)
        // We damp the INPUT itself before applying it to rotation, simulating control surface delay/inertia
        const smooth = tuning.Input.inputSmoothing.value;
        this._inputRoll = MathUtils.damp(this._inputRoll, pRoll, smooth, dt);
        this._inputPitch = MathUtils.damp(this._inputPitch, pPitch, smooth, dt);
        this._inputYaw = MathUtils.damp(this._inputYaw, pYaw, smooth, dt);

        // 4. Turning Logic (Yaw)
        // Target Rate = Input * MaxTurnSpeed * Agility
        const targetYawRate = -this._inputYaw * tuning.Turning.turnSpeed.value * agilityMult;

        // Accumulate Yaw ('Momentum' feel). 
        // We damp the rate itself slightly for "slide" feel:
        this._currentYawRate = MathUtils.damp(this._currentYawRate, targetYawRate, tuning.Turning.yawMomentumDamping.value, dt);

        const turnAmount = this._currentYawRate * dt;
        this._turnQuat.setFromAxisAngle(new Vector3(0, 1, 0), turnAmount);
        this.quaternion.multiply(this._turnQuat);

        // 5. Pitch & Altitude
        // Pitch Control: W(Down/-1) vs S(Up/+1). 
        // In this game: S (+1) is Pull Up.
        const climbSpeed = tuning.Lift.climbSpeed.value;
        const throttleFactor = Math.max(tuning.Lift.minThrottleForClimb.value, this.throttle);

        // Altitude Change from Pitch
        // Note: Using the SMOOTHED input for altitude change implementation delay
        this.altitude += this._inputPitch * climbSpeed * dt * agilityMult * throttleFactor;


        // 6. Visual Banking (Roll/Pitch) Targets for the View Layer
        // Roll: 
        this.targetRoll = this._inputRoll * tuning.Banking.maxRollAngle.value;

        // Pitch:
        // Visual pitch should reflect input + angle of attack
        const bankAssist = Math.abs(this._inputRoll) * tuning.Banking.pitchBankAssist.value; // Nose drops slightly in turn
        this.targetPitch = (-this._inputPitch * tuning.Banking.maxPitchAngle.value * agilityMult) - bankAssist;

        // 7. Physics Integration
        this._forward.set(0, 0, 1).applyQuaternion(this.quaternion);
        this._velocity.copy(this._forward).multiplyScalar(this.currentSpeed);
        this.position.addScaledVector(this._velocity, dt);

        // 8. Collisions & Constraints
        this.handleTerrainCollision(); // Uses internal tuning if accessed inside

        const terrainParams = useStore.getState().terrainParams;
        const maxAltitude = terrainParams.planetRadius + AIRPLANE_CONFIG.maxAltitude;
        this.altitude = Math.min(this.altitude, maxAltitude);

        this.position.setLength(this.altitude);

        // 9. Gravity Alignment (Re-orient Up vector to planet surface)
        this._planetUp.copy(this.position).normalize();
        this._shipUp.set(0, 1, 0).applyQuaternion(this.quaternion);
        this._alignQuat.setFromUnitVectors(this._shipUp, this._planetUp);

        // Auto-Leveling (Gravity Assist)
        this.quaternion.premultiply(this._alignQuat);

        this.isGrounded = false;
    }

    private handleTerrainCollision() {
        const terrainParams = useStore.getState().terrainParams;
        const planetRadius = terrainParams.planetRadius;
        const terrainRot = useStore.getState().terrainRotation;
        const tuning = FlightTuning;

        // 1. Construct Visual Rotation Quaternion (Bank/Pitch)
        this._euler.set(this.targetPitch, 0, this.targetRoll, 'XYZ');
        this._visualQuat.setFromEuler(this._euler);

        // Get collision points for this hull
        const points = COLLISION_POINTS[this.type];
        if (!points) return;

        // Get visual scale (default to 1 if missing, though it shouldn't be)
        const scale = AIRPLANE_SCALES[this.type] || 1.0;

        let maxRequiredAltitude = -Infinity;
        const currentCenterPos = this.position.clone().setLength(this.altitude);

        for (const pt of points) {
            // Apply SCALE -> Visual Rot -> Physics Rot -> World Pos
            this._tempPoint.copy(pt)
                .multiplyScalar(scale)             // Apply Visual Scale
                .applyQuaternion(this._visualQuat) // Apply Visual (Pitch/Bank)
                .applyQuaternion(this.quaternion)  // Apply Physics (Heading/Gravity)
                .add(currentCenterPos);            // Add World Pos

            // Check against Terrain
            // 1. Get Radius from center
            const pointRadius = this._tempPoint.length();
            const deltaAlt = pointRadius - this.altitude;

            // 2. Query Terrain Height
            this._queryPos.copy(this._tempPoint).normalize().multiplyScalar(planetRadius);

            if (terrainRot !== 0) {
                this._queryPos.applyAxisAngle(new Vector3(0, 1, 0), -terrainRot);
            }

            const h = TerrainManager.instance.getElevation(
                this._queryPos.x,
                this._queryPos.y,
                this._queryPos.z
            );
            const groundAlt = planetRadius + h;

            // 3. Calc Required Center Altitude to clear ground
            const reqAlt = groundAlt - deltaAlt;

            if (reqAlt > maxRequiredAltitude) {
                maxRequiredAltitude = reqAlt;
            }
        }

        const SAFETY_BUFFER = FlightTuning.Collision.collisionSafetyBuffer.value; // Tunable
        const minAllowedAltitude = maxRequiredAltitude + SAFETY_BUFFER;

        // Was grounded previous frame?
        const wasGrounded = this.isGrounded;

        if (this.altitude < minAllowedAltitude) {
            // COLLISION!
            if (!wasGrounded) {
                const diff = maxRequiredAltitude - (minAllowedAltitude - SAFETY_BUFFER);
                console.log(`[COLLISION] Type: ${this.type} | Alt: ${this.altitude.toFixed(2)} | MinAllowed: ${minAllowedAltitude.toFixed(2)} | Alloc: ${diff.toFixed(2)}`);
                console.log(`[COLLISION] Pos: ${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)}`);
            }
            this.altitude = minAllowedAltitude;
            this.isGrounded = true;

            // Friction/Impact Logic
            if (this.currentSpeed > 1.0) {
                const player = SessionState.getPlayer(this.playerId);
                if (player) {
                    const devId = player.deviceId;
                    const maxSpeed = AIRPLANE_CONFIG.speed;

                    if (devId.startsWith('gamepad:')) {
                        const gpIndex = parseInt(devId.split(':')[1]);
                        if (!isNaN(gpIndex)) {

                            // 1. Impact Rumble (Only on transition to Grounded)
                            if (!wasGrounded) {
                                // Hard hit
                                HapticManager.collisionRumble(this.currentSpeed, maxSpeed, gpIndex);
                            }
                            // 2. Taxi Rumble (Continuous, lighter)
                            else {
                                // Only rumble if moving fast enough
                                if (this.currentSpeed > 5.0) {
                                    // Light rumble for rolling on ground
                                    const taxiIntensity = (this.currentSpeed / maxSpeed) * 0.15;
                                    HapticManager.rumble(taxiIntensity, 100, gpIndex);
                                }
                            }
                        }
                    } else if (devId === 'touch' || devId.startsWith('touch')) {
                        // Mobile Vibration - Only on initial impact to save battery/annoyance
                        if (!wasGrounded) {
                            HapticManager.vibrate(200);
                        }
                    }
                }
            }

            this.currentSpeed *= FlightTuning.Collision.collisionSpeedDecay.value;

        } else {
            this.isGrounded = false;
        }
    }
}
