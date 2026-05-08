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
    trackerLight = new THREE.SpotLight(0x44ff44, 0, 150, Math.PI / 8, 0.5, 2);
    
    // Center the light slightly below the camera
    trackerLight.position.set(0, -0.2, 0); 
    // Push the target far out on the Z-axis so it points perfectly straight without skewing when you look up/down
    trackerLight.target.position.set(0, -0.2, -20);
    
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

// Casts an invisible line forward and checks if it intersects a page's radius
function updateBeamIntensity(camera) {
    if (pageLocations.length === 0) {
        trackerLight.intensity = 50; // A dim green glow if no pages exist yet
        return;
    }

    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);
    
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    let isDetecting = false;
    let closestLineDist = Infinity;
    
    // The "Aura" or radius around the page that the invisible line needs to touch
    const PAGE_DETECTION_RADIUS = 12.0; 

    for (let pos of pageLocations) {
        // Create a vector pointing from the camera to the page
        const toPage = new THREE.Vector3().subVectors(pos, camPos);
        
        // Project that vector onto our camera's forward direction.
        // This tells us exactly how far forward the page is along our line of sight.
        const distanceForward = toPage.dot(camDir); 

        // Only check pages that are actually in front of us, and within the light's range (150 units)
        if (distanceForward > 0 && distanceForward < 150) {
            
            // Find the exact point on our invisible line that sits adjacent to the page
            const pointOnLine = new THREE.Vector3().copy(camDir).multiplyScalar(distanceForward).add(camPos);
            
            // Calculate how far the page is from our line of sight
            const distToLine = pointOnLine.distanceTo(pos);

            // If the line passes within the page's radius, we are pointing at it!
            if (distToLine < PAGE_DETECTION_RADIUS) {
                isDetecting = true;
                if (distToLine < closestLineDist) {
                    closestLineDist = distToLine;
                }
            }
        }
    }

    if (isDetecting) {
        // Ramp intensity: It gets brighter the closer the invisible line is to the exact center of the page
        const alignment = 1.0 - (closestLineDist / PAGE_DETECTION_RADIUS); 
        trackerLight.intensity = 50 + (alignment * 750); // Ramps up to 800
    } else {
        trackerLight.intensity = 50; // Dim when not detecting anything
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
