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

let visionGhost = null;
let initialized = false;

// Assets
let texNormal, texChase;
let ghostLight;
let stareMessageUI;

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
    // 1. Initialize everything on the first frame
    if (!initialized) {
        const texLoader = new THREE.TextureLoader();
        texNormal = texLoader.load('textures/ghost.png');
        texChase = texLoader.load('textures/ghostchase.png');

        // Setup the Jumpscare Vision Ghost
        const mat = new THREE.MeshBasicMaterial({ 
            map: texNormal, transparent: true, opacity: 0.15, depthTest: false 
        });
        visionGhost = new THREE.Mesh(new THREE.PlaneGeometry(3, 6), mat);
        visionGhost.position.set(0, 0, -2.5);
        visionGhost.visible = false;
        camera.add(visionGhost);
        
        // Randomize the initial spawn location
        ghostMesh.position.x = (Math.random() - 0.5) * 300;
        ghostMesh.position.z = (Math.random() - 0.5) * 300;

        // Attach a red light to the ghost (Starts off)
        ghostLight = new THREE.PointLight(0xff0000, 0, 25); 
        ghostLight.position.set(0, 2, 0); 
        ghostMesh.add(ghostLight);

        // Dynamically create the Stare Message UI
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
        ghostMesh.material.map = texNormal;
        ghostLight.intensity = 0;
        stareMessageUI.style.opacity = '0';
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
        ghostMesh.material.map = texNormal;
        ghostLight.intensity = 0;
        stareMessageUI.style.opacity = '1'; // Show the stare message!
        
        // Stop moving, just stare
        timeStaring += delta;
        
        if (distToPlayer > STARE_DISTANCE + 5) {
            state = 'ROAM'; // Player backed away carefully
        } else if (timeStaring >= AGRO_TIME_LIMIT) {
            state = 'CHASE'; // Player stayed too long, ATTACK!
        }
    } 
    else if (state === 'CHASE') {
        ghostMesh.material.map = texChase; // Swap texture
        ghostLight.intensity = 5;          // Turn on the scary red glow
        stareMessageUI.style.opacity = '0'; // Hide the message while running for your life
        
        // Sprint at the player!
        moveTowards(ghostMesh, camera.position.x, camera.position.z, SPEED_CHASE, delta);
        
        if (distToPlayer > CHASE_DISTANCE) {
            state = 'ROAM'; // The player successfully outran it
        }
    }
}
