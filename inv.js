import { reloadFlashlight } from './flashlight.js';

export let isInvOpen = false;
export let inventory = [
    { 
        id: 'battery', 
        name: 'Flashlight Battery', 
        img: 'textures/battery.png', 
        desc: 'A standard D-cell battery. Useful for charging the flashlight when the first batteries die.' 
    }
];

const MAX_SLOTS = 8;

export function initInventory(pointerLockCallback) {
    const invOverlay = document.getElementById('inventory-overlay');
    const slotContainer = document.getElementById('inventory-slots');
    const inspectImg = document.getElementById('inspect-image');
    const inspectText = document.getElementById('inspect-text');

    function renderInventory() {
        slotContainer.innerHTML = ''; 
        
        for (let i = 0; i < MAX_SLOTS; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            
            if (inventory[i]) {
                const item = inventory[i];
                const img = document.createElement('img');
                img.src = item.img;
                slot.appendChild(img);
                
                slot.onclick = () => {
                    document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('active'));
                    slot.classList.add('active');
                    
                    inspectImg.src = item.img;
                    inspectImg.style.display = 'block';
                    
                    // Create basic text
                    inspectText.innerHTML = `<strong>${item.name}</strong><br><br>${item.desc}<br><br>`;
                    
                    // Add "USE" button if the item is a battery
                    if (item.id === 'battery') {
                        const useBtn = document.createElement('button');
                        useBtn.innerText = "[ INSERT BATTERIES ]";
                        useBtn.style.marginTop = "10px";
                        useBtn.style.padding = "5px 10px";
                        useBtn.style.cursor = "pointer";
                        useBtn.style.fontFamily = "'Courier New', monospace";
                        
                        useBtn.onclick = () => {
                            useItem(i);
                            renderInventory(); // Refresh view
                            // Optional: Close inventory automatically on use
                            // toggleInventory(); 
                        };
                        inspectText.appendChild(useBtn);
                    }
                };
            }
            slotContainer.appendChild(slot);
        }
    }

    function toggleInventory() {
        isInvOpen = !isInvOpen;
        if (isInvOpen) {
            invOverlay.style.display = 'flex';
            inspectImg.style.display = 'none';
            inspectText.innerText = "Select an item to inspect.";
            renderInventory();
            pointerLockCallback(false);
        } else {
            invOverlay.style.display = 'none';
            pointerLockCallback(true);
        }
    }

    document.addEventListener('keydown', (e) => {
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial.style.display !== 'none' && tutorial.style.opacity !== '0') return;

        if (e.code === 'KeyE') {
            toggleInventory();
        }
    });
}

function useItem(index) {
    const item = inventory[index];
    if (item.id === 'battery') {
        reloadFlashlight();
        // Remove the battery from inventory after use
        inventory.splice(index, 1);
        document.getElementById('inspect-image').style.display = 'none';
        document.getElementById('inspect-text').innerText = "Batteries inserted. The light feels strong again.";
    }
}

export function addItem(itemObj) {
    if (inventory.length < MAX_SLOTS) {
        inventory.push(itemObj);
        return true;
    }
    return false;
}

export function hasItem(itemId) {
    return inventory.some(item => item.id === itemId);
}
