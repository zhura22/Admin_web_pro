// modal.js
window.showModal = function(title, content, onConfirm = null) {
    // Hapus modal lama jika ada
    const existing = document.querySelector('.custom-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.85); display: flex; align-items: center;
        justify-content: center; z-index: 10001;
    `;

    let buttonsHtml = `<button class="btn btn-secondary" onclick="this.closest('.custom-modal').remove()">Tutup</button>`;
    if (onConfirm) {
        buttonsHtml = `
            <button class="btn btn-secondary" onclick="this.closest('.custom-modal').remove()">Batal</button>
            <button class="btn btn-primary" id="modal-confirm-btn">Konfirmasi</button>
        `;
    }

    modal.innerHTML = `
        <div style="background: var(--bg2); border: 1px solid var(--gold); border-radius: 12px; padding: 24px; max-width: 500px; width: 90%;">
            <h3 style="color: var(--gold); margin-bottom: 16px;">${title}</h3>
            <div style="color: var(--text); margin-bottom: 20px;">${content}</div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                ${buttonsHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    if (onConfirm) {
        const confirmBtn = document.getElementById('modal-confirm-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                const result = onConfirm();
                if (result !== false) modal.remove();
            };
        }
    }
};