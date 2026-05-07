// inv.js
export const inventory = [];

export function addItem(itemName) {
    if (!inventory.includes(itemName)) {
        inventory.push(itemName);
        console.log(`Added to inventory: ${itemName}`);
        // Optionally update a UI inventory screen here
    }
}

export function hasItem(itemName) {
    return inventory.includes(itemName);
}

export function removeItem(itemName) {
    const index = inventory.indexOf(itemName);
    if (index > -1) {
        inventory.splice(index, 1);
        console.log(`Removed from inventory: ${itemName}`);
    }
}
