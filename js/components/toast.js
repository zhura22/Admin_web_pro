function toast(msg, duration = 2500) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove("show"), duration);
}