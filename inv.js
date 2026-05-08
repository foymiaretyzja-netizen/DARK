// inv.js
export let isInvOpen = false;

// We store items as objects now to hold their image path, name, and lore text
export const inventory = [
    { 
        id: 'battery', 
        name: 'Flashlight Battery', 
        img: 'textures/battery.png', 
        desc: 'A standard D-cell battery. useful for charging the flashlight when the first batteries dies.' 
    }
];

const MAX_SLOTS = 8;

export function initInventory(pointerLockCallback) {
    const invOverlay = document.getElementById('inventory-overlay');
    const slotContainer = document.getElementById('inventory-slots');
    const inspectImg = document.getElementById('inspect-image');
    const inspectText = document.getElementById('inspect-text');

    function renderInventory() {
        slotContainer.innerHTML = ''; // Clear existing
        
        for (let i = 0; i < MAX_SLOTS; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            
            if (inventory[i]) {
                const item = inventory[i];
                const img = document.createElement('img');
                img.src = item.img;
                slot.appendChild(img);
                
                // Handle selecting the item to inspect it
                slot.onclick = () => {
                    // Remove active class from all, add to this one
                    document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('active'));
                    slot.classList.add('active');
                    
                    inspectImg.src = item.img;
                    inspectImg.style.display = 'block';
                    inspectText.innerHTML = `<strong>${item.name}</strong><br><br>${item.desc}`;
                };
            }
            
            slotContainer.appendChild(slot);
        }
    }

    // Listen for the 'E' key
    document.addEventListener('keydown', (e) => {
        // Don't allow opening inventory if tutorial is still active
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial.style.display !== 'none' && tutorial.style.opacity !== '0') return;

        if (e.code === 'KeyE') {
            isInvOpen = !isInvOpen;
            
            if (isInvOpen) {
                invOverlay.style.display = 'flex';
                inspectImg.style.display = 'none'; // Reset inspect view
                inspectText.innerText = "Select an item to inspect.";
                renderInventory();
                pointerLockCallback(false); // Unlock the mouse so user can click
            } else {
                invOverlay.style.display = 'none';
                pointerLockCallback(true); // Lock the mouse back to the game
            }
        }
    });
}

// Utility functions for later use in your game logic
export function addItem(itemObj) {
    if (inventory.length < MAX_SLOTS) {
        inventory.push(itemObj);
        return true;
    }
    return false; // Inventory full
}

export function hasItem(itemId) {
    return inventory.some(item => item.id === itemId);
}
