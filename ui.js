// ui.js

// ==========================================
// 1. EXISTING STATIC & GHOST WARNING LOGIC
// ==========================================

export function updateUIStatic(distToGhost) {
    const staticOverlay = document.getElementById('static-overlay');
    if (!staticOverlay) return;
    
    // Increase static opacity as the ghost gets closer (max 50% opacity)
    let staticOpacity = 0;
    if (distToGhost < 30) {
        staticOpacity = 1.0 - (distToGhost / 30);
    }
    staticOverlay.style.opacity = staticOpacity * 0.5; 
}

export function showGhostWarning() {
    const ghostMsg = document.getElementById('ghost-message');
    if (ghostMsg) {
        ghostMsg.style.opacity = 1;
        // The game loop or another timeout will fade this out when safe
    }
}


// ==========================================
// 2. NEW FLASHLIGHT UI LOGIC
// ==========================================

// Create the UI elements dynamically so we don't have to touch forest.html
const flashlightContainer = document.createElement('div');
flashlightContainer.id = 'flashlight-ui';
flashlightContainer.style.position = 'absolute';
flashlightContainer.style.top = '20px';
flashlightContainer.style.right = '20px'; // Top right corner
flashlightContainer.style.display = 'none'; // Hidden by default
flashlightContainer.style.alignItems = 'center';
flashlightContainer.style.zIndex = '30';

const batteryIcon = document.createElement('img');
batteryIcon.src = 'textures/batteryui.png';
batteryIcon.style.height = '25px'; // Adjust height to fit your PNG
batteryIcon.style.marginRight = '10px';

const barContainer = document.createElement('div');
barContainer.style.width = '150px';
barContainer.style.height = '12px';
barContainer.style.backgroundColor = 'rgba(20, 20, 20, 0.7)'; // Dark background for the empty track
barContainer.style.border = '1px solid #444';

const barFill = document.createElement('div');
barFill.style.width = '100%';
barFill.style.height = '100%';
barFill.style.backgroundColor = 'white'; // The draining white bar
barFill.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)'; // Slight glow for visibility
barFill.style.transition = 'width 0.1s linear'; // Smooth draining animation

// Assemble and inject into the page
barContainer.appendChild(barFill);
flashlightContainer.appendChild(batteryIcon);
flashlightContainer.appendChild(barContainer);
document.body.appendChild(flashlightContainer);

/**
 * Toggles the visibility of the flashlight UI.
 * Call this when the player presses 'F' (or whatever key) to toggle the light.
 * @param {boolean} isOn - Whether the flashlight is currently on.
 */
export function toggleFlashlightUI(isOn) {
    flashlightContainer.style.display = isOn ? 'flex' : 'none';
}

/**
 * Updates the white battery bar fill.
 * Call this inside your game loop when the flashlight is active.
 * @param {number} percentage - The battery level from 0 to 100.
 */
export function updateBatteryUI(percentage) {
    // Clamp between 0 and 100 just in case the math gets weird later
    const safePercent = Math.max(0, Math.min(100, percentage));
    barFill.style.width = `${safePercent}%`;
    
    // Optional: Make the bar turn red if it drops below 15%
    if (safePercent <= 15) {
        barFill.style.backgroundColor = '#aa4444';
        barFill.style.boxShadow = '0 0 5px rgba(170, 68, 68, 0.5)';
    } else {
        barFill.style.backgroundColor = 'white';
        barFill.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
    }
}
