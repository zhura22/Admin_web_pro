let currentUser = null;

function autoLogin() {
    // Pastikan user sudah dimuat dari storage.js
    if (window.appUsers && window.appUsers.length > 0) {
        currentUser = window.appUsers[0]; // ambil admin pertama
    } else {
        // Fallback jika benar-benar tidak ada user (seharusnya tidak terjadi karena storage.js sudah inisialisasi)
        currentUser = {
            id: 'adminDefault',
            username: 'admin',
            password: 'admin',
            role: 'admin',
            nama: 'Administrator'
        };
        if (!window.appUsers) window.appUsers = [currentUser];
        else window.appUsers.push(currentUser);
        saveData('prodAdmin_users', window.appUsers);
        persistAll();
    }

    // Tampilkan aplikasi
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('header-user').textContent = `👤 ${currentUser.nama} (${currentUser.role})`;

    // Sembunyikan menu settings jika bukan admin
    document.querySelectorAll('.sidebar-item[data-tab="settings"]').forEach(el => {
        el.style.display = currentUser.role === 'admin' ? '' : 'none';
    });

    initApp();
    logActivity('Auto-Login', 'Auth', `User: ${currentUser.nama}`);
}

// Tunggu data termuat dulu (storage.js sudah dijalankan sebelumnya)
window.addEventListener('DOMContentLoaded', () => {
    loadAllData();  // pastikan data sudah ada
    autoLogin();
});

function logout() {
    location.reload();
}