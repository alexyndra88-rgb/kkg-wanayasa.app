
const main = async () => {
    try {
        const response = await fetch('http://localhost:5175/api/laporan/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                judul_laporan: 'Rapat Evaluasi Tengah Semester',
                periode: 'Maret 2026'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Error:', e.message);
    }
};

main();
