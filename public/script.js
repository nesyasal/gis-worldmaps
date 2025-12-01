const API_ENDPOINT = '/api/coordinates';

const map = L.map('map').setView([-6.2000, 106.8167], 13); // Default Jakarta

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

async function fetchAndRenderPoints() {
	const listElement = document.getElementById('point-list');
	listElement.innerHTML = 'Memuat data...';

	try {
		const response = await fetch(API_ENDPOINT, { method: 'GET' });
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const points = await response.json();

		// Hapus marker dan layer yang ada
		map.eachLayer(layer => {
			if (layer instanceof L.Marker) {
				map.removeLayer(layer);
			}
		});

		let html = '';
		points.forEach(point => {
			const popupContent = `
                <b>Nama:</b> ${point.name || 'N/A'}<br>
                <b>Deskripsi:</b> ${point.description || 'N/A'}<br>
                <b>Koordinat:</b> ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}<br>
                ${point.denahUrl ? `<a href="${point.denahUrl}" target="_blank">Lihat Denah</a>` : ''}
            `;

			// Buat Marker dan ikat Pop-up
			L.marker([point.lat, point.lng], { title: point.name })
				.addTo(map)
				.bindPopup(popupContent);

			// Buat Daftar Koordinat dengan event klik
			html += `
                <div class="pin-item" 
                     data-lat="${point.lat}" 
                     data-lng="${point.lng}" 
                     onclick="zoomToLocation(this)">
                    <strong>📍 ${point.name || 'N/A'}</strong> 
                    <small>(${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})</small><br>
                    <small>Deskripsi: ${point.description || 'Tidak Ada'}</small>
                </div>
            `;
		});

		listElement.innerHTML = html || '<p>Belum ada titik yang tersimpan. Klik di peta untuk memulai.</p>';

	} catch (error) {
		console.error('Error fetching points:', error);
		listElement.innerHTML = '<p style="color: red;">Gagal memuat data dari API. Cek konsol browser dan Vercel Logs.</p>';
	}
}

let tempCoords = null;

// Fungsi untuk menampilkan modal
function openModal(lat, lng) {
	tempCoords = { lat, lng };
	document.getElementById('modal-coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
	document.getElementById('input-modal').style.display = 'flex';
	// Bersihkan form setiap kali modal dibuka
	document.getElementById('pin-form').reset();
}

// Fungsi untuk menyembunyikan modal
function closeModal() {
	document.getElementById('input-modal').style.display = 'none';
	tempCoords = null;
}

// --- FUNGSI KLIK PETA BARU ---
// Ganti event click peta untuk membuka modal, bukan prompt
map.on('click', function (e) {
	const { lat, lng } = e.latlng;
	openModal(lat, lng);
});

// --- FUNGSI ASLI saveNewPoint (diubah menjadi handleSubmit) ---
// Fungsi untuk mengirim data dari form
async function handleSubmit(event) {
	event.preventDefault(); // Mencegah submit form default (refresh halaman)

	if (!tempCoords) return;

	// Ambil nilai dari form
	const lat = tempCoords.lat;
	const lng = tempCoords.lng;
	const name = document.getElementById('pin-name').value;
	const description = document.getElementById('pin-description').value;
	const denahUrl = document.getElementById('pin-denahUrl').value;

	// Nonaktifkan tombol simpan selama proses
	const submitButton = document.querySelector('.btn-primary');
	submitButton.disabled = true;
	submitButton.textContent = 'Menyimpan...';

	try {
		const response = await fetch(API_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lat, lng, name, description, denahUrl })
		});

		const result = await response.json();

		if (response.ok) {
			alert(`Poin berhasil disimpan! ${result.message}`);
			closeModal(); // Tutup modal setelah sukses
			fetchAndRenderPoints();
		} else {
			alert(`Gagal menyimpan: ${result.message}`);
			console.error('API Save Error:', result);
		}

	} catch (error) {
		console.error('Error saving new point:', error);
		alert('Terjadi kesalahan saat menghubungi server API.');
	} finally {
		submitButton.disabled = false;
		submitButton.textContent = 'Simpan Pin';
	}
}

document.getElementById('pin-form').addEventListener('submit', handleSubmit);

fetchAndRenderPoints();