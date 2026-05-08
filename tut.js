// tut.js
export let isGamePaused = true;
let currentPage = 1;

export function initTutorial(onCompleteCallback) {
    const overlay = document.getElementById('tutorial-overlay');

    // 1. Dynamically create the Page Counter (1/2) at the bottom
    let pageCounter = document.createElement('div');
    pageCounter.style.position = 'absolute';
    pageCounter.style.bottom = '20px';
    pageCounter.style.left = '50%';
    pageCounter.style.transform = 'translateX(-50%)';
    pageCounter.style.color = 'white';
    pageCounter.style.fontSize = '24px';
    pageCounter.style.fontFamily = 'monospace';
    pageCounter.style.pointerEvents = 'none'; // Ensures clicks pass through it
    pageCounter.innerText = '1/2';
    overlay.appendChild(pageCounter);

    // Set the initial transition style so the slide looks smooth
    overlay.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';

    overlay.addEventListener('click', () => {
        if (currentPage === 1) {
            // SLIDE UP OUT: Move page 1 up and fade out
            overlay.style.transform = 'translateY(-100vh)';
            overlay.style.opacity = '0';
            
            // Wait for the slide-out to finish (500ms)
            setTimeout(() => {
                // Update to Page 2
                currentPage = 2;
                pageCounter.innerText = '2/2';
                
                // Swap the image. (Checks if you are using an <img> tag or background-image)
                const img = overlay.querySelector('img');
                if (img) {
                    img.src = 'pages/tut2.png';
                } else {
                    overlay.style.backgroundImage = "url('pages/tut2.png')";
                }

                // Instantly move the overlay to the bottom of the screen silently
                overlay.style.transition = 'none'; 
                overlay.style.transform = 'translateY(100vh)';
                
                // Force the browser to register the new position before turning transitions back on
                void overlay.offsetWidth; 

                // SLIDE UP IN: Slide Page 2 up into the center
                overlay.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
                overlay.style.transform = 'translateY(0)';
                overlay.style.opacity = '1';

            }, 500); 
            
        } else if (currentPage === 2) {
            // FINAL DISMISS: Fade and slide out via CSS
            overlay.style.opacity = '0';
            overlay.style.transform = 'translateY(-20px)';
            
            // Wait for the CSS transition to finish before removing it entirely
            setTimeout(() => {
                overlay.style.display = 'none';
                isGamePaused = false;
                
                // Execute callback (locks the pointer)
                if (onCompleteCallback) onCompleteCallback();
            }, 500); // Sped this up slightly to match the 0.5s transition
        }
    });
}
