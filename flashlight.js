import * as THREE from 'three';
import { toggleFlashlightUI, updateBatteryUI } from './ui.js';
import { addItem } from './inv.js';
// Import the tracker override so turning on the flashlight disables the tracker
import { forceTrackerOff } from './tracker.js'; 

// Unified state variables
export let isFlashlightActive = false; 
export let isFlashing = false; // NEW: The Ghost script will look for this!

let batteryLevel = 100;
let isDead = false;
let flashlightLight;

const MAX_BATTERY_LIFE_SEC = 300; 
const DRAIN_RATE = 100 / MAX_BATTERY_LIFE_SEC; 

export function createFlashlight(camera) {
    // Base intensity of 2. We will spike this during the flash.
    flashlightLight = new THREE.SpotLight(0xffffff, 2, 40, Math.PI / 6, 0.5, 1);
    flashlightLight.position.set(0.5, -0.5, -0.5); 
    flashlightLight.visible = false;
    
    const target = new THREE.Object3D();
    target.position.set(0, 0, -10);
    camera.add(target);
    flashlightLight.target = target;

    camera.add(flashlightLight);

    document.addEventListener('keydown', (e) => {
        // Toggle Flashlight
        if (e.code === 'KeyF' && !isDead) {
            toggleFlashlight();
        }
        
        // NEW: Trigger Flash Burst
        // Only allow a flash if we aren't dead, aren't already flashing, and have at least 10% battery
        if (e.code === 'Space' && !isDead && !isFlashing && batteryLevel >= 10) {
            triggerFlash();
        }
    });

    return flashlightLight;
}

// --- NEW BURST MECHANIC ---
function triggerFlash() {
    isFlashing = true;
    batteryLevel -= 10;
    updateBatteryUI(batteryLevel);
    
    // Temporarily max out the light to simulate a blinding flash
    const previousVisibility = flashlightLight.visible;
    const previousIntensity = flashlightLight.intensity;
    const previousAngle = flashlightLight.angle;

    // Force the light on, make it massive and extremely bright
    flashlightLight.visible = true;
    flashlightLight.intensity = 500; 
    flashlightLight.angle = Math.PI / 2; // Widens the beam to 90 degrees

    // Turn the flash off after a split second (150 milliseconds)
    setTimeout(() => {
        isFlashing = false;
        
        // Revert to how it was before the flash
        flashlightLight.visible = previousVisibility;
        flashlightLight.intensity = previousIntensity;
        flashlightLight.angle = previousAngle;

        // If that blast killed the battery, shut it down
        if (batteryLevel <= 0) {
            killBattery();
        }
    }, 150);
}

export function reloadFlashlight() {
    batteryLevel = 100;
    isDead = false;
    updateBatteryUI(100);
    
    isFlashlightActive = true;
    forceTrackerOff(); 
    
    flickerEffect(() => {
        flashlightLight.visible = true;
        toggleFlashlightUI(true);
    });
}

function toggleFlashlight() {
    isFlashlightActive = !isFlashlightActive;
    
    if (isFlashlightActive) {
        forceTrackerOff(); 
    }

    flickerEffect(() => {
        flashlightLight.visible = isFlashlightActive;
        toggleFlashlightUI(isFlashlightActive);
    });
}

function flickerEffect(callback) {
    const timings = [50, 100, 50, 150];
    let currentTotal = 0;
    timings.forEach((time, i) => {
        currentTotal += time;
        setTimeout(() => {
            flashlightLight.visible = !flashlightLight.visible;
            if (i === timings.length - 1) callback();
        }, currentTotal);
    });
}

export function updateFlashlight(delta) {
    if (isDead) return;
    
    if (isFlashlightActive && !isFlashing) {
        batteryLevel -= DRAIN_RATE * delta;
        updateBatteryUI(batteryLevel);

        if (batteryLevel <= 0) {
            killBattery();
        }
    }
}

// Helper to handle the flashlight dying cleanly
function killBattery() {
    batteryLevel = 0;
    isDead = true;
    isFlashlightActive = false;
    flashlightLight.visible = false;
    toggleFlashlightUI(false);
    
    addItem({
        id: 'dead_battery',
        name: 'Spent Battery',
        img: 'textures/deadbattery.png', 
        desc: 'Completely drained. It feels light and useless now.'
    });
}

export function forceFlashlightOff() {
    if (isFlashlightActive) {
        isFlashlightActive = false;
        if (typeof flashlightLight !== 'undefined') {
            flashlightLight.visible = false;
        }
        toggleFlashlightUI(false); 
    }
}
