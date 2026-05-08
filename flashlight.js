import * as THREE from 'three';
import { toggleFlashlightUI, updateBatteryUI } from './ui.js';
import { addItem } from './inv.js';

export let isFlashlightOn = false;
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
    isFlashlightOn = true;
    flickerEffect(() => {
        flashlightLight.visible = true;
        toggleFlashlightUI(true);
    });
}

function toggleFlashlight() {
    isFlashlightOn = !isFlashlightOn;
    flickerEffect(() => {
        flashlightLight.visible = isFlashlightOn;
        toggleFlashlightUI(isFlashlightOn);
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
    if (isFlashlightOn) {
        batteryLevel -= DRAIN_RATE * delta;
        updateBatteryUI(batteryLevel);

        if (batteryLevel <= 0) {
            batteryLevel = 0;
            isDead = true;
            isFlashlightOn = false;
            flashlightLight.visible = false;
            toggleFlashlightUI(false);
            
            // Corrected dead battery texture path
            addItem({
                id: 'dead_battery',
                name: 'Spent Battery',
                img: 'textures/deadbattery.png', 
                desc: 'Completely drained. It feels light and useless now.'
            });
        }
    }
}
