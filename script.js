const API_URL = 'https://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.getElementById('entry-form').addEventListener('submit', handleEntry);
});

async function fetchData() {
    try {
        const [vehiculesRes, placesRes] = await promise.all([
            fetch(`${API_URL}/vehicules`),
            fetch(`${API_URL}/places`)
        ]);

        const vehicules = await vehiculesRes.json();
        const places = await placesRes.json()

        updateUI(vehicules, places);
    } catch (error) {
        console.error("Recovery error", error);
        showSystemMessage("Server connection error", "error")
    }
}

function updateUI(vehicules, places) {
    const total = places.length;
    const occupied = places.filter(p => p.occupied).length;
    const available = total - occupied;

    document.getElementById('total-slots').textContent = total;
    document.getElementById('ocuupied-slots').textContent = occupied;
    document.getElementById('avialable-places').textContent = available;

    const tableBody = document.getElementById('parking-table-body');
    const emptyState = document.getElementById('empty-state');
    tableBody.innerHTML = '';

    if (vehicules.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        vehicules.forEach(v => {
            const row = document.createElement('tr');
            row.className = 
        })
    }
}