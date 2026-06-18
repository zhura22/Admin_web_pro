// ═══════════════════════════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════════════════════════
window.renderAll = function() {
    renderKayu();
    renderOrder();
    renderSawmill();
    renderOvenStatus();
    renderProduksi();
    renderSezing();
    renderPenjualan();
    renderRekap();
    window.renderBatch();   // FIX: pakai window. agar selalu terdefinisi
    renderOpname();
    if (typeof window.renderLMKB === 'function') window.renderLMKB();
    renderDashboard();
    renderLog();
    renderSettings();
    updateHeaderDate();
    checkAlerts();
};

function updateHeaderDate() {
    document.getElementById("header-date").textContent = fmtDate(today());
}

window.printSection = function(tabId) {
    const panel = document.getElementById(tabId);
    if (!panel) return;
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    panel.classList.remove('hidden');
    window.print();
    const active = document.querySelector('.sidebar-item.active');
    if (active) switchTab(active.dataset.tab);
};

window.switchTab = function(name) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    const target = document.getElementById(`tab-${name}`);
    if (target) target.classList.remove("hidden");
    document.querySelectorAll(".sidebar-item").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));

    if (name === "dashboard") renderDashboard();
    if (name === "rekap") {
        // FIX: rekap.js pakai month-picker, bukan date-range
        const rekBln = document.getElementById("rekap-bulan");
        if (rekBln && !rekBln.value) rekBln.value = thisMonth();
        renderRekap();
    }
    if (name === "oven") renderOvenStatus();
    if (name === "sezing") {
        const szTgl = document.getElementById("sz-tanggal");
        if (szTgl && !szTgl.value) szTgl.value = today();
        if (window.renderSezing) window.renderSezing();
    }
    if (name === "penjualan") {
        const jualTgl = document.getElementById("jual-tanggal");
        if (jualTgl && !jualTgl.value) jualTgl.value = today();
        if (typeof window.resetJualForm === 'function') window.resetJualForm();
        if (window.renderPenjualan) window.renderPenjualan();
    }
    if (name === "opname") {
        document.getElementById("opname-bulan").value = thisMonth();
        renderOpname();
    }
    if (name === "batch") window.renderBatch();
    if (name === "lmkb") { if (typeof window.renderLMKB === 'function') window.renderLMKB(); }
    if (name === "log") renderLog();
    if (name === "settings") renderSettings();

    resetSubTab(name);
};

function resetSubTab(tabName) {
    const panel = document.getElementById(`tab-${tabName}`);
    if (!panel) return;
    const firstActive = panel.querySelector('.subtab-btn.active');
    if (firstActive) {
        activateSubTab(tabName, firstActive.dataset.subtab);
    } else {
        const first = panel.querySelector('.subtab-btn');
        if (first) activateSubTab(tabName, first.dataset.subtab);
    }
}

function activateSubTab(tabName, subtab) {
    const panel = document.getElementById(`tab-${tabName}`);
    if (!panel) return;
    panel.querySelectorAll('.subtab-panel').forEach(sp => sp.classList.add('hidden'));
    const targetPanel = document.getElementById(subtab);
    if (targetPanel) targetPanel.classList.remove('hidden');
    panel.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
        btn.classList.toggle('btn-primary', btn.dataset.subtab === subtab);
        btn.classList.toggle('btn-secondary', btn.dataset.subtab !== subtab);
    });

    if (subtab === 'order-input') {
        if (typeof window.openOrderForm === 'function') {
            window.openOrderForm(); // inisialisasi form variants & extra fields
        }
    }

    if (subtab === 'sawmill-input') {
        const container = document.getElementById('sawmill-form-container');
        if (container && container.innerHTML.trim() === '' && typeof window.openSawmillForm === 'function') {
            window.openSawmillForm();
        }
    }
    if (subtab === 'produksi-input') {
        const container = document.getElementById('produksi-form-container');
        if (container && container.innerHTML.trim() === '' && typeof window.openProduksiForm === 'function') {
            window.openProduksiForm();
        }
    }
    // sezing-input sekarang adalah subtab langsung dengan form lengkap
    if (subtab === 'sezing-input') {
        // Tidak perlu redirect — form sudah ada di subtab ini
        if (typeof window.renderSezing === 'function') window.renderSezing();
    }
    // penjualan-analitik: render chart saat subtab dibuka
    if (subtab === 'penjualan-analitik') {
        if (typeof window.renderPenjualanAnalitik === 'function') window.renderPenjualanAnalitik();
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('subtab-btn')) {
        const subtab = e.target.dataset.subtab;
        const panel  = e.target.closest('.panel');
        if (panel) activateSubTab(panel.id.replace('tab-', ''), subtab);
    }
});

document.querySelectorAll(".sidebar-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// ═══════════════════════════════════════════════════════════
// FIX BUG 1: renderBatch — Tab 🔗 Batch Tracking
// Menampilkan aliran material per Open No. dari sawmill → oven → produksi → sezing
// ═══════════════════════════════════════════════════════════
window.renderBatch = function () {
    const el = document.getElementById('batch-list');
    if (!el) return;

    // Kumpulkan semua Open No. unik dari sawmill
    const sawmillList  = window.sawmillList  || [];
    const ovenList     = window.ovenList     || [];
    const produksiList = window.produksiList || [];
    const sezingList   = window.sezingList   || [];

    if (!sawmillList.length) {
        el.innerHTML = `<div style="text-align:center;padding:48px;color:var(--muted);font-size:13px;">
            📭 Belum ada data sawmill. Batch tracking aktif setelah laporan sawmill pertama disimpan.
        </div>`;
        return;
    }

    // Kelompokkan sawmill per openNo
    const batchMap = {};
    sawmillList.forEach(s => {
        const key = s.openNo || `SW-${s.id}`;
        if (!batchMap[key]) batchMap[key] = { openNo: key, sawmills: [], tanggalPertama: s.tanggal };
        batchMap[key].sawmills.push(s);
        if (s.tanggal < batchMap[key].tanggalPertama) batchMap[key].tanggalPertama = s.tanggal;
    });

    // Urutkan batch berdasarkan tanggal terbaru
    const batches = Object.values(batchMap)
        .sort((a, b) => (b.tanggalPertama || '').localeCompare(a.tanggalPertama || ''));

    const statusBadge = (txt, color) =>
        `<span style="background:${color}22;color:${color};border:1px solid ${color}44;
                      border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;
                      font-family:var(--font-mono);">${txt}</span>`;

    const stepBox = (icon, title, content, color = 'var(--gold)') => `
        <div style="background:var(--bg3);border:1px solid var(--border);border-left:3px solid ${color};
                    border-radius:8px;padding:12px 14px;min-width:180px;flex:1;">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;
                        letter-spacing:.8px;margin-bottom:6px;">${icon} ${title}</div>
            <div style="font-size:12px;color:var(--text);line-height:1.6;">${content}</div>
        </div>`;

    const html = batches.map(batch => {
        const key = batch.openNo;

        // ── Sawmill ──
        const volProses = batch.sawmills.reduce((a, s) => a + (s.prosesSawmill || 0), 0);
        const volPalet  = batch.sawmills.reduce((a, s) => a + (s.totalVolumePalet || 0), 0);
        const rendemen  = volProses > 0 ? (volPalet / volProses * 100).toFixed(1) : '—';
        const tglSaw    = fmtDate(batch.sawmills[0]?.tanggal);

        // ── Oven ──
        const ovenEntries = ovenList.filter(o => o.openNo === key);
        const ovenAktif   = ovenEntries.find(o => o.status === 'isi');
        const ovenSelesai = ovenEntries.find(o => o.status === 'selesai');
        const ovenEntry   = ovenAktif || ovenSelesai;

        let ovenBadge = statusBadge('Belum Masuk Oven', 'var(--muted)');
        let ovenInfo  = '—';
        if (ovenAktif) {
            ovenBadge = statusBadge('🔥 Sedang Oven', 'var(--orange)');
            const sisa = ovenAktif.tglTarget
                ? Math.ceil((new Date(ovenAktif.tglTarget) - new Date()) / 86400000)
                : '?';
            ovenInfo = `Ch. ${ovenAktif.chamber} · ${fmtDate(ovenAktif.tglMulai)}<br>
                        Vol: ${fmtDec(ovenAktif.volume, 2)} m³ · Sisa ~${sisa > 0 ? sisa : 0} hari`;
        } else if (ovenSelesai) {
            ovenBadge = statusBadge('✅ Selesai Oven', 'var(--green)');
            ovenInfo = `Ch. ${ovenSelesai.chamber} · ${fmtDate(ovenSelesai.tglSelesai || ovenSelesai.tglMulai)}<br>
                        Vol: ${fmtDec(ovenSelesai.volume, 2)} m³`;
        }

        // ── Produksi ──
        const prodEntries = produksiList.filter(p =>
            (p.openNo === key) ||
            (p.asalPalet || []).some(ap => ap.openNo === key)
        );
        let pressTotal = 0, planerTotal = 0;
        prodEntries.forEach(p => {
            const s1 = p.shift1 || {}, s2 = p.shift2 || {};
            pressTotal  += (s1.press  || 0) + (s2.press  || 0);
            planerTotal += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        });
        const prodInfo = prodEntries.length
            ? `${prodEntries.length} lap · Planer: ${fmtDec(planerTotal, 2)} m³<br>Press: ${fmt(pressTotal)} lbr`
            : '—';
        const prodBadge = prodEntries.length
            ? statusBadge('✅ Ada Produksi', 'var(--blue)')
            : statusBadge('Belum Produksi', 'var(--muted)');

        // ── Sezing ──
        const sezEntries = sezingList.filter(s => s.openNo === key);
        const volSez = sezEntries.reduce((a, s) => a + (s.volume || 0), 0);
        const sezInfo = sezEntries.length
            ? `${sezEntries.length} sesi · ${fmtDec(volSez, 2)} m³`
            : '—';
        const sezBadge = sezEntries.length
            ? statusBadge('✅ Sudah Sezing', 'var(--gold)')
            : statusBadge('Belum Sezing', 'var(--muted)');

        // ── Status keseluruhan batch ──
        let batchStatus, batchColor;
        if (sezEntries.length)       { batchStatus = '✅ Selesai'; batchColor = 'var(--green)'; }
        else if (prodEntries.length) { batchStatus = '📦 Produksi'; batchColor = 'var(--blue)'; }
        else if (ovenAktif)          { batchStatus = '🔥 Oven'; batchColor = 'var(--orange)'; }
        else if (ovenSelesai)        { batchStatus = '🌡️ Kering'; batchColor = 'var(--gold)'; }
        else                         { batchStatus = '🪚 Sawmill'; batchColor = 'var(--muted)'; }

        return `
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;
                    margin-bottom:14px;overflow:hidden;">
            <!-- Header batch -->
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
                        background:var(--bg3);border-bottom:1px solid var(--border);flex-wrap:wrap;">
                <div style="font-size:15px;font-weight:700;color:var(--gold);
                            font-family:var(--font-mono);">Open No. ${escHtml(key)}</div>
                ${statusBadge(batchStatus, batchColor)}
                <span style="font-size:11px;color:var(--muted);margin-left:auto;">${tglSaw}</span>
            </div>
            <!-- Steps -->
            <div style="display:flex;gap:10px;padding:12px 14px;flex-wrap:wrap;align-items:stretch;">
                ${stepBox('🪚', 'Sawmill',
                    `${batch.sawmills.length} lap · Vol: ${fmtDec(volProses,2)} m³<br>
                     Palet: ${fmtDec(volPalet,4)} m³ · Rendemen: ${rendemen}%`,
                    'var(--gold)')}
                <div style="display:flex;align-items:center;color:var(--muted);font-size:18px;">›</div>
                ${stepBox('🔥', 'Oven', `${ovenBadge}<br>${ovenInfo}`, 'var(--orange)')}
                <div style="display:flex;align-items:center;color:var(--muted);font-size:18px;">›</div>
                ${stepBox('📦', 'Produksi', `${prodBadge}<br>${prodInfo}`, 'var(--blue)')}
                <div style="display:flex;align-items:center;color:var(--muted);font-size:18px;">›</div>
                ${stepBox('📏', 'Sezing', `${sezBadge}<br>${sezInfo}`, 'var(--gold-light)')}
            </div>
        </div>`;
    }).join('');

    el.innerHTML = html;
};

// Helper escape HTML lokal untuk renderBatch
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
