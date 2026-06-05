/**
 * tema: Teak Wood
 * ─────────────────────────────────────────────────────────────────────────────
 * Nuansa kayu teak hangat — coklat, krem, tembaga.
 * Sesuai identitas industri kayu KMSU.
 *
 * CARA MENAMBAH TEMA BARU (contoh dari file ini):
 *   Cukup salin file ini, ganti id/name/icon/variables, lalu
 *   tambahkan <script> tag di index.html. Tidak ada file lain yang diubah.
 * ─────────────────────────────────────────────────────────────────────────────
 */
ThemeRegistry.register({
    id:   'teak',
    name: 'Teak Wood',
    icon: '🪵',
    variables: {
        '--gold':                   '#b87333',       // tembaga
        '--gold-light':             '#d4a96a',       // kayu terang
        '--gold-dim':               'rgba(184,115,51,0.18)',
        '--bg':                     '#120b04',
        '--bg2':                    '#1c1008',
        '--bg3':                    '#23140a',
        '--border':                 '#3a2210',
        '--text':                   '#f0e6d3',
        '--muted':                  '#8b7355',
        '--input-bg':               '#1a0f07',
        '--input-border':           '#3a2210',
        '--input-color':            '#f0e6d3',
        '--row-even':               '#160d05',
        '--td-border':              '#2a1a0a',
        '--pill-bg':                '#1c1008',
        '--palet-row-bg':           '#160d05',
        '--flow-step-bg':           '#1a0f07',
        '--signin-input-bg':        '#1a0f07',
        '--signin-input-border':    '#3a2210',
        '--header-bg':              'linear-gradient(180deg, #221408 0%, #160d05 100%)',
        '--header-border':          'rgba(184,115,51,0.35)',
        '--sidebar-hover-color':    '#d4a96a',
        '--shadow':                 '0 4px 24px rgba(0,0,0,0.7)',
        '--green':                  '#6db87a',
        '--green-bg':               'rgba(109,184,122,0.12)',
        '--red':                    '#e07070',
        '--red-bg':                 'rgba(224,112,112,0.12)',
        '--blue':                   '#7ab0d4',
        '--orange':                 '#d4935a',
        '--glass-blur':             '0px',
        '--glass-saturate':         '100%',
    },
    body: {
        bg: [
            'radial-gradient(ellipse at 0% 0%,    rgba(90,45,10,0.6)  0%, transparent 50%)',
            'radial-gradient(ellipse at 100% 100%,rgba(60,25,5,0.7)   0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 50%,  rgba(30,12,2,1.0)   0%, transparent 65%)',
            '#120b04'
        ].join(', '),
        attachment: 'fixed',
    }
});
