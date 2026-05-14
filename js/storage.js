const loadData = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn(`Gagal load ${key}:`, e);
        return [];
    }
};

const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

function persistAll() {
    for (let key in STORAGE_KEYS) {
        const varName = key.replace('prodAdmin_', '').toLowerCase() + 'List';
        if (window[varName] !== undefined) {
            saveData(STORAGE_KEYS[key], window[varName]);
        }
    }
    if (window.appUsers) saveData(STORAGE_KEYS.USERS, window.appUsers);
    if (window.activityLog) saveData(STORAGE_KEYS.ACTIVITY, window.activityLog);
    if (window.appSettings) saveData(STORAGE_KEYS.SETTINGS, window.appSettings);
    if (window.boardStockList) saveData(STORAGE_KEYS.BOARDSTOCK, window.boardStockList);
}

function loadAllData() {
    window.kayuList = loadData(STORAGE_KEYS.KAYU);
    window.sawmillList = loadData(STORAGE_KEYS.SAWMILL);
    window.ovenList = loadData(STORAGE_KEYS.OVEN);
    window.produksiList = loadData(STORAGE_KEYS.PRODUKSI);
    window.sezingList = loadData(STORAGE_KEYS.SEZING);
    window.penjualanList = loadData(STORAGE_KEYS.PENJUALAN);
    window.orderList = loadData(STORAGE_KEYS.ORDER);
    window.ovenHistoryList = loadData(STORAGE_KEYS.OVENHISTORY);
    window.opnameList = loadData(STORAGE_KEYS.OPNAME);
    window.appUsers = loadData(STORAGE_KEYS.USERS);
    window.activityLog = loadData(STORAGE_KEYS.ACTIVITY);
    window.appSettings = loadData(STORAGE_KEYS.SETTINGS);
    window.boardStockList = loadData(STORAGE_KEYS.BOARDSTOCK);

    if (!window.appUsers || window.appUsers.length === 0) {
        window.appUsers = [{ id: 'adminDefault', username: 'karyamuda', password: '1234', role: 'admin', nama: 'Administrator' }];
        saveData(STORAGE_KEYS.USERS, window.appUsers);
    } else {
        const exists = window.appUsers.some(u => u.username === 'karyamuda');
        if (!exists) {
            window.appUsers.push({ id: 'adminDefault', username: 'karyamuda', password: '1234', role: 'admin', nama: 'Administrator' });
            saveData(STORAGE_KEYS.USERS, window.appUsers);
        }
    }

    if (!window.appSettings || Object.keys(window.appSettings).length === 0) {
        window.appSettings = {
            targetPlaner: 12, targetRipsaw: 13, targetSeri: 700, targetPress: 700,
            minStokKering: 50, rendemenMin: 65, toleransiSelisih: 2,
            targetKayuHarian: 30, targetSawmillHarian: 25, targetSezingHarian: 15,
            stokAwalKayu: 0
        };
        saveData(STORAGE_KEYS.SETTINGS, window.appSettings);
    }

    if (!window.activityLog) window.activityLog = [];

    const existingChambers = window.ovenList.map(o => o.chamber);
    for (let i = 1; i <= 7; i++) {
        if (!existingChambers.includes(i)) {
            window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
        }
    }
    window.ovenList.sort((a, b) => a.chamber - b.chamber);
    persistAll();
}