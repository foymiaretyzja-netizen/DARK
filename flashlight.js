import * as THREE from 'three';
import { toggleFlashlightUI, updateBatteryUI } from './ui.js';
import { addItem } from './inv.js';

export let isFlashlightOn = false;
let batteryLevel = 100;
let isDead = false;
let flashlightLight;

const MAX_BATTERY_LIFE_SEC = 300; // 5 Minutes
const DRAIN_RATE = 100 / MAX_BATTERY_LIFE_SEC; // % per second

export function createFlashlight(camera) {
    // 1. Create the Three.js Spotlight
    flashlightLight = new THREE.SpotLight(0xffffff, 2, 40, Math.PI / 6, 0.5, 1);
    flashlightLight.position.set(0.5, -0.5, -0.5); // Position relative to camera
    flashlightLight.visible = false;
    
    // The light needs a target to point "forward" from the camera
    const target = new THREE.Object3D();
    target.position.set(0, 0, -10);
    camera.add(target);
    flashlightLight.target = target;

    camera.add(flashlightLight);

    // 2. Listen for 'F' Key
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyF' && !isDead) {
            toggleFlashlight();
        }
    });

    return flashlightLight;
}

function toggleFlashlight() {
    isFlashlightOn = !isFlashlightOn;
    
    // Flicker Effect
    flickerEffect(() => {
        flashlightLight.visible = isFlashlightOn;
        toggleFlashlightUI(isFlashlightOn);
    });
}

function flickerEffect(callback) {
    // Rapidly toggle light a few times for a "crunchy" feel
    const timings = [50, 100, 50, 150];
    let currentTotal = 0;

    timings.forEach((time, i) => {
        currentTotal += time;
        setTimeout(() => {
            flashlightLight.visible = !flashlightLight.visible;
            if (i === timings.length - 1) {
                callback();
            }
        }, currentTotal);
    });
}

export function updateFlashlight(delta) {
    if (isDead) return;

    if (isFlashlightOn) {
        // Drain Battery
        batteryLevel -= DRAIN_RATE * delta;
        updateBatteryUI(batteryLevel);

        // Check if dead
        if (batteryLevel <= 0) {
            batteryLevel = 0;
            isDead = true;
            isFlashlightOn = false;
            flashlightLight.visible = false;
            toggleFlashlightUI(false);
            
            // Add greyed out battery to inventory
            addItem({
                id: 'dead_battery',
                name: 'Spent Battery',
                img: 'textures/battery_dead.png', // You'll need to create this greyed version
                desc: 'Completely drained. No use unless I find a way to charge it... or just more batteries.'
            });
        }
    }
}
