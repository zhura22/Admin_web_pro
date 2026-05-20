// oven.js — IMPROVED: visual chamber cards, durasi otomatis, statistik, riwayat lengkap
// Struktur data ovenList: [{ id, chamber, openNo, volume, tglMulai, tglSelesai, status, suhu, catatan }]
// status: 'isi' | 'selesai' | 'kosong'

const TOTAL_CHAMBERS = 7;
const DURASI_NORMAL_HARI = 7; // standar pengeringan 7 hari

// ═══════════════════════════════════════════════════════
// RENDER UTAMA
// ═══════════════════════════════════════════════════════
window.renderOven = function () {
    renderOvenSummary();
    renderOvenCards();
    renderOvenHistory();
};

// ═══════════════════════════════════════════════════════
// 1. SUMMARY BAR — statistik semua chamber
// ═══════════════════════════════════════════════════════
function renderOvenSummary() {
    const ovenList = window.ovenList || [];
    const aktif    = ovenList.filter(o => o.status === 'isi');
    const kosong   = TOTAL_CHAMBERS - aktif.length;

    const totVolAktif = aktif.reduce((a, o) => a + (o.volume || 0), 0);
    const totVolSelesai = ovenList.filter(o => o.status === 'selesai').reduce((a, o) => a + (o.volume || 0), 0);

    // Cari chamber yang hampir selesai (sisa ≤ 2 hari)
    const hampirSelesai = aktif.filter(o => {
        const sisa = sisaHari(o.tglMulai);
        return sisa !== null && sisa <= 2;
    });

    // Rata-rata durasi pengisian dari riwayat selesai
    const selesaiList = ovenList.filter(o => o.status === 'selesai' && o.tglMulai && o.tglSelesai);
    const avgDurasi = selesaiList.length > 0
        ? (selesaiList.reduce((a, o) => a + hariAntara(o.tglMulai, o.tglSelesai), 0) / selesaiList.length).toFixed(1)
        : '—';

    const container = document.getElementById('oven-summary-bar');
    if (!container) return;

    container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
        ${ovenKPI('🔥 Chamber Aktif', aktif.length + ' / ' + TOTAL_CHAMBERS, aktif.length > 0 ? 'var(--orange)' : 'var(--muted)')}
        ${ovenKPI('🟢 Chamber Kosong', kosong + ' chamber', kosong > 0 ? 'var(--green)' : 'var(--muted)')}
        ${ovenKPI('📦 Vol. Sedang Kering', fmtDec(totVolAktif, 2) + ' m³', 'var(--gold)')}
        ${ovenKPI('✅ Vol. Sudah Selesai', fmtDec(totVolSelesai, 2) + ' m³', 'var(--blue)')}
        ${ovenKPI('⏱️ Rata-rata Durasi', avgDurasi + ' hari', 'var(--gold-light)')}
        ${ovenKPI('⚠️ Hampir Selesai', hampirSelesai.length + ' chamber', hampirSelesai.length > 0 ? 'var(--red)' : 'var(--muted)')}
    </div>
    ${hampirSelesai.length > 0 ? `
    <div style="background:var(--red-bg);border:1px solid rgba(248,113,113,0.25);border-radius:10px;padding:12px 16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:6px;">⚠️ Segera Selesai / Perlu Perhatian</div>
        ${hampirSelesai.map(o => {
            const sisa = sisaHari(o.tglMulai);
            return `<div style="font-size:12px;color:var(--orange);padding:2px 0;">• Chamber ${o.chamber} — Open ${o.openNo || '?'} · Sisa ~${sisa} hari lagi (mulai ${fmtDate(o.tglMulai)})</div>`;
        }).join('')}
    </div>` : ''}`;
}

function ovenKPI(label, value, color) {
    return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px 16px;">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:5px;">${label}</div>
        <div style="font-size:18px;font-weight:700;color:${color};font-family:var(--font-mono);">${value}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════
// 2. CHAMBER CARDS — visual 7 chamber
// ═══════════════════════════════════════════════════════
function renderOvenCards() {
    const container = document.getElementById('oven-container');
    if (!container) return;

    const ovenList = window.ovenList || [];
    let html = '';

    for (let ch = 1; ch <= TOTAL_CHAMBERS; ch++) {
        // Ambil entry aktif untuk chamber ini
        const aktif = ovenList.find(o => o.chamber === ch && o.status === 'isi');
        // Histori chamber ini
        const history = ovenList.filter(o => o.chamber === ch && o.status === 'selesai').length;

        if (aktif) {
            html += renderChamberAktif(ch, aktif, history);
        } else {
            html += renderChamberKosong(ch, history);
        }
    }

    container.innerHTML = html;
}

function renderChamberAktif(ch, data, historyCount) {
    const durasi    = data.tglMulai ? hariAntara(data.tglMulai, today()) : 0;
    const sisa      = sisaHari(data.tglMulai);
    const progress  = Math.min(100, (durasi / DURASI_NORMAL_HARI) * 100);
    const progColor = progress >= 100 ? 'var(--green)' : progress >= 70 ? 'var(--gold)' : 'var(--orange)';

    // Status suhu (opsional)
    const suhuInfo  = data.suhu ? `· ${data.suhu}°C` : '';

    return `
    <div class="oven-card" style="border:2px solid var(--orange);position:relative;overflow:hidden;">
        <!-- Glow aktif -->
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--orange),var(--gold),var(--orange));animation:shimmer 2s linear infinite;"></div>

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--orange);">🔥 Chamber ${ch}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px;">${historyCount} siklus sebelumnya</div>
            </div>
            <div style="display:flex;gap:6px;">
                <span style="background:rgba(255,159,67,0.15);color:var(--orange);border:1px solid rgba(255,159,67,0.3);padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;">● AKTIF</span>
            </div>
        </div>

        <!-- Info Utama -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
            <div style="background:var(--bg3);border-radius:8px;padding:10px;">
                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;">Open No.</div>
                <div style="font-size:16px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${data.openNo || '—'}</div>
            </div>
            <div style="background:var(--bg3);border-radius:8px;padding:10px;">
                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;">Volume</div>
                <div style="font-size:16px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${fmtDec(data.volume || 0, 2)} <span style="font-size:10px">m³</span></div>
            </div>
            <div style="background:var(--bg3);border-radius:8px;padding:10px;">
                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;">Mulai</div>
                <div style="font-size:13px;font-weight:700;color:var(--text);font-family:var(--font-mono);">${fmtDate(data.tglMulai) || '—'}</div>
            </div>
            <div style="background:var(--bg3);border-radius:8px;padding:10px;">
                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;">Berjalan</div>
                <div style="font-size:16px;font-weight:700;color:${progColor};font-family:var(--font-mono);">${durasi} <span style="font-size:10px">hari</span></div>
            </div>
        </div>

        <!-- Progress Bar Pengeringan -->
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:5px;">
                <span>Progres Pengeringan</span>
                <span style="color:${progColor}">${progress.toFixed(0)}% dari ${DURASI_NORMAL_HARI} hari</span>
            </div>
            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${progress.toFixed(1)}%;background:linear-gradient(90deg,var(--orange),${progColor});border-radius:4px;transition:width .5s ease;"></div>
            </div>
            <div style="font-size:10px;color:${sisa !== null && sisa <= 0 ? 'var(--green)' : 'var(--muted)'};margin-top:4px;">
                ${sisa !== null
                    ? sisa <= 0
                        ? '✅ Siap diangkat!'
                        : `Estimasi selesai: ~${sisa} hari lagi (${estimasiSelesai(data.tglMulai)})`
                    : '—'}
            </div>
        </div>

        ${data.suhu ? `<div style="font-size:11px;color:var(--orange);margin-bottom:8px;">🌡️ Suhu: ${data.suhu}°C</div>` : ''}
        ${data.catatan ? `<div style="font-size:11px;color:var(--muted);margin-bottom:10px;">📝 ${data.catatan}</div>` : ''}

        <!-- Tombol Aksi -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="openOvenEditForm(${data.id})">✏️ Edit</button>
            <button class="btn btn-sm" style="background:rgba(74,222,128,0.15);color:var(--green);border-color:rgba(74,222,128,0.3);" onclick="selesaikanOven(${data.id})">✅ Selesai</button>
            <button class="btn btn-del btn-sm" onclick="hapusOven(${data.id})">🗑️</button>
        </div>
    </div>`;
}

function renderChamberKosong(ch, historyCount) {
    return `
    <div class="oven-card" style="border:1px dashed var(--border);opacity:0.85;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--muted);">⬜ Chamber ${ch}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px;">${historyCount} siklus sebelumnya</div>
            </div>
            <span style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);padding:3px 10px;border-radius:20px;font-size:10px;">KOSONG</span>
        </div>

        <div style="text-align:center;padding:20px 0;color:var(--muted);">
            <div style="font-size:28px;margin-bottom:8px;">🔲</div>
            <div style="font-size:12px;">Chamber siap diisi</div>
        </div>

        <button class="btn btn-primary btn-sm" style="width:100%;" onclick="openOvenInputForm(${ch})">+ Isi Chamber ${ch}</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════
// 3. FORM INPUT / EDIT
// ═══════════════════════════════════════════════════════
window.openOvenInputForm = function (chamber) {
    const openList = [...new Set((window.sawmillList || []).map(s => s.openNo).filter(Boolean))];
    const opts = openList.map(no => `<option value="${no}">${no}</option>`).join('');

    showModal(`🔥 Isi Chamber ${chamber}`, `
        <div class="grid2">
            <div class="field"><label>Open No. *</label>
                <select id="oven-openno"><option value="">-- Pilih --</option>${opts}</select>
            </div>
            <div class="field"><label>Volume (m³) *</label>
                <input type="number" step="any" id="oven-volume" placeholder="0.00">
            </div>
            <div class="field"><label>Tanggal Masuk *</label>
                <input type="date" id="oven-tgl-mulai" value="${today()}">
            </div>
            <div class="field"><label>Target Selesai</label>
                <input type="date" id="oven-tgl-target">
            </div>
            <div class="field"><label>Suhu Awal (°C)</label>
                <input type="number" id="oven-suhu" placeholder="Opsional">
            </div>
            <div class="field"><label>Catatan</label>
                <input type="text" id="oven-catatan" placeholder="Opsional">
            </div>
        </div>`,
        () => saveOvenInput(chamber)
    );

    // Auto-isi target selesai
    document.getElementById('oven-tgl-mulai')?.addEventListener('change', e => {
        const target = addHari(e.target.value, DURASI_NORMAL_HARI);
        const tEl = document.getElementById('oven-tgl-target');
        if (tEl && !tEl.value) tEl.value = target;
    });

    // Set default target selesai
    const defTarget = addHari(today(), DURASI_NORMAL_HARI);
    const tEl = document.getElementById('oven-tgl-target');
    if (tEl) tEl.value = defTarget;
};

function saveOvenInput(chamber) {
    const openNo  = document.getElementById('oven-openno')?.value;
    const volume  = parseFloat(document.getElementById('oven-volume')?.value) || 0;
    const tglMulai = document.getElementById('oven-tgl-mulai')?.value;
    const tglTarget = document.getElementById('oven-tgl-target')?.value;
    const suhu    = parseFloat(document.getElementById('oven-suhu')?.value) || null;
    const catatan = document.getElementById('oven-catatan')?.value || '';

    if (!openNo) { toast('⚠️ Open No. wajib dipilih!'); return false; }
    if (!volume)  { toast('⚠️ Volume wajib diisi!'); return false; }
    if (!tglMulai){ toast('⚠️ Tanggal masuk wajib diisi!'); return false; }

    const entry = {
        id: uid(),
        chamber,
        openNo,
        volume,
        tglMulai,
        tglTarget: tglTarget || '',
        tglSelesai: '',
        suhu,
        catatan,
        status: 'isi'
    };

    if (!window.ovenList) window.ovenList = [];
    window.ovenList.push(entry);
    persistAll();
    renderOven();
    logActivity('Isi', 'Oven', `Chamber ${chamber} — Open ${openNo}`);
    toast(`🔥 Chamber ${chamber} berhasil diisi!`);
    return true;
}

window.openOvenEditForm = function (id) {
    const item = (window.ovenList || []).find(o => o.id === id);
    if (!item) return;

    const openList = [...new Set((window.sawmillList || []).map(s => s.openNo).filter(Boolean))];
    const opts = openList.map(no => `<option value="${no}"${no === item.openNo ? ' selected' : ''}>${no}</option>`).join('');

    showModal(`✏️ Edit Chamber ${item.chamber}`, `
        <div class="grid2">
            <div class="field"><label>Open No. *</label>
                <select id="oven-openno"><option value="">-- Pilih --</option>${opts}</select>
            </div>
            <div class="field"><label>Volume (m³) *</label>
                <input type="number" step="any" id="oven-volume" value="${item.volume || ''}">
            </div>
            <div class="field"><label>Tanggal Masuk</label>
                <input type="date" id="oven-tgl-mulai" value="${item.tglMulai || ''}">
            </div>
            <div class="field"><label>Target Selesai</label>
                <input type="date" id="oven-tgl-target" value="${item.tglTarget || ''}">
            </div>
            <div class="field"><label>Suhu (°C)</label>
                <input type="number" id="oven-suhu" value="${item.suhu || ''}">
            </div>
            <div class="field"><label>Catatan</label>
                <input type="text" id="oven-catatan" value="${item.catatan || ''}">
            </div>
        </div>`,
        () => {
            item.openNo    = document.getElementById('oven-openno')?.value || item.openNo;
            item.volume    = parseFloat(document.getElementById('oven-volume')?.value) || item.volume;
            item.tglMulai  = document.getElementById('oven-tgl-mulai')?.value || item.tglMulai;
            item.tglTarget = document.getElementById('oven-tgl-target')?.value || '';
            item.suhu      = parseFloat(document.getElementById('oven-suhu')?.value) || null;
            item.catatan   = document.getElementById('oven-catatan')?.value || '';
            persistAll();
            renderOven();
            logActivity('Edit', 'Oven', `Chamber ${item.chamber}`);
            toast('✅ Data oven diperbarui!');
            return true;
        }
    );
};

// ═══════════════════════════════════════════════════════
// 4. SELESAIKAN OVEN
// ═══════════════════════════════════════════════════════
window.selesaikanOven = function (id) {
    const item = (window.ovenList || []).find(o => o.id === id);
    if (!item) return;

    showModal(`✅ Selesaikan Chamber ${item.chamber}`, `
        <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">
            Open <b style="color:var(--gold)">${item.openNo}</b> · ${fmtDec(item.volume || 0, 2)} m³ · Mulai: ${fmtDate(item.tglMulai)}
        </p>
        <div class="grid2">
            <div class="field"><label>Tanggal Selesai *</label>
                <input type="date" id="oven-tgl-selesai" value="${today()}">
            </div>
            <div class="field"><label>Suhu Akhir (°C)</label>
                <input type="number" id="oven-suhu-akhir" placeholder="Opsional">
            </div>
            <div class="field" style="grid-column:span 2"><label>Catatan Akhir</label>
                <input type="text" id="oven-catatan-akhir" placeholder="Hasil pengeringan, kondisi palet, dll">
            </div>
        </div>
        <div style="background:var(--bg3);border-radius:8px;padding:12px;margin-top:12px;font-size:12px;color:var(--muted);">
            Durasi pengeringan: <b style="color:var(--gold)">${hariAntara(item.tglMulai, today())} hari</b>
            (standar: ${DURASI_NORMAL_HARI} hari)
        </div>`,
        () => {
            const tglSelesai = document.getElementById('oven-tgl-selesai')?.value;
            if (!tglSelesai) { toast('⚠️ Tanggal selesai wajib diisi!'); return false; }
            const suhuAkhir  = parseFloat(document.getElementById('oven-suhu-akhir')?.value) || null;
            const catatanAkhir = document.getElementById('oven-catatan-akhir')?.value || '';

            item.status      = 'selesai';
            item.tglSelesai  = tglSelesai;
            if (suhuAkhir) item.suhuAkhir = suhuAkhir;
            if (catatanAkhir) item.catatan = [item.catatan, catatanAkhir].filter(Boolean).join(' | ');

            persistAll();
            renderOven();
            logActivity('Selesai', 'Oven', `Chamber ${item.chamber} — ${hariAntara(item.tglMulai, tglSelesai)} hari`);
            toast(`✅ Chamber ${item.chamber} selesai dikeringkan!`);
            return true;
        }
    );
};

// ═══════════════════════════════════════════════════════
// 5. HAPUS & RESET
// ═══════════════════════════════════════════════════════
window.hapusOven = function (id) {
    const item = (window.ovenList || []).find(o => o.id === id);
    if (!item) return;
    if (!confirmDialog(`Hapus data Chamber ${item.chamber}?`)) return;
    window.ovenList = (window.ovenList || []).filter(o => o.id !== id);
    persistAll();
    renderOven();
    toast('🗑️ Data oven dihapus');
};

window.resetOvenData = function () {
    if (!confirmDialog('Reset SEMUA data oven? Ini tidak bisa dibatalkan.')) return;
    window.ovenList = [];
    persistAll();
    renderOven();
    toast('🔄 Data oven direset');
};

// ═══════════════════════════════════════════════════════
// 6. RIWAYAT PENGISIAN (tabel lengkap + filter)
// ═══════════════════════════════════════════════════════
window.renderOvenHistory = function () {
    const tbody  = document.getElementById('oven-history-tbody');
    const all    = window.ovenList || [];

    if (!all.length) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty">📭 Belum ada riwayat pengisian</td></tr>`;
        renderOvenStats();
        return;
    }

    // Sort: aktif dulu, lalu selesai terbaru
    const sorted = [...all].sort((a, b) => {
        if (a.status === 'isi' && b.status !== 'isi') return -1;
        if (b.status === 'isi' && a.status !== 'isi') return 1;
        return (b.tglMulai || '').localeCompare(a.tglMulai || '');
    });

    tbody.innerHTML = sorted.map(o => {
        const durasi = o.tglMulai
            ? (o.status === 'selesai' && o.tglSelesai
                ? hariAntara(o.tglMulai, o.tglSelesai)
                : hariAntara(o.tglMulai, today()))
            : '—';
        const durasiNum = typeof durasi === 'number' ? durasi : 0;
        const durasiCol = o.status === 'selesai'
            ? (durasiNum <= DURASI_NORMAL_HARI + 1 ? 'var(--green)' : durasiNum <= DURASI_NORMAL_HARI + 3 ? 'var(--orange)' : 'var(--red)')
            : 'var(--gold)';

        const statusBadge = o.status === 'isi'
            ? `<span style="background:rgba(255,159,67,0.15);color:var(--orange);border:1px solid rgba(255,159,67,0.3);padding:2px 8px;border-radius:12px;font-size:10px;">● Aktif</span>`
            : `<span style="background:rgba(74,222,128,0.1);color:var(--green);border:1px solid rgba(74,222,128,0.2);padding:2px 8px;border-radius:12px;font-size:10px;">✓ Selesai</span>`;

        const aksi = o.status === 'isi'
            ? `<button class="btn btn-sm" style="background:rgba(74,222,128,0.1);color:var(--green);border:none;" onclick="selesaikanOven(${o.id})">✅</button>
               <button class="btn btn-edit btn-sm" onclick="openOvenEditForm(${o.id})">✏️</button>
               <button class="btn btn-del btn-sm" onclick="hapusOven(${o.id})">🗑️</button>`
            : `<button class="btn btn-del btn-sm" onclick="hapusOven(${o.id})">🗑️</button>`;

        return `<tr>
            <td><b style="color:var(--gold)">Chamber ${o.chamber}</b></td>
            <td>${o.openNo || '—'}</td>
            <td class="right">${fmtDec(o.volume || 0, 2)} m³</td>
            <td>${fmtDate(o.tglMulai) || '—'}</td>
            <td>${o.status === 'selesai' ? fmtDate(o.tglSelesai) : (o.tglTarget ? `🎯 ${fmtDate(o.tglTarget)}` : '—')}</td>
            <td class="right" style="color:${durasiCol}">${durasi} hari</td>
            <td>${statusBadge}</td>
            <td style="display:flex;gap:4px;">${aksi}</td>
        </tr>`;
    }).join('');

    renderOvenStats();
};

// ═══════════════════════════════════════════════════════
// 7. STATISTIK OVEN (chart & ringkasan)
// ═══════════════════════════════════════════════════════
function renderOvenStats() {
    const statsContainer = document.getElementById('oven-stats-container');
    if (!statsContainer) return;

    const selesai = (window.ovenList || []).filter(o => o.status === 'selesai' && o.tglMulai && o.tglSelesai);
    if (selesai.length === 0) {
        statsContainer.innerHTML = '<div class="empty" style="padding:20px;">📊 Belum ada data siklus selesai untuk statistik</div>';
        return;
    }

    // Distribusi durasi
    const durasiList = selesai.map(o => hariAntara(o.tglMulai, o.tglSelesai));
    const minDurasi  = Math.min(...durasiList);
    const maxDurasi  = Math.max(...durasiList);
    const avgDurasi  = (durasiList.reduce((a, b) => a + b, 0) / durasiList.length).toFixed(1);

    // Volume per chamber
    const volPerChamber = {};
    for (let i = 1; i <= TOTAL_CHAMBERS; i++) volPerChamber[i] = 0;
    selesai.forEach(o => { volPerChamber[o.chamber] = (volPerChamber[o.chamber] || 0) + (o.volume || 0); });

    // Total volume dikeringkan
    const totVolKering = selesai.reduce((a, o) => a + (o.volume || 0), 0);

    statsContainer.innerHTML = `
    <div class="section-head" style="margin-top:24px;">📊 Statistik Penggunaan Oven</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
        ${ovenKPI('Total Siklus Selesai', selesai.length + ' siklus', 'var(--gold)')}
        ${ovenKPI('Total Vol. Dikeringkan', fmtDec(totVolKering, 2) + ' m³', 'var(--blue)')}
        ${ovenKPI('Durasi Min', minDurasi + ' hari', 'var(--green)')}
        ${ovenKPI('Durasi Maks', maxDurasi + ' hari', maxDurasi > DURASI_NORMAL_HARI + 2 ? 'var(--red)' : 'var(--orange)')}
        ${ovenKPI('Durasi Rata-rata', avgDurasi + ' hari', 'var(--gold-light)')}
    </div>

    <!-- Chart: Volume per Chamber -->
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:12px;">📦 Total Volume Dikeringkan per Chamber (Historis)</div>
        <canvas id="chart-oven-chamber" height="120"></canvas>
    </div>

    <!-- Chart: Tren Durasi -->
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:16px;">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:12px;">⏱️ Tren Durasi Pengeringan (10 Siklus Terakhir)</div>
        <canvas id="chart-oven-durasi" height="120"></canvas>
    </div>`;

    // Render charts setelah DOM diperbarui
    setTimeout(() => {
        // Chart volume per chamber
        const ctx1 = document.getElementById('chart-oven-chamber');
        if (ctx1 && window.Chart) {
            if (ctx1._chartInst) ctx1._chartInst.destroy();
            ctx1._chartInst = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: Array.from({length: TOTAL_CHAMBERS}, (_, i) => `Ch.${i+1}`),
                    datasets: [{
                        label: 'Volume (m³)',
                        data: Array.from({length: TOTAL_CHAMBERS}, (_, i) => +(volPerChamber[i+1] || 0).toFixed(2)),
                        backgroundColor: 'rgba(212,160,23,0.6)',
                        borderColor: 'var(--gold)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: ctx => `${ctx.raw} m³` } }
                    },
                    scales: {
                        x: { ticks: { color: '#8a8578', font: { size: 10 } }, grid: { display: false } },
                        y: { ticks: { color: '#8a8578', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'm³', color: '#8a8578', font: { size: 9 } } }
                    }
                }
            });
        }

        // Chart tren durasi (10 siklus terakhir)
        const ctx2 = document.getElementById('chart-oven-durasi');
        if (ctx2 && window.Chart) {
            if (ctx2._chartInst) ctx2._chartInst.destroy();
            const last10 = [...selesai].sort((a, b) => b.tglSelesai.localeCompare(a.tglSelesai)).slice(0, 10).reverse();
            const labels = last10.map(o => `Ch.${o.chamber} ${o.tglSelesai?.slice(5) || ''}`);
            const data   = last10.map(o => hariAntara(o.tglMulai, o.tglSelesai));
            ctx2._chartInst = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Durasi (hari)',
                            data,
                            borderColor: '#ff9f43',
                            backgroundColor: 'rgba(255,159,67,0.1)',
                            borderWidth: 2,
                            pointRadius: 4,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: `Standar (${DURASI_NORMAL_HARI} hari)`,
                            data: Array(last10.length).fill(DURASI_NORMAL_HARI),
                            borderColor: 'rgba(255,255,255,0.2)',
                            borderDash: [5, 4],
                            borderWidth: 1.5,
                            pointRadius: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { labels: { color: '#8a8578', font: { size: 9 }, boxWidth: 12 } },
                        tooltip: { callbacks: { label: ctx => `${ctx.raw} hari` } }
                    },
                    scales: {
                        x: { ticks: { color: '#666', font: { size: 9 }, maxRotation: 45 }, grid: { display: false } },
                        y: { ticks: { color: '#8a8578', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'hari', color: '#8a8578', font: { size: 9 } } }
                    }
                }
            });
        }
    }, 100);
}

// ═══════════════════════════════════════════════════════
// 8. HELPER FUNGSI WAKTU
// ═══════════════════════════════════════════════════════
function hariAntara(tgl1, tgl2) {
    if (!tgl1 || !tgl2) return 0;
    const d1 = new Date(tgl1), d2 = new Date(tgl2);
    return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

function sisaHari(tglMulai) {
    if (!tglMulai) return null;
    const selesaiPlan = new Date(tglMulai);
    selesaiPlan.setDate(selesaiPlan.getDate() + DURASI_NORMAL_HARI);
    const now = new Date();
    return Math.ceil((selesaiPlan - now) / (1000 * 60 * 60 * 24));
}

function estimasiSelesai(tglMulai) {
    if (!tglMulai) return '—';
    const d = new Date(tglMulai);
    d.setDate(d.getDate() + DURASI_NORMAL_HARI);
    return fmtDate(d.toISOString().split('T')[0]);
}

function addHari(tgl, hari) {
    if (!tgl) return '';
    const d = new Date(tgl);
    d.setDate(d.getDate() + hari);
    return d.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════
// 9. INJECT HTML TAMBAHAN KE TAB OVEN
// ═══════════════════════════════════════════════════════
function initOvenExtras() {
    const tabOven = document.getElementById('tab-oven');
    if (!tabOven || document.getElementById('oven-summary-bar')) return;

    // Inject summary bar sebelum oven-container
    const ovenContainer = document.getElementById('oven-container');
    if (ovenContainer) {
        const summaryEl = document.createElement('div');
        summaryEl.id = 'oven-summary-bar';
        ovenContainer.insertAdjacentElement('beforebegin', summaryEl);
    }

    // Inject stats container setelah history table
    const historySection = document.querySelector('#tab-oven .mt16');
    if (historySection && !document.getElementById('oven-stats-container')) {
        const statsEl = document.createElement('div');
        statsEl.id = 'oven-stats-container';
        statsEl.className = 'mt16';
        historySection.insertAdjacentElement('afterend', statsEl);
    }

    // Perbaiki header tabel riwayat agar ada kolom Durasi
    const thead = document.querySelector('#tab-oven thead tr');
    if (thead && thead.children.length < 8) {
        thead.innerHTML = '<th>Chamber</th><th>Open No.</th><th>Volume</th><th>Tgl Mulai</th><th>Tgl Selesai / Target</th><th>Durasi</th><th>Status</th><th>Aksi</th>';
    }
}

// Animasi shimmer untuk chamber aktif
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `
@keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
}
`;
document.head.appendChild(shimmerStyle);

// Jalankan inisialisasi
setTimeout(() => {
    initOvenExtras();
    renderOven();
}, 600);
