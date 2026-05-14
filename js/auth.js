let currentUser = null;

function autoLogin() {
    if (window.appUsers && window.appUsers.length > 0) {
        currentUser = window.appUsers[0];
    } else {
        // fallback (seharusnya tidak terjadi)
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

    document.getElementById('app-container').style.display = 'block';
    document.getElementById('header-user').textContent = `👤 ${currentUser.nama} (${currentUser.role})`;

    document.querySelectorAll('.sidebar-item[data-tab="settings"]').forEach(el => {
        el.style.display = currentUser.role === 'admin' ? '' : 'none';
    });

    initApp();
    logActivity('Auto-Login', 'Auth', `User: ${currentUser.nama}`);
}

window.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    autoLogin();
});

function logout() {
    location.reload();
}