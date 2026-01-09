const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.getElementById('entry-form').addEventListener('submit', handleEntry);
});

async function fetchData() {
    try {
        const [vehiculesRes, placesRes] = await Promise.all([
            fetch(`${API_URL}/vehicules`),
            fetch(`${API_URL}/places`)
        ]);

        const vehicules = await vehiculesRes.json();
        const places = await placesRes.json();

        updateUI(vehicules, places);
    } catch (error) {
        console.error("Erreur de récupération:", error);
        showSystemMessage("Erreur de connexion au serveur", "error");
    }
}


function updateUI(vehicules, places) {
    const total = places.length;
    const occupied = places.filter(p => p.occupied).length;
    const available = total - occupied;

    document.getElementById('total-slots').textContent = total;
    document.getElementById('occupied-slots').textContent = occupied;
    document.getElementById('available-slots').textContent = available;

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
            row.className = "hover:bg-gray-50 transition-colors";
            row.innerHTML = `
                <td class="px-6 py-4 font-bold text-indigo-600">P-${v.slotNumber}</td>
                <td class="px-6 py-4 font-mono">${v.plateNumber}</td>
                <td class="px-6 py-4">
                    <span class="flex items-center gap-2">
                        ${getVehicleIcon(v.type)} ${v.type}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-500">${new Date(v.entryTime).toLocaleString()}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="handleExit(${v.id}, ${v.slotNumber}, '${v.entryTime}')" 
                        class="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition">
                        Sortie
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

async function handleEntry(e) {
    e.preventDefault();

    const plate = document.getElementById('plate-number').value.toUpperCase();
    const type = document.getElementById('vehicle-type').value;

    try {
        const placesRes = await fetch(`${API_URL}/places`);
        const places = await placesRes.json();
        const freeSlot = places.find(p => !p.occupied);

        if (!freeSlot) {
            showSystemMessage("Désolé, le parking est complet !", "error");
            return;
        }

        const newVehicle = {
            plateNumber: plate,
            type: type,
            entryTime: new Date().toISOString(),
            exitTime: null,
            slotNumber: freeSlot.number
        };

        await fetch(`${API_URL}/vehicules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newVehicle)
        });

        await fetch(`${API_URL}/places/${freeSlot.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ occupied: true })
        });

        showSystemMessage(`Entrée validée pour ${plate} (Place ${freeSlot.number})`, "success");
        document.getElementById('entry-form').reset();
        fetchData();

    } catch (error) {
        showSystemMessage("Erreur lors de l'enregistrement", "error");
    }
}


async function handleExit(id, slotNumber, entryTime) {
    const price = calculatePrice(entryTime);
    
    if (confirm(`Sortie du véhicule.\nTotal à payer : ${price} MAD\nConfirmer ?`)) {
        try {
            await fetch(`${API_URL}/vehicules/${id}`, { method: 'DELETE' });

            const placesRes = await fetch(`${API_URL}/places`);
            const places = await placesRes.json();
            const slot = places.find(p => p.number === slotNumber);

            await fetch(`${API_URL}/places/${slot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ occupied: false })
            });

            showSystemMessage("Véhicule sorti avec succès", "success");
            fetchData();
        } catch (error) {
            showSystemMessage("Erreur lors de la sortie", "error");
        }
    }
}

function calculatePrice(entryTime) {
    const entry = new Date(entryTime);
    const now = new Date();
    const diffInMs = now - entry;
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));

    if (diffInHours <= 1) return 5;
    return 5 + (diffInHours - 1) * 3;
}


function getVehicleIcon(type) {
    if (type === 'moto') return '<i class="fa-solid fa-motorcycle"></i>';
    if (type === 'camion') return '<i class="fa-solid fa-truck"></i>';
    return '<i class="fa-solid fa-car"></i>';
}

function showSystemMessage(text, type) {
    const msgDiv = document.getElementById('system-message');
    msgDiv.textContent = text;
    msgDiv.className = `px-4 py-2 rounded-lg text-sm font-medium ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
    msgDiv.classList.remove('hidden');
    
    setTimeout(() => msgDiv.classList.add('hidden'), 4000);
}