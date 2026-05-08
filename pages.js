import * as THREE from 'three';
import { addItem } from './inv.js';
// Assuming we will import a way to update the tracker later in forest.html
// import { pageLocations } from './tracker.js'; 

// --- PAGE DATA ---
const totalPages = 8;
let currentPageIndex = 0;

const pageMetadata = [
    { id: 'page1', name: 'Page 1', img: 'pages/page1.png', text: 'It started in the trees...' },
    { id: 'page2', name: 'Page 2', img: 'pages/page2.png', text: 'They are watching.' },
    { id: 'page3', name: 'Page 3', img: 'pages/page3.png', text: 'The light burns them.' },
    { id: 'page4', name: 'Page 4', img: 'pages/page4.png', text: 'I cannot run forever.' },
    { id: 'page5', name: 'Page 5', img: 'pages/page5.png', text: 'The ground feels hollow.' },
    { id: 'page6', name: 'Page 6', img: 'pages/page6.png', text: 'My own reflection lied.' },
    { id: 'page7', name: 'Page 7', img: 'pages/page7.png', text: 'Almost free. Almost dead.' },
    { id: 'page8', name: 'Page 8', img: 'pages/page8.png', text: 'We are one now.' }
];

// --- SPAWN POOL ---
// You can adjust these coordinates based on your map size
let spawnPoints = [
    new THREE.Vector3(50, 0, 50),
    new THREE.Vector3(-60, 0, 40),
    new THREE.Vector3(80, 0, -70),
    new THREE.Vector3(-90, 0, -90),
    new THREE.Vector3(20, 0, 120),
    new THREE.Vector3(-110, 0, 10),
    new THREE.Vector3(140, 0, -20),
    new THREE.Vector3(-30, 0, -150),
    new THREE.Vector3(160, 0, 100),
    new THREE.Vector3(-180, 0, -60)
];

// --- STATE ---
export let activePageMesh = null;
let pageLight = null;
let floatTime = 0;
let onCollectCallback = null; 

// --- FUNCTIONS ---

export function initPages(scene, startPlayerPos, collectionCallback) {
    onCollectCallback = collectionCallback;
    spawnNextPage(scene, startPlayerPos);
}

function spawnNextPage(scene, playerPos) {
    if (currentPageIndex >= totalPages) return; // All pages collected!

    // 1. Find the nearest spawn point
    let nearestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < spawnPoints.length; i++) {
        const dist = spawnPoints[i].distanceTo(playerPos);
        if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = i;
        }
    }

    const spawnPos = spawnPoints[nearestIndex];
    
    // Remove used point from pool
    spawnPoints.splice(nearestIndex, 1);

    // 2. Create the Page Mesh (2D plane, double-sided)
    const texLoader = new THREE.TextureLoader();
    // Dynamically load the texture based on the current page
    const tex = texLoader.load(`pages/page${currentPageIndex + 1}.png`);
    
    const mat = new THREE.MeshStandardMaterial({ 
        map: tex, 
        side: THREE.DoubleSide, 
        transparent: true 
    });
    
    activePageMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), mat);
    
    // Position it slightly above the ground
    activePageMesh.position.set(spawnPos.x, 2, spawnPos.z);
    
    // 3. Add the Proximity Glow Light
    pageLight = new THREE.PointLight(0xffffff, 0, 15); // Starts at 0 intensity
    pageLight.position.set(0, 0, 0);
    activePageMesh.add(pageLight);

    scene.add(activePageMesh);
}

export function updatePages(scene, camera, delta, trackerPageLocationsArray) {
    if (!activePageMesh) return;

    // 1. Float and Rotate Animation (Minecraft style)
    floatTime += delta;
    activePageMesh.position.y = 2 + Math.sin(floatTime * 2) * 0.5; // Bob up and down
    activePageMesh.rotation.y += delta * 1.5; // Spin constantly

    // 2. Proximity checks
    const distToPlayer = activePageMesh.position.distanceTo(camera.position);

    // Make it glow brighter as you get closer (max intensity 5)
    if (distToPlayer < 30) {
        pageLight.intensity = (1 - (distToPlayer / 30)) * 5;
    } else {
        pageLight.intensity = 0;
    }

    // 3. Update Tracker Array
    // Ensure the tracker knows exactly where this one page is
    trackerPageLocationsArray[0] = activePageMesh.position;

    // 4. Collect the Page
    if (distToPlayer < 4.0) {
        collectPage(scene, camera);
    }
}

function collectPage(scene, camera) {
    // 1. Get current page data
    const pageData = pageMetadata[currentPageIndex];

    // 2. Add to Inventory
    addItem({
        id: pageData.id,
        name: pageData.name,
        img: pageData.img,
        desc: pageData.text // Storing the readable text in the desc field for the inventory UI
    });

    // 3. Cleanup old mesh
    scene.remove(activePageMesh);
    activePageMesh = null;

    // 4. Trigger UI Pause & Callback (Handled in forest.html)
    if (onCollectCallback) {
        onCollectCallback(pageData);
    }

    // 5. Increment and Spawn Next
    currentPageIndex++;
    
    // We pass the camera position so it calculates the NEXT nearest point relative to where you are now
    spawnNextPage(scene, camera.position);
    
    // 6. Trigger World Stage Changes (Hook for later)
    triggerWorldStateChange(currentPageIndex);
}

function triggerWorldStateChange(stage) {
    // We will expand on this later! 
    // Example:
    // if (stage === 3) // Play creepy global sound
    // if (stage === 6) // Increase ghost speed
}
