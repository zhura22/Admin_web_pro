window.renderSettings = function() {
    const container = document.getElementById("settings-container");
    if (!container) return;
    const s = window.appSettings;
    container.innerHTML = `
        <div class="form-card">
            <div class="form-title">⚙️ Pengaturan Umum</div>
            <div class="grid2">
                <div class="field"><label>Target Planer (m³/hari)</label><input type="number" id="set-planer" value="${s.targetPlaner}"></div>
                <div class="field"><label>Target Ripsaw (plt/hari)</label><input type="number" id="set-ripsaw" value="${s.targetRipsaw}"></div>
                <div class="field"><label>Target Seri (lbr)</label><input type="number" id="set-seri" value="${s.targetSeri}"></div>
                <div class="field"><label>Target Press (lbr)</label><input type="number" id="set-press" value="${s.targetPress}"></div>
                <div class="field"><label>Min Stok Kering (m³)</label><input type="number" id="set-stok" value="${s.minStokKering}"></div>
                <div class="field"><label>Rendemen Minimal (%)</label><input type="number" id="set-rendemen" value="${s.rendemenMin}"></div>
                <div class="field"><label>Toleransi Selisih (%)</label><input type="number" id="set-toleransi" value="${s.toleransiSelisih}"></div>
                <div class="field"><label>Target Harian Kayu (m³/hari kerja)</label><input type="number" id="set-target-kayu" value="${s.targetKayuHarian || 30}"></div>
                <div class="field"><label>Target Harian Sawmill (m³/hari kerja)</label><input type="number" id="set-target-sawmill" value="${s.targetSawmillHarian || 25}"></div>
                <div class="field"><label>Target Harian Sezing (m³/hari kerja)</label><input type="number" id="set-target-sezing" value="${s.targetSezingHarian || 15}"></div>
                <div class="field"><label>Stok Awal Kayu Log (m³)</label><input type="number" step="any" id="set-stok-awal-kayu" value="${s.stokAwalKayu || 0}"></div>
            </div>
            <div class="form-actions"><button class="btn btn-primary" onclick="saveSettings()">💾 Simpan Pengaturan</button></div>
        </div>
    `;
};

function saveSettings() {
    window.appSettings = {
        targetPlaner: parseInt(document.getElementById("set-planer").value) || 12,
        targetRipsaw: parseInt(document.getElementById("set-ripsaw").value) || 13,
        targetSeri: parseInt(document.getElementById("set-seri").value) || 700,
        targetPress: parseInt(document.getElementById("set-press").value) || 700,
        minStokKering: parseFloat(document.getElementById("set-stok").value) || 50,
        rendemenMin: parseFloat(document.getElementById("set-rendemen").value) || 65,
        toleransiSelisih: parseFloat(document.getElementById("set-toleransi").value) || 2,
        targetKayuHarian: parseFloat(document.getElementById("set-target-kayu").value) || 30,
        targetSawmillHarian: parseFloat(document.getElementById("set-target-sawmill").value) || 25,
        targetSezingHarian: parseFloat(document.getElementById("set-target-sezing").value) || 15,
        stokAwalKayu: parseFloat(document.getElementById("set-stok-awal-kayu").value) || 0
    };
    persistAll();
    toast("✅ Pengaturan disimpan");
    if (document.getElementById("tab-dashboard") && !document.getElementById("tab-dashboard").classList.contains("hidden") && typeof renderAllTargetCharts === 'function') {
        renderAllTargetCharts();
    }
}