const themes = {
    gold: {
        name: 'Gold (Dark)',
        icon: '🌟',
        variables: {
            '--gold': '#d4a017',
            '--gold-light': '#e8c84a',
            '--gold-dim': 'rgba(212,160,23,0.18)',
            '--bg': '#0d0d0d',
            '--bg2': '#17140e',
            '--bg3': '#141210',
            '--border': '#2e2b20',
            '--text': '#e6dfd0',
            '--muted': '#8a8578',
            '--input-bg': '#1a1a1a',
            '--input-border': '#333',
            '--input-color': '#e0d8c8',
            '--row-even': '#11110e',
            '--td-border': '#1f1f18',
            '--pill-bg': '#111',
            '--palet-row-bg': '#11110e',
            '--flow-step-bg': '#111',
            '--signin-input-bg': '#111',
            '--signin-input-border': '#2a2720',
            '--header-bg': 'linear-gradient(180deg, #1a1610 0%, #14120c 100%)',
            '--header-border': 'rgba(212,160,23,0.3)',
            '--sidebar-hover-color': '#c4b890',
            '--shadow': '0 4px 24px rgba(0,0,0,0.6)',
            '--glass-blur': '0px',
            '--glass-saturate': '100%'
        }
    },
    light: {
        name: 'Light',
        icon: '☀️',
        variables: {
            '--gold': '#b8860b',
            '--gold-light': '#daa520',
            '--gold-dim': 'rgba(184,134,11,0.1)',
            '--bg': '#f5f5f0',
            '--bg2': '#ffffff',
            '--bg3': '#fafaf5',
            '--border': '#ddd8cc',
            '--text': '#2c2b26',
            '--muted': '#6b6a66',
            '--input-bg': '#f0ede6',
            '--input-border': '#ccc8bc',
            '--input-color': '#2c2b26',
            '--row-even': '#f9f7f2',
            '--td-border': '#e8e4db',
            '--pill-bg': '#f0ede6',
            '--palet-row-bg': '#f5f3ee',
            '--flow-step-bg': '#f0ede6',
            '--signin-input-bg': '#f5f3ee',
            '--signin-input-border': '#ccc8bc',
            '--header-bg': 'linear-gradient(180deg, #ffffff 0%, #f8f6f0 100%)',
            '--header-border': 'rgba(184,134,11,0.2)',
            '--sidebar-hover-color': '#4a4840',
            '--shadow': '0 4px 24px rgba(0,0,0,0.1)',
            '--glass-blur': '0px',
            '--glass-saturate': '100%'
        }
    },
    blue: {
        name: 'Blue Steel',
        icon: '🔵',
        variables: {
            '--gold': '#3b82f6',
            '--gold-light': '#60a5fa',
            '--gold-dim': 'rgba(59,130,246,0.15)',
            '--bg': '#0f172a',
            '--bg2': '#1e293b',
            '--bg3': '#334155',
            '--border': '#475569',
            '--text': '#e2e8f0',
            '--muted': '#94a3b8',
            '--input-bg': '#1e293b',
            '--input-border': '#475569',
            '--input-color': '#e2e8f0',
            '--row-even': '#0f172a',
            '--td-border': '#334155',
            '--pill-bg': '#0f172a',
            '--palet-row-bg': '#1e293b',
            '--flow-step-bg': '#0f172a',
            '--signin-input-bg': '#0f172a',
            '--signin-input-border': '#334155',
            '--header-bg': 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            '--header-border': 'rgba(59,130,246,0.3)',
            '--sidebar-hover-color': '#cbd5e1',
            '--shadow': '0 4px 24px rgba(0,0,0,0.6)',
            '--glass-blur': '0px',
            '--glass-saturate': '100%'
        }
    },
    green: {
        name: 'Forest',
        icon: '🌲',
        variables: {
            '--gold': '#2e7d32',
            '--gold-light': '#4caf50',
            '--gold-dim': 'rgba(46,125,50,0.15)',
            '--bg': '#0a1f0a',
            '--bg2': '#0e2b0e',
            '--bg3': '#1a3b1a',
            '--border': '#2d5a2d',
            '--text': '#dcedc8',
            '--muted': '#9ecc9e',
            '--input-bg': '#0e2b0e',
            '--input-border': '#2d5a2d',
            '--input-color': '#dcedc8',
            '--row-even': '#0a1f0a',
            '--td-border': '#1a3b1a',
            '--pill-bg': '#0a1f0a',
            '--palet-row-bg': '#0e2b0e',
            '--flow-step-bg': '#0a1f0a',
            '--signin-input-bg': '#0a1f0a',
            '--signin-input-border': '#1a3b1a',
            '--header-bg': 'linear-gradient(180deg, #0e2b0e 0%, #0a1f0a 100%)',
            '--header-border': 'rgba(46,125,50,0.3)',
            '--sidebar-hover-color': '#c8e6c9',
            '--shadow': '0 4px 24px rgba(0,0,0,0.6)',
            '--glass-blur': '0px',
            '--glass-saturate': '100%'
        }
    },

    // ── Glass Purple — Neon Futuristic Glassmorphism ──
    glassPurple: {
        name: 'Glass Purple',
        icon: '🔮',
        variables: {
            '--gold':         '#a855f7',
            '--gold-light':   '#c084fc',
            '--gold-dim':     'rgba(168,85,247,.15)',
            '--bg':           '#07050f',
            '--bg2':          'rgba(255,255,255,.038)',
            '--bg3':          'rgba(255,255,255,.025)',
            '--border':       'rgba(167,139,250,.16)',
            '--text':         '#ede9fe',
            '--muted':        'rgba(196,156,255,.55)',
            '--green':        '#34d399',
            '--green-bg':     'rgba(52,211,153,.1)',
            '--red':          '#f87171',
            '--red-bg':       'rgba(248,113,113,.1)',
            '--blue':         '#93c5fd',
            '--orange':       '#fb923c',
            '--cyan':         '#5eead4',
            '--input-bg':     'rgba(255,255,255,.052)',
            '--input-border': 'rgba(139,92,246,.22)',
            '--input-color':  '#f3e8ff',
            '--row-even':     'rgba(255,255,255,.018)',
            '--td-border':    'rgba(139,92,246,.08)',
            '--pill-bg':      'rgba(139,92,246,.1)',
            '--palet-row-bg': 'rgba(255,255,255,.03)',
            '--flow-step-bg': 'rgba(139,92,246,.08)',
            '--signin-input-bg':     'rgba(255,255,255,.052)',
            '--signin-input-border': 'rgba(139,92,246,.22)',
            '--header-bg':     'rgba(10,6,22,.75)',
            '--header-border': 'rgba(160,80,255,.22)',
            '--sidebar-hover-color': '#e9d5ff',
            '--shadow':        '0 8px 40px rgba(109,40,217,.2)',
            '--radius':        '14px',
            '--radius-sm':     '10px',
            '--glass-blur':    '24px',
            '--glass-saturate':'160%'
        }
    },

    // ── Noir — Cinematic Black & White ──
    noir: {
        name: 'Noir',
        icon: '🖤',
        variables: {
            '--gold':         '#ffffff',
            '--gold-light':   '#e8e8e8',
            '--gold-dim':     'rgba(255,255,255,0.07)',

            '--bg':           '#000000',
            '--bg2':          '#090909',
            '--bg3':          '#111111',
            '--border':       'rgba(255,255,255,0.09)',

            '--text':         '#efefef',
            '--muted':        '#4a4a4a',

            '--green':        '#a8e6a3',
            '--green-bg':     'rgba(168,230,163,0.09)',
            '--red':          '#f0a0a0',
            '--red-bg':       'rgba(240,160,160,0.09)',
            '--blue':         '#a0c4f0',
            '--orange':       '#f0c888',
            '--cyan':         '#a0e0e0',

            '--input-bg':     '#0d0d0d',
            '--input-border': 'rgba(255,255,255,0.11)',
            '--input-color':  '#efefef',

            '--row-even':     '#060606',
            '--td-border':    'rgba(255,255,255,0.045)',

            '--pill-bg':      '#111111',
            '--palet-row-bg': '#090909',
            '--flow-step-bg': '#090909',

            '--signin-input-bg':     '#0d0d0d',
            '--signin-input-border': 'rgba(255,255,255,0.11)',

            '--header-bg':     'linear-gradient(180deg, #0e0e0e 0%, #000000 100%)',
            '--header-border': 'rgba(255,255,255,0.13)',

            '--sidebar-hover-color': '#ffffff',
            '--shadow':        '0 6px 40px rgba(0,0,0,0.95)',

            '--radius':        '12px',
            '--radius-sm':     '8px',
            '--glass-blur':    '0px',
            '--glass-saturate':'100%'
        }
    },

    // ── Liquid Glass — iOS-inspired frosted glass ──
    liquidGlass: {
        name: 'Liquid Glass',
        icon: '🫧',
        variables: {
            // Accent: iOS Blue
            '--gold':       '#007aff',
            '--gold-light': '#409cff',
            '--gold-dim':   'rgba(0,122,255,0.12)',

            // Surfaces: frosted translucent whites
            '--bg':     'rgba(255,255,255,0.0)',   // body carries the mesh gradient
            '--bg2':    'rgba(255,255,255,0.62)',
            '--bg3':    'rgba(255,255,255,0.42)',
            '--border': 'rgba(255,255,255,0.55)',

            // Text
            '--text':  '#1c1c1e',
            '--muted': '#6e6e73',

            // Inputs: slightly more opaque glass
            '--input-bg':     'rgba(255,255,255,0.72)',
            '--input-border': 'rgba(0,0,0,0.1)',
            '--input-color':  '#1c1c1e',

            // Table rows
            '--row-even': 'rgba(0,0,0,0.025)',
            '--td-border': 'rgba(0,0,0,0.07)',

            // Pills / small surfaces
            '--pill-bg':       'rgba(255,255,255,0.75)',
            '--palet-row-bg':  'rgba(255,255,255,0.45)',
            '--flow-step-bg':  'rgba(255,255,255,0.65)',

            // Sign-in
            '--signin-input-bg':    'rgba(255,255,255,0.72)',
            '--signin-input-border': 'rgba(0,0,0,0.1)',

            // Header
            '--header-bg':     'rgba(255,255,255,0.72)',
            '--header-border': 'rgba(0,0,0,0.08)',

            // Misc
            '--sidebar-hover-color': '#1c1c1e',
            '--shadow':  '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)',
            '--green':    '#34c759',
            '--green-bg': 'rgba(52,199,89,0.12)',
            '--red':      '#ff3b30',
            '--red-bg':   'rgba(255,59,48,0.1)',
            '--blue':     '#007aff',
            '--orange':   '#ff9500',
            '--radius':    '14px',
            '--radius-sm': '10px',

            // Glass blur activation
            '--glass-blur':     '24px',
            '--glass-saturate': '180%'
        }
    }
};

// ── Mesh gradient backgrounds per theme ──
const themeBodies = {
    gold: { bg: '', image: '', attachment: '' },
    light: { bg: '', image: '', attachment: '' },
    blue: { bg: '', image: '', attachment: '' },
    green: { bg: '', image: '', attachment: '' },
    glassPurple: {
        bg: `radial-gradient(ellipse at 20% 15%, rgba(120,40,220,0.55) 0%, transparent 50%),
             radial-gradient(ellipse at 80% 10%, rgba(180,60,255,0.40) 0%, transparent 45%),
             radial-gradient(ellipse at 60% 75%, rgba(90,20,180,0.45) 0%, transparent 50%),
             radial-gradient(ellipse at 10% 80%, rgba(140,0,255,0.30) 0%, transparent 45%),
             radial-gradient(ellipse at 50% 45%, rgba(60,0,120,0.50) 0%, transparent 60%),
             #07050f`.replace(/\s+/g,' ').trim(),
        attachment: 'fixed',
        bodyClass: 'glass-purple'
    },
    noir: {
        bg: `radial-gradient(ellipse at 0% 0%,   rgba(30,30,30,0.80) 0%, transparent 50%),
             radial-gradient(ellipse at 100% 0%,  rgba(20,20,28,0.70) 0%, transparent 45%),
             radial-gradient(ellipse at 100% 100%, rgba(10,10,10,0.90) 0%, transparent 50%),
             radial-gradient(ellipse at 0% 100%,  rgba(18,18,22,0.75) 0%, transparent 45%),
             radial-gradient(ellipse at 50% 50%,  rgba(5,5,8,1.00)   0%, transparent 55%),
             #000000`.replace(/\s+/g,' ').trim(),
        attachment: 'fixed',
        bodyClass: 'noir'
    },
    liquidGlass: {
        // Soft colourful mesh — makes frosted panels pop
        bg: `
            radial-gradient(ellipse at 0% 0%,   rgba(120,180,255,0.55) 0%, transparent 55%),
            radial-gradient(ellipse at 100% 0%,  rgba(200,140,255,0.50) 0%, transparent 55%),
            radial-gradient(ellipse at 100% 100%, rgba(255,180,120,0.45) 0%, transparent 55%),
            radial-gradient(ellipse at 0% 100%,  rgba(120,255,200,0.45) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 50%,  rgba(255,230,180,0.35) 0%, transparent 60%),
            #e8f0ff
        `.replace(/\s+/g, ' ').trim(),
        attachment: 'fixed'
    }
};

function applyTheme(themeId) {
    const theme = themes[themeId];
    if (!theme) return;

    // Apply CSS variables
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.variables)) {
        root.style.setProperty(key, value);
    }

    // Apply body background
    const bodyStyle = themeBodies[themeId] || {};
    document.body.style.background = bodyStyle.bg || '';
    document.body.style.backgroundAttachment = bodyStyle.attachment || '';

    // Toggle theme body classes
    document.body.classList.remove('liquid-glass', 'glass-purple', 'noir');
    const bodyConf = themeBodies[themeId] || {};
    if (bodyConf.bodyClass) document.body.classList.add(bodyConf.bodyClass);
    if (themeId === 'liquidGlass') document.body.classList.add('liquid-glass');

    // Clean up any leftover canvas/overlay from previous session
    ['glass-ribbon-canvas','noir-grain-canvas','noir-vignette'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // Persist & update toggle button
    localStorage.setItem('app_theme', themeId);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.innerHTML = `${theme.icon} Tema`;
    toast(`Tema ${theme.name} diterapkan`);
}

function cycleTheme() {
    const current = localStorage.getItem('app_theme') || 'gold';
    const themeIds = Object.keys(themes);
    const nextTheme = themeIds[(themeIds.indexOf(current) + 1) % themeIds.length];
    applyTheme(nextTheme);
}

function loadSavedTheme() {
    const saved = localStorage.getItem('app_theme');
    applyTheme((saved && themes[saved]) ? saved : 'gold');
}

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);
    loadSavedTheme();
});

