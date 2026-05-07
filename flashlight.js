// flashlight.js
import * as THREE from 'three';

export function createFlashlight() {
    const flashlight = new THREE.SpotLight(0xffeedd, 150, 80, Math.PI / 7, 0.5, 1.5);
    flashlight.position.set(0, -0.2, 0); 
    
    const target = new THREE.Object3D();
    target.position.set(0, -0.2, -1);
    
    flashlight.add(target);
    flashlight.target = target;
    
    return flashlight;
}
