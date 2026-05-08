import * as THREE from 'three';
// Import the flashlight override!
import { forceFlashlightOff } from './flashlight.js';

// --- TRACKER STATE ---
export let isTrackerActive = false;
let energy = 60.0;
const MAX_ENERGY = 60.0;
let cooldownTimer = 0.0;
const COOLDOWN_TIME = 40.0;
let isOnCooldown = false;

let trackerLight;
let uiBarFill; 

export let pageLocations = []; 

export function initTracker(camera) {
    // 1. Create the Tracker Beam
    // The base intensity starts at 0, we control it dynamically in updateBeamIntensity
    trackerLight = new THREE.SpotLight(0x44ff44, 0, 150, Math.PI / 8, 0.5, 2);
    trackerLight.position.set(0.5, -0.5, -0.5); 
    trackerLight.target.position.set(0, 0, -1);
    
    camera.add(trackerLight);
    camera.add(trackerLight.target);
    trackerLight.visible = false;

    // 2. Input Listener (Q to toggle)
    document.addEventListener('keydown', (e) => {
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial && tutorial.style.display !== 'none' && tutorial.style.opacity !== '0') return;

        if (e.code === 'KeyQ') {
            toggleTracker();
        }
    });
}

function toggleTracker() {
    if (isOnCooldown) return;

    isTrackerActive = !isTrackerActive;
    trackerLight.visible = isTrackerActive;
    
    if (!uiBarFill) uiBarFill = document.getElementById('battery-fill');
    
    if (isTrackerActive) {
        if (uiBarFill) uiBarFill.style.backgroundColor = '#44ff44'; 
        
        // Turn off the flashlight when we pull out the tracker
        if (typeof forceFlashlightOff === 'function') {
            forceFlashlightOff();
        }
    } else {
        if (uiBarFill) uiBarFill.style.backgroundColor = '#ffffff'; 
    }
}

function updateBeamIntensity(camera) {
    if (pageLocations.length === 0) {
        trackerLight.intensity = 50; // A dim green glow if no pages exist yet
        return;
    }

    let maxDot = -1;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    
    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);

    for (let pos of pageLocations) {
        // Important: we ignore the Y axis so the player doesn't have to look up/down perfectly
        const flatPos = new THREE.Vector3(pos.x, camPos.y, pos.z);
        const dirToPage = new THREE.Vector3().subVectors(flatPos, camPos).normalize();
        const dot = camDir.dot(dirToPage); 
        if (dot > maxDot) maxDot = dot;
    }

    // If our view is highly aligned with a page (dot > 0.85)
    if (maxDot > 0.85) {
        // Ramp intensity from 50 up to 800 the closer you look at it
        const alignment = (maxDot - 0.85) / 0.15; 
        trackerLight.intensity = 50 + (alignment * 750);
    } else {
        trackerLight.intensity = 50; 
    }
}

export function updateTracker(camera, delta) {
    if (!uiBarFill) uiBarFill = document.getElementById('battery-fill');

    if (isOnCooldown) {
        cooldownTimer -= delta;
        
        if (uiBarFill) {
            uiBarFill.style.backgroundColor = '#ff4444';
            uiBarFill.style.width = `${(1 - (cooldownTimer / COOLDOWN_TIME)) * 100}%`;
        }

        if (cooldownTimer <= 0) {
            isOnCooldown = false;
            energy = MAX_ENERGY; 
            if (uiBarFill) uiBarFill.style.backgroundColor = '#ffffff'; 
        }
        return;
    }

    if (isTrackerActive) {
        energy -= delta;
        
        if (uiBarFill) {
            uiBarFill.style.width = `${(energy / MAX_ENERGY) * 100}%`;
        }

        if (energy <= 0) {
            isTrackerActive = false;
            trackerLight.visible = false;
            isOnCooldown = true;
            cooldownTimer = COOLDOWN_TIME;
            return;
        }

        updateBeamIntensity(camera);
    }
}

// Function to allow the flashlight to force the tracker off if the player presses F
export function forceTrackerOff() {
    if (isTrackerActive) {
        isTrackerActive = false;
        trackerLight.visible = false;
        if (uiBarFill && !isOnCooldown) uiBarFill.style.backgroundColor = '#ffffff';
    }
}
