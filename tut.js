// tut.js
export let isGamePaused = true;

const slides = [
    "Welcome to DARK. You are lost in the woods.",
    "Use W, A, S, D to move. Use your mouse to look around.",
    "Find the ritual site. Beware of what lurks in the fog.",
    "Click 'Start' to begin your nightmare."
];

let currentSlide = 0;

export function initTutorial(onCompleteCallback) {
    const overlay = document.getElementById('tutorial-overlay');
    const textElement = document.getElementById('tutorial-text');
    const nextBtn = document.getElementById('tutorial-next-btn');

    // Initialize first slide
    textElement.innerText = slides[currentSlide];

    nextBtn.addEventListener('click', () => {
        currentSlide++;
        
        if (currentSlide < slides.length) {
            textElement.innerText = slides[currentSlide];
            // Change button text on the last slide
            if (currentSlide === slides.length - 1) {
                nextBtn.innerText = "Start";
            }
        } else {
            // Tutorial finished, unpause game
            overlay.style.display = 'none';
            isGamePaused = false;
            
            // Execute callback (e.g., locking the pointer for camera control)
            if (onCompleteCallback) onCompleteCallback();
        }
    });
}
