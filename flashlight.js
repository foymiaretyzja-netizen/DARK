import * as THREE from 'three';
import { toggleFlashlightUI, updateBatteryUI } from './ui.js';
import { addItem } from './inv.js';
// Import the tracker override so turning on the flashlight disables the tracker
import { forceTrackerOff } from './tracker.js'; 

// Unified state variable (The Ghost and Tracker scripts look for this exact name)
export let isFlashlightActive = false; 

let batteryLevel = 100;
let isDead = false;
let flashlightLight;

const MAX_BATTERY_LIFE_SEC = 300; 
const DRAIN_RATE = 100 / MAX_BATTERY_LIFE_SEC; 

export function createFlashlight(camera) {
    flashlightLight = new THREE.SpotLight(0xffffff, 2, 40, Math.PI / 6, 0.5, 1);
    flashlightLight.position.set(0.5, -0.5, -0.5); 
    flashlightLight.visible = false;
    
    const target = new THREE.Object3D();
    target.position.set(0, 0, -10);
    camera.add(target);
    flashlightLight.target = target;

    camera.add(flashlightLight);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyF' && !isDead) {
            toggleFlashlight();
        }
    });

    return flashlightLight;
}

// --- NEW RELOAD FUNCTION ---
export function reloadFlashlight() {
    batteryLevel = 100;
    isDead = false;
    updateBatteryUI(100);
    
    // Automatically turn on and flicker when new batteries are in
    isFlashlightActive = true;
    forceTrackerOff(); // Disable tracker if it was out
    
    flickerEffect(() => {
        flashlightLight.visible = true;
        toggleFlashlightUI(true);
    });
}

function toggleFlashlight() {
    isFlashlightActive = !isFlashlightActive;
    
    if (isFlashlightActive) {
        forceTrackerOff(); // Put away the tracker if we turn the flashlight on
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
    
    if (isFlashlightActive) {
        batteryLevel -= DRAIN_RATE * delta;
        updateBatteryUI(batteryLevel);

        if (batteryLevel <= 0) {
            batteryLevel = 0;
            isDead = true;
            isFlashlightActive = false;
            flashlightLight.visible = false;
            toggleFlashlightUI(false);
            
            // Give the player a dead battery item
            addItem({
                id: 'dead_battery',
                name: 'Spent Battery',
                img: 'textures/deadbattery.png', 
                desc: 'Completely drained. It feels light and useless now.'
            });
        }
    }
}

// --- CALLED BY TRACKER TO FORCE FLASHLIGHT OFF ---
export function forceFlashlightOff() {
    if (isFlashlightActive) {
        isFlashlightActive = false;
        if (typeof flashlightLight !== 'undefined') {
            flashlightLight.visible = false;
        }
        toggleFlashlightUI(false); // Update the UI so it shows as off
    }
}
