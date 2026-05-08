import * as THREE from 'three';

// --- GHOST STATE ---
let state = 'ROAM';
let targetPos = new THREE.Vector3();
let timeStaring = 0;
let visionCooldown = 0;

// --- CONFIGURATION ---
const STARE_DISTANCE = 40;     // How close until it stops and stares
const CHASE_DISTANCE = 60;     // How far you must run to escape it
const AGRO_TIME_LIMIT = 4.0;   // Seconds of staring before it attacks
const SPEED_ROAM = 3.0;        // Slow wandering speed
const SPEED_CHASE = 18.0;      // Very fast (requires sprinting to survive)

// The mesh used for the jumpscare vision
let visionGhost = null;

// Picks a random spot on the map for the ghost to walk towards
function pickRandomTarget() {
    const range = 300;
    targetPos.set(
        (Math.random() - 0.5) * range,
        0,
        (Math.random() - 0.5) * range
    );
}

// Moves the ghost only on the X and Z axis (forest.html handles the Y elevation)
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
    // 1. Initialize the Vision Ghost on the first frame it runs
    if (!visionGhost) {
        const texLoader = new THREE.TextureLoader();
        const tex = texLoader.load('textures/ghost.png');
        // Basic material means lighting doesn't affect it—it glows perfectly in the dark
        const mat = new THREE.MeshBasicMaterial({ 
            map: tex, transparent: true, opacity: 0.15, depthTest: false 
        });
        visionGhost = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), mat);
        
        // Attach it physically to the front of the camera
        visionGhost.position.set(0, 0, -2.5);
        visionGhost.visible = false;
        camera.add(visionGhost);
        
        pickRandomTarget();
    }

    const distToPlayer = ghostMesh.position.distanceTo(camera.position);

    // 2. Handle Visions (Only happens when staring or chasing)
    if (visionCooldown > 0) {
        visionCooldown -= delta;
    } else if ((state === 'STARE' || state === 'CHASE') && distToPlayer < STARE_DISTANCE + 10) {
        // Random 2% chance per frame to trigger once cooldown is up
        if (Math.random() < 0.02) {
            triggerVision();
        }
    }

    // 3. State Machine Logic
    if (state === 'ROAM') {
        timeStaring = 0;
        
        // Player got too close!
        if (distToPlayer < STARE_DISTANCE) {
            state = 'STARE';
        } else {
            // Keep walking to target
            moveTowards(ghostMesh, targetPos.x, targetPos.z, SPEED_ROAM, delta);
            
            // If it reached its random point, pick a new one
            if (Math.abs(ghostMesh.position.x - targetPos.x) < 2 && Math.abs(ghostMesh.position.z - targetPos.z) < 2) {
                pickRandomTarget();
            }
        }
    } 
    else if (state === 'STARE') {
        // Stop moving, just stare. (forest.html already handles the rotation)
        timeStaring += delta;
        
        if (distToPlayer > STARE_DISTANCE + 5) {
            state = 'ROAM'; // Player backed away carefully
        } else if (timeStaring >= AGRO_TIME_LIMIT) {
            state = 'CHASE'; // Player stayed too long, ATTACK!
        }
    } 
    else if (state === 'CHASE') {
        // Sprint at the player!
        moveTowards(ghostMesh, camera.position.x, camera.position.z, SPEED_CHASE, delta);
        
        if (distToPlayer > CHASE_DISTANCE) {
            state = 'ROAM'; // The player successfully outran it
        }
    }
}
