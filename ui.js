// ui.js
let hasShownGhostMessage = false;

export function updateUIStatic(distToGhost) {
    const staticOverlay = document.getElementById('static-overlay');
    if (distToGhost < 30) {
        const staticIntensity = 1 - (distToGhost / 30);
        staticOverlay.style.opacity = staticIntensity * Math.random(); 
    } else {
        staticOverlay.style.opacity = 0;
    }
}

export function showGhostWarning() {
    if (!hasShownGhostMessage) {
        hasShownGhostMessage = true;
        const ghostMsgElem = document.getElementById('ghost-message');
        ghostMsgElem.style.opacity = 1;
        setTimeout(() => { ghostMsgElem.style.opacity = 0; }, 3000);
    }
}
