import * as THREE from 'three';

// --- TRACKER STATE ---
export let isTrackerActive = false;
let energy = 60.0;
const MAX_ENERGY = 60.0;
let cooldownTimer = 0.0;
const COOLDOWN_TIME = 40.0;
let isOnCooldown = false;

let trackerLight;
let uiBarFill; 

// We will populate this later when we build pages.js
export let pageLocations = []; 

export function initTracker(camera) {
    // 1. Create the Tracker Beam (A tight, eerie green spotlight)
    trackerLight = new THREE.SpotLight(0x44ff44, 0, 150, Math.PI / 10, 0.5, 2);
    trackerLight.position.set(0.5, -0.5, -0.5); // Offset to the right side of the screen
    trackerLight.target.position.set(0, 0, -1);
    
    camera.add(trackerLight);
    camera.add(trackerLight.target);
    trackerLight.visible = false;

    // 2. Input Listener (Q to toggle)
    document.addEventListener('keydown', (e) => {
        // Prevent triggering if a tutorial/menu is open
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial && tutorial.style.display !== 'none' && tutorial.style.opacity !== '0') return;

        if (e.code === 'KeyQ') {
            toggleTracker();
        }
    });
}

function toggleTracker() {
    // Cannot turn it on if it's dead and cooling down
    if (isOnCooldown) return;

    isTrackerActive = !isTrackerActive;
    trackerLight.visible = isTrackerActive;
    
    // Grab the existing battery bar dynamically so we can hijack its visual state
    if (!uiBarFill) uiBarFill = document.getElementById('battery-fill');
    
    if (isTrackerActive) {
        // Optional: If you want Q to auto-disable the flashlight, you would call a flashlight disable function here
        if (uiBarFill) uiBarFill.style.backgroundColor = '#44ff44'; // Turn UI bar green
    } else {
        if (uiBarFill) uiBarFill.style.backgroundColor = '#ffffff'; // Revert to normal flashlight color
    }
}

// Calculates how directly the camera is looking at the closest page
function updateBeamIntensity(camera) {
    if (pageLocations.length === 0) {
        trackerLight.intensity = 2; // Default dim glow if no pages exist yet
        return;
    }

    let maxDot = -1;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    
    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);

    // Check all pages to find the one we are looking at most directly
    for (let pos of pageLocations) {
        const dirToPage = new THREE.Vector3().subVectors(pos, camPos).normalize();
        const dot = camDir.dot(dirToPage); // 1.0 means looking dead at it, -1.0 means it's behind us
        if (dot > maxDot) maxDot = dot;
    }

    // If our view is highly aligned with a page (dot > 0.85), ramp up the brightness
    if (maxDot > 0.85) {
        // Ramp intensity from 2 up to 15 the closer you look at it
        const alignment = (maxDot - 0.85) / 0.15; // Normalizes the 0.85 - 1.0 range to 0 - 1
        trackerLight.intensity = 2 + (alignment * 13);
    } else {
        trackerLight.intensity = 2; // Not looking at a page
    }
}

export function updateTracker(camera, delta) {
    if (!uiBarFill) uiBarFill = document.getElementById('battery-fill');

    // Handle Cooldown State
    if (isOnCooldown) {
        cooldownTimer -= delta;
        
        // Update UI to show the recharge progress (turns red to indicate broken/recharging)
        if (uiBarFill) {
            uiBarFill.style.backgroundColor = '#ff4444';
            uiBarFill.style.width = `${(1 - (cooldownTimer / COOLDOWN_TIME)) * 100}%`;
        }

        if (cooldownTimer <= 0) {
            isOnCooldown = false;
            energy = MAX_ENERGY; // Fully recharged and ready to use
            if (uiBarFill) uiBarFill.style.backgroundColor = '#ffffff'; // Reset to default
        }
        return;
    }

    // Handle Active Drain State
    if (isTrackerActive) {
        energy -= delta;
        
        if (uiBarFill) {
            uiBarFill.style.width = `${(energy / MAX_ENERGY) * 100}%`;
        }

        if (energy <= 0) {
            // Battery died! Force it off and trigger cooldown
            isTrackerActive = false;
            trackerLight.visible = false;
            isOnCooldown = true;
            cooldownTimer = COOLDOWN_TIME;
            return;
        }

        // Pulse the beam based on page proximity
        updateBeamIntensity(camera);
    }
}
