window.showModal = function(title, content) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.85); display: flex; align-items: center;
        justify-content: center; z-index: 10001;
    `;
    modal.innerHTML = `
        <div style="background: var(--bg2); border: 1px solid var(--gold); border-radius: 12px; padding: 24px; max-width: 450px;">
            <h3 style="color: var(--gold); margin-bottom: 16px;">${title}</h3>
            <div style="color: var(--text); margin-bottom: 20px;">${content}</div>
            <button class="btn btn-primary" onclick="this.closest('.custom-modal').remove()">Tutup</button>
        </div>
    `;
    document.body.appendChild(modal);
};