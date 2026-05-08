// logs.js
let logContainer = null;
let isLogVisible = false;

export function initLogs() {
    // 1. Create the overlay UI
    logContainer = document.createElement('div');
    logContainer.style.position = 'absolute';
    logContainer.style.top = '0';
    logContainer.style.left = '0';
    logContainer.style.width = '100%';
    logContainer.style.height = '100%';
    logContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    logContainer.style.color = '#ff5555';
    logContainer.style.fontFamily = "'Courier New', monospace";
    logContainer.style.padding = '20px';
    logContainer.style.boxSizing = 'border-box';
    logContainer.style.overflowY = 'auto';
    logContainer.style.zIndex = '9999'; // Force it to the very front
    logContainer.style.display = 'none';
    logContainer.style.pointerEvents = 'none';
    document.body.appendChild(logContainer);

    const title = document.createElement('h2');
    title.style.color = '#ffffff';
    title.innerText = '--- CONSOLE ERRORS ---';
    logContainer.appendChild(title);

    // 2. Hijack the browser's native console.error
    const originalError = console.error;
    console.error = function (...args) {
        originalError.apply(console, args); // Keep standard console behavior
        
        const msg = document.createElement('div');
        msg.style.borderBottom = '1px solid #444';
        msg.style.padding = '10px 0';
        // Attempt to stringify objects so they are readable
        msg.innerText = args.map(arg => {
            try { return typeof arg === 'object' ? JSON.stringify(arg) : arg; } 
            catch(e) { return String(arg); }
        }).join(' ');
        
        logContainer.appendChild(msg);
    };

    // Catch unhandled global errors (like syntax errors in other files)
    window.addEventListener('error', (event) => {
        console.error(`Global Error: ${event.message} at ${event.filename}:${event.lineno}`);
    });

    // 3. Listen for the '9' key to toggle visibility
    window.addEventListener('keydown', (e) => {
        if (e.key === '9') {
            isLogVisible = !isLogVisible;
            logContainer.style.display = isLogVisible ? 'block' : 'none';
        }
    });
}
