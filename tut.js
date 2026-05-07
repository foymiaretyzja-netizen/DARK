// tut.js
export let isGamePaused = true;

export function initTutorial(onCompleteCallback) {
    const overlay = document.getElementById('tutorial-overlay');

    overlay.addEventListener('click', () => {
        // Fade and slide out via CSS
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(-20px)';
        
        // Wait for the CSS transition to finish before removing it entirely
        setTimeout(() => {
            overlay.style.display = 'none';
            isGamePaused = false;
            
            // Execute callback (locks the pointer)
            if (onCompleteCallback) onCompleteCallback();
        }, 1000); 
    });
}
