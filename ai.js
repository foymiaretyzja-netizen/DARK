import * as THREE from 'three';
// Import BOTH flashlight states
import { isFlashlightActive, isFlashing } from './flashlight.js';

// --- GHOST STATE ---
let state = 'ROAM';
let targetPos = new THREE.Vector3();
let timeStaring = 0;
let visionCooldown = 0;
let lightBurnTimer = 0.0; // Tracks how long the flashlight has been burning the ghost

// --- CONFIGURATION ---
const STARE_DISTANCE = 40;     // How close until it stops and stares
const CHASE_DISTANCE = 60;     // How far you must run to escape it
const AGRO_TIME_LIMIT = 4.0;   // Seconds of staring before it attacks
const SPEED_ROAM = 3.0;        // Slow wandering speed
const SPEED_CHASE = 18.0;      // Very fast (requires sprinting to survive)
const BURN_TIME_REQUIRED = 3.0;// Seconds of direct light to banish the ghost

let visionGhost = null;
let initialized = false;

// Assets
let texNormal, texChase;
let ghostLight;
let stareMessageUI;

// Picks a random spot on the map for the ghost to walk towards
function pickRandomTarget() {
    const range = 400;
    targetPos.set(
        (Math.random() - 0.5) * range,
        0,
        (Math.random() - 0.5) * range
    );
}

// Moves the ghost only on the X and Z axis
function moveTowards(mesh, tx, tz, speed, delta) {
    const dx = tx - mesh.position.x;
    const dz = tz - mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.1) {
        mesh.position.x += (dx / dist) * speed * delta;
        mesh.position.z += (dz / dist) * speed * delta;
    }
}

// Flashes the ghost in front of the camera, then hard-cuts it away
function triggerVision() {
    visionGhost.visible = true;
    
    // Hard cut after 100 to 300 milliseconds
    setTimeout(() => {
        visionGhost.visible = false;
    }, 100 + Math.random() * 200);
    
    // Reset cooldown so visions don't overlap (wait 4 to 8 seconds)
    visionCooldown = 4 + Math.random() * 4;
}

export function updateGhost(ghostMesh, camera, delta) {
    // 1. Initialize everything on the first frame
    if (!initialized) {
        const texLoader = new THREE.TextureLoader();
        texNormal = texLoader.load('textures/ghost.png');
        texChase = texLoader.load('textures/ghostchase.png');

        const mat = new THREE.MeshBasicMaterial({ 
            map: texNormal, transparent: true, opacity: 0.15, depthTest: false 
        });
        visionGhost = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), mat);
        visionGhost.position.set(0, 0, -2.5);
        visionGhost.visible = false;
        camera.add(visionGhost);
        
        ghostMesh.position.x = (Math.random() - 0.5) * 300;
        ghostMesh.position.z = (Math.random() - 0.5) * 300;

        ghostLight = new THREE.PointLight(0xff0000, 0, 25); 
        ghostLight.position.set(0, 2, 0); 
        ghostMesh.add(ghostLight);

        stareMessageUI = document.createElement('div');
        stareMessageUI.style.position = 'absolute';
        stareMessageUI.style.top = '15%'; 
        stareMessageUI.style.left = '50%';
        stareMessageUI.style.transform = 'translateX(-50%)';
        stareMessageUI.style.width = '400px';
        stareMessageUI.style.height = '100px';
        stareMessageUI.style.backgroundImage = "url('textures/ghostmessage.png')";
        stareMessageUI.style.backgroundSize = 'contain';
        stareMessageUI.style.backgroundRepeat = 'no-repeat';
        stareMessageUI.style.backgroundPosition = 'center';
        stareMessageUI.style.opacity = '0';
        stareMessageUI.style.pointerEvents = 'none';
        stareMessageUI.style.transition = 'opacity 0.5s ease-in-out';
        stareMessageUI.style.zIndex = '30';
        document.body.appendChild(stareMessageUI);
        
        pickRandomTarget();
        initialized = true;
    }

    const distToPlayer = ghostMesh.position.distanceTo(camera.position);

    // --- NEW: 2A. Handle Instant Flash Burst Banishment ---
    if (isFlashing) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);

        const ghostDir = new THREE.Vector3().subVectors(ghostMesh.position, camera.position).normalize();
        const dot = camDir.dot(ghostDir);

        // Wide AoE: dot > 0.4 gives roughly a 130-degree cone in front of the player, within 100 units
        if (dot > 0.4 && distToPlayer < 100) {
            pickRandomTarget();
            ghostMesh.position.copy(targetPos);
            
            state = 'ROAM';
            lightBurnTimer = 0;
            timeStaring = 0;
            ghostMesh.material.opacity = 1.0; 
            stareMessageUI.style.opacity = '0';
            visionCooldown = 5.0; 
            return; // Ghost is gone! Skip the rest of the frame.
        }
    }

    // --- 2B. Handle Gradual Flashlight Banishment (The "Burn" Mechanic) ---
    let isBeingLookedAt = false;

    if (isFlashlightActive && !isFlashing) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);

        const ghostDir = new THREE.Vector3().subVectors(ghostMesh.position, camera.position).normalize();
        const dot = camDir.dot(ghostDir);

        // Tight beam (dot > 0.9) within 80 units
        if (dot > 0.9 && distToPlayer < 80) {
            isBeingLookedAt = true;
        }
    }

    if (isBeingLookedAt) {
        lightBurnTimer += delta;
        ghostMesh.material.opacity = Math.max(0, 1.0 - (lightBurnTimer / BURN_TIME_REQUIRED));

        if (lightBurnTimer >= BURN_TIME_REQUIRED) {
            pickRandomTarget();
            ghostMesh.position.copy(targetPos);
            
            state = 'ROAM';
            lightBurnTimer = 0;
            timeStaring = 0;
            ghostMesh.material.opacity = 1.0; 
            stareMessageUI.style.opacity = '0';
            visionCooldown = 5.0; 
            return; 
        }
    } else {
        if (lightBurnTimer > 0) {
            lightBurnTimer -= delta;
            ghostMesh.material.opacity = Math.min(1.0, 1.0 - (lightBurnTimer / BURN_TIME_REQUIRED));
        }
    }

    // 3. Handle Visions
    if (visionCooldown > 0) {
        visionCooldown -= delta;
    } else if ((state === 'STARE' || state === 'CHASE') && distToPlayer < STARE_DISTANCE + 10) {
        if (Math.random() < 0.02) triggerVision();
    }

    // 4. State Machine Logic
    if (state === 'ROAM') {
        ghostMesh.material.map = texNormal;
        ghostLight.intensity = 0;
        stareMessageUI.style.opacity = '0';
        timeStaring = 0;
        
        if (distToPlayer < STARE_DISTANCE) {
            state = 'STARE';
        } else {
            moveTowards(ghostMesh, targetPos.x, targetPos.z, SPEED_ROAM, delta);
            if (Math.abs(ghostMesh.position.x - targetPos.x) < 2 && Math.abs(ghostMesh.position.z - targetPos.z) < 2) {
                pickRandomTarget();
            }
        }
    } 
    else if (state === 'STARE') {
        ghostMesh.material.map = texNormal;
        ghostLight.intensity = 0;
        stareMessageUI.style.opacity = '1'; 
        
        timeStaring += delta;
        
        if (distToPlayer > STARE_DISTANCE + 5) {
            state = 'ROAM'; 
        } else if (timeStaring >= AGRO_TIME_LIMIT) {
            state = 'CHASE'; 
        }
    } 
    else if (state === 'CHASE') {
        ghostMesh.material.map = texChase; 
        ghostLight.intensity = Math.max(0, 5 * ghostMesh.material.opacity); 
        stareMessageUI.style.opacity = '0'; 
        
        moveTowards(ghostMesh, camera.position.x, camera.position.z, SPEED_CHASE, delta);
        
        if (distToPlayer > CHASE_DISTANCE) {
            state = 'ROAM'; 
        }
    }
}
