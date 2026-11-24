function initStatApp() {
    // ==========================================
    // 共通ストレージ定数（ステップ3で作戦盤と共有）
    // ==========================================
    const STORAGE_KEY = 'TB_STAT_SHARED_V1';
    const MAX_JERSEY_NUM = 18;

    // ==========================================
    // 要素取得
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const viewInput = document.getElementById('view-input');
    const viewRoster = document.getElementById('view-roster');

    const jerseyGrid = document.getElementById('jersey-grid');
    const btnSelectGk = document.getElementById('btn-select-gk');
    const selectedPlayerBadge = document.getElementById('selected-player-badge');
    const teamBtns = document.querySelectorAll('.team-btn');

    const goalGrid = document.getElementById('goal-grid');
    const specialCourseBtns = document.querySelectorAll('[data-special-course]');
    const btnClearSelection = document.getElementById('btn-clear-selection');
    const quickZoneBtns = document.querySelectorAll('[data-quick-zone]');

    const shotCanvas = document.getElementById('shot-court-canvas');
    const ctx = shotCanvas.getContext('2d');
    const telemetryZone = document.getElementById('telemetry-zone');
    const telemetryAngle = document.getElementById('telemetry-angle');
    const telemetryDist = document.getElementById('telemetry-dist');

    const resultBtns = document.querySelectorAll('.result-btn');
    const playLogList = document.getElementById('play-log-list');
    const logCountEl = document.getElementById('log-count');
    const btnUndo = document.getElementById('btn-undo');

    const btnHalfToggle = document.getElementById('btn-half-toggle');
    const timerDisplay = document.getElementById('timer-display');
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const scoreOwnEl = document.getElementById('score-own');
    const scoreOppEl = document.getElementById('score-opp');

    // 名簿・出力タブ要素
    const matchTitleInput = document.getElementById('match-title-input');
    const matchOpponentInput = document.getElementById('match-opponent-input');
    const summaryTotalLogs = document.getElementById('summary-total-logs');
    const summaryScore = document.getElementById('summary-score');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnResetMatch = document.getElementById('btn-reset-match');
    const rosterTeamBtns = document.querySelectorAll('.roster-team-btn');
    const rosterTbody = document.getElementById('roster-tbody');
    const autosaveStatus = document.getElementById('autosave-status');

    // ==========================================
    // 初期データ構造＆ストレージ読み書き
    // ==========================================
    function createDefaultRoster() {
        const obj = {};
        for (let i = 1; i <= MAX_JERSEY_NUM; i++) {
            obj[String(i)] = { name: '', pos: i === 1 || i === 12 ? 'GK' : '' };
        }
        return obj;
    }

    function loadSavedData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('保存データの読み込みに失敗:', e);
            return null;
        }
    }

    const saved = loadSavedData();

    let matchInfo = (saved && saved.matchInfo) ? saved.matchInfo : {
        title: '',
        opponent: '',
        half: '前半'
    };

    let roster = (saved && saved.roster) ? {
        own: { ...createDefaultRoster(), ...(saved.roster.own || {}) },
        opp: { ...createDefaultRoster(), ...(saved.roster.opp || {}) }
    } : {
        own: createDefaultRoster(),
        opp: createDefaultRoster()
    };

    let historyLogs = (saved && saved.state && Array.isArray(saved.state.historyLogs)) ? saved.state.historyLogs : [];
    let scoreOwn = (saved && saved.state && typeof saved.state.scoreOwn === 'number') ? saved.state.scoreOwn : 0;
    let scoreOpp = (saved && saved.state && typeof saved.state.scoreOpp === 'number') ? saved.state.scoreOpp : 0;
    let elapsedSec = (saved && saved.state && typeof saved.state.elapsedSec === 'number') ? saved.state.elapsedSec : 0;

    let saveFlashTimer = null;
    function saveAllData() {
        try {
            const payload = {
                version: 1,
                updatedAt: new Date().toISOString(),
                matchInfo,
                roster,
                state: {
                    scoreOwn,
                    scoreOpp,
                    elapsedSec,
                    historyLogs
                }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            if (autosaveStatus) {
                autosaveStatus.textContent = '保存済み ✓';
                clearTimeout(saveFlashTimer);
                saveFlashTimer = setTimeout(() => {
                    autosaveStatus.textContent = '自動保存ON';
                }, 1200);
            }
        } catch (e) {
            console.warn('データの自動保存に失敗:', e);
        }
    }

    // ==========================================
    // 操作状態
    // ==========================================
    let currentTeam = 'own';       // 'own' | 'opp'
    let selectedPlayer = '1';      // '1'..'18' | 'GK'
    let selectedGoalCourse = null; // 'UL','UC','UR','ML','MC','MR','DL','DC','DR','post','block'
    let selectedQuickZone = null;  // '7m' | 'fastbreak' | 'empty'
    let shotPoint = null;          // { x, y, zone, lane, depth, angleDeg, acuteAngleDeg, distM }
    let activeRosterTeam = 'own';

    let timerInterval = null;
    let isTimerRunning = false;

    const GOAL_ZONES = [
        { id: 'UL', label: '左上' }, { id: 'UC', label: '中上' }, { id: 'UR', label: '右上' },
        { id: 'ML', label: '左中' }, { id: 'MC', label: '中央' }, { id: 'MR', label: '右中' },
        { id: 'DL', label: '左下' }, { id: 'DC', label: '下中' }, { id: 'DR', label: '右下' }
    ];

    // ==========================================
    // 上部タブ切替（試合入力 ⇔ 名簿・出力）
    // ==========================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const target = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));

            if (target === 'input') {
                viewInput.style.display = '';
                viewRoster.style.display = 'none';
                resizeCourtCanvas();
            } else if (target === 'roster') {
                viewInput.style.display = 'none';
                viewRoster.style.display = 'block';
                updateSummaryCardUI();
                renderRosterTable();
            }
        });
    });

    // ==========================================
    // 背番号グリッド初期化（1〜18・名簿名表示対応）
    // ==========================================
    function getPlayerDisplayName(team, playerKey) {
        if (playerKey === 'GK') return 'GK';
        const entry = roster[team] && roster[team][playerKey];
        return entry && entry.name ? entry.name.trim() : '';
    }

    function buildJerseyGrid() {
        jerseyGrid.innerHTML = '';
        for (let i = 1; i <= MAX_JERSEY_NUM; i++) {
            const numStr = String(i);
            const btn = document.createElement('button');
            btn.className = 'jersey-btn';
            btn.dataset.num = numStr;

            const numSpan = document.createElement('span');
            numSpan.className = 'jersey-num';
            numSpan.textContent = numStr;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'jersey-name';
            const pName = getPlayerDisplayName(currentTeam, numStr);
            nameSpan.textContent = pName;
            nameSpan.style.display = pName ? 'block' : 'none';

            btn.appendChild(numSpan);
            btn.appendChild(nameSpan);

            btn.addEventListener('click', () => {
                selectedPlayer = numStr;
                updatePlayerSelectionUI();
            });
            jerseyGrid.appendChild(btn);
        }
        updatePlayerSelectionUI();
    }

    function updatePlayerSelectionUI() {
        const isGk = selectedPlayer === 'GK';
        btnSelectGk.classList.toggle('active', isGk);

        jerseyGrid.querySelectorAll('.jersey-btn').forEach(btn => {
            const match = !isGk && btn.dataset.num === selectedPlayer;
            btn.classList.toggle('active', match);
            btn.classList.toggle('own', match && currentTeam === 'own');
            btn.classList.toggle('opp', match && currentTeam === 'opp');
        });

        const teamLabel = currentTeam === 'own' ? '自' : '相';
        if (isGk) {
            selectedPlayerBadge.textContent = `${teamLabel}: GK`;
        } else {
            const pName = getPlayerDisplayName(currentTeam, selectedPlayer);
            selectedPlayerBadge.textContent = pName
                ? `${teamLabel}: #${selectedPlayer} ${pName}`
                : `${teamLabel}: #${selectedPlayer}`;
        }
    }

    btnSelectGk.addEventListener('click', () => {
        selectedPlayer = 'GK';
        updatePlayerSelectionUI();
    });

    teamBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentTeam = btn.dataset.team;
            teamBtns.forEach(b => b.classList.toggle('active', b === btn));
            buildJerseyGrid();
        });
    });

    // ==========================================
    // ゴール9分割＆特殊コース初期化
    // ==========================================
    function buildGoalGrid() {
        const outer = document.querySelector('.goal-outer');
        const oldBody = outer.querySelector('.goal-frame-body');
        if (oldBody) oldBody.remove();

        const frameBody = document.createElement('div');
        frameBody.className = 'goal-frame-body';
        goalGrid.innerHTML = '';

        GOAL_ZONES.forEach(z => {
            const btn = document.createElement('button');
            btn.className = 'goal-cell-btn';
            btn.textContent = z.label;
            btn.dataset.course = z.id;
            btn.addEventListener('click', () => {
                selectedGoalCourse = (selectedGoalCourse === z.id) ? null : z.id;
                updateGoalSelectionUI();
            });
            goalGrid.appendChild(btn);
        });

        frameBody.appendChild(goalGrid);
        outer.appendChild(frameBody);
        updateGoalSelectionUI();
    }

    function updateGoalSelectionUI() {
        goalGrid.querySelectorAll('.goal-cell-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.course === selectedGoalCourse);
        });
        specialCourseBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.specialCourse === selectedGoalCourse);
        });
    }

    specialCourseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.specialCourse;
            selectedGoalCourse = (selectedGoalCourse === val) ? null : val;
            updateGoalSelectionUI();
        });
    });

    btnClearSelection.addEventListener('click', () => {
        selectedGoalCourse = null;
        selectedQuickZone = null;
        shotPoint = null;
        quickZoneBtns.forEach(b => b.classList.remove('active'));
        updateGoalSelectionUI();
        updateTelemetryUI();
        renderCourt();
    });

    // ==========================================
    // 6m〜9m実測コート図（角度計算修正済み）
    // ==========================================
    const MAX_VIEW_METERS_Y = 11.5;
    const COURT_WIDTH_M = 20.0;

    const WING_MAX_Y = 6.5;
    const WING_TOP_X = 3.5;
    const WING_BOT_X = 2.0;
    const CB_HALF_WIDTH = 3.0;

    function resizeCourtCanvas() {
        const wrap = shotCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(240, Math.floor(rect.width));
        const h = Math.max(140, Math.floor(rect.height));
        shotCanvas.width = Math.floor(w * dpr);
        shotCanvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderCourt();
    }

    function getCourtMetrics() {
        const wrap = shotCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        const padX = 10;
        const padY = 8;
        const availW = Math.max(180, rect.width - padX * 2);
        const availH = Math.max(110, rect.height - padY * 2);

        const pxPerM = Math.min(availW / COURT_WIDTH_M, availH / MAX_VIEW_METERS_Y);
        const drawW = COURT_WIDTH_M * pxPerM;
        const drawH = MAX_VIEW_METERS_Y * pxPerM;

        return {
            viewW: rect.width,
            viewH: rect.height,
            x0: (rect.width - drawW) / 2,
            y0: (rect.height - drawH) / 2,
            w: drawW,
            h: drawH,
            pxPerM
        };
    }

    function normToCanvas(m, nx, ny) {
        return {
            cx: m.x0 + nx * m.w,
            cy: m.y0 + (ny * 20.0) * m.pxPerM
        };
    }

    function canvasToNorm(m, cx, cy) {
        const nx = Math.max(0, Math.min(1, (cx - m.x0) / m.w));
        const yMeters = Math.max(0.2, Math.min(MAX_VIEW_METERS_Y, (cy - m.y0) / m.pxPerM));
        return { nx, ny: yMeters / 20.0 };
    }

    function classifyShotArea(nx, ny) {
        const xMeters = nx * COURT_WIDTH_M; // 0..20m
        const yMeters = ny * 20.0;           // 0..11.5m
        const dxCenter = xMeters - 10.0;     // ゴール中心からの左右オフセット(-10..+10m)
        const distM = Math.hypot(dxCenter, yMeters);

        // ゴール中心(10, 0)を原点とし、左サイド=0°、正面=90°、右サイド=180°
        const radFromGoalCenter = Math.atan2(yMeters, -dxCenter);
        const angleDeg = Math.round((radFromGoalCenter * 180) / Math.PI);
        const acuteAngleDeg = Math.min(angleDeg, 180 - angleDeg);

        const wingLimitX = WING_TOP_X - (Math.min(yMeters, WING_MAX_Y) / WING_MAX_Y) * (WING_TOP_X - WING_BOT_X);

        let lane = 'CB';
        if (yMeters <= WING_MAX_Y && xMeters <= wingLimitX) {
            lane = 'LW';
        } else if (yMeters <= WING_MAX_Y && xMeters >= (COURT_WIDTH_M - wingLimitX)) {
            lane = 'RW';
        } else if (dxCenter < -CB_HALF_WIDTH) {
            lane = 'LB';
        } else if (dxCenter > CB_HALF_WIDTH) {
            lane = 'RB';
        } else {
            lane = 'CB';
        }

        let depth = '6-9m';
        if (yMeters <= 6.2) {
            depth = '6m際';
        } else if (yMeters > 9.0) {
            depth = '9m外';
        }

        return {
            zone: `${lane} ${depth}`,
            lane,
            depth,
            angleDeg,
            acuteAngleDeg,
            distM: Number(distM.toFixed(1))
        };
    }

    function updateTelemetryUI() {
        if (selectedQuickZone) {
            const labelMap = { '7m': '7mスロー', 'fastbreak': '速攻 (FB)', 'empty': 'エンプティ' };
            telemetryZone.textContent = `エリア: ${labelMap[selectedQuickZone] || selectedQuickZone}`;
            telemetryAngle.textContent = `角度: --°`;
            telemetryDist.textContent = `距離: --.-m`;
            return;
        }
        if (!shotPoint) {
            telemetryZone.textContent = 'エリア: 未選択';
            telemetryAngle.textContent = '角度: --°';
            telemetryDist.textContent = '距離: --.-m';
            return;
        }
        telemetryZone.textContent = `エリア: ${shotPoint.zone}`;
        telemetryAngle.textContent = shotPoint.angleDeg > 90
            ? `角度: ${shotPoint.angleDeg}° (射角${shotPoint.acuteAngleDeg}°)`
            : `角度: ${shotPoint.angleDeg}°`;
        telemetryDist.textContent = `距離: ${shotPoint.distM.toFixed(1)}m`;
    }

    function renderCourt() {
        const m = getCourtMetrics();
        ctx.clearRect(0, 0, m.viewW, m.viewH);

        ctx.save();
        ctx.fillStyle = '#0c182c';
        ctx.fillRect(m.x0, m.y0, m.w, m.h);

        ctx.beginPath();
        ctx.rect(m.x0, m.y0, m.w, m.h);
        ctx.clip();

        const pxPerM = m.pxPerM;
        const goalCenter = normToCanvas(m, 0.5, 0);
        const leftPost = normToCanvas(m, 0.5 - 1.5 / 20, 0);
        const rightPost = normToCanvas(m, 0.5 + 1.5 / 20, 0);

        // LW / RW コーナーゾーン色分け
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.beginPath();
        ctx.moveTo(m.x0, m.y0);
        ctx.lineTo(m.x0 + WING_TOP_X * pxPerM, m.y0);
        ctx.lineTo(m.x0 + WING_BOT_X * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        ctx.lineTo(m.x0, m.y0 + WING_MAX_Y * pxPerM);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(m.x0 + m.w, m.y0);
        ctx.lineTo(m.x0 + (COURT_WIDTH_M - WING_TOP_X) * pxPerM, m.y0);
        ctx.lineTo(m.x0 + (COURT_WIDTH_M - WING_BOT_X) * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        ctx.lineTo(m.x0 + m.w, m.y0 + WING_MAX_Y * pxPerM);
        ctx.closePath();
        ctx.fill();

        // 6mゴールエリア
        ctx.beginPath();
        ctx.arc(leftPost.cx, leftPost.cy, 6 * pxPerM, Math.PI, Math.PI / 2, true);
        ctx.lineTo(rightPost.cx, leftPost.cy + 6 * pxPerM);
        ctx.arc(rightPost.cx, rightPost.cy, 6 * pxPerM, Math.PI / 2, 0, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.11)';
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#34d399';
        ctx.stroke();

        // 9mフリースローライン
        ctx.beginPath();
        ctx.setLineDash([7, 6]);
        ctx.arc(leftPost.cx, leftPost.cy, 9 * pxPerM, Math.PI, Math.PI / 2, true);
        ctx.lineTo(rightPost.cx, leftPost.cy + 9 * pxPerM);
        ctx.arc(rightPost.cx, rightPost.cy, 9 * pxPerM, Math.PI / 2, 0, true);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
        ctx.stroke();
        ctx.setLineDash([]);

        // 7mライン
        const p7L = normToCanvas(m, 0.5 - 0.5 / 20, 7 / 20);
        const p7R = normToCanvas(m, 0.5 + 0.5 / 20, 7 / 20);
        ctx.beginPath();
        ctx.moveTo(p7L.cx, p7L.cy);
        ctx.lineTo(p7R.cx, p7R.cy);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.75)';
        ctx.stroke();

        // 境界ガイド線
        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(m.x0 + WING_TOP_X * pxPerM, m.y0);
        ctx.lineTo(m.x0 + WING_BOT_X * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        ctx.lineTo(m.x0, m.y0 + WING_MAX_Y * pxPerM);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(m.x0 + (COURT_WIDTH_M - WING_TOP_X) * pxPerM, m.y0);
        ctx.lineTo(m.x0 + (COURT_WIDTH_M - WING_BOT_X) * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        ctx.lineTo(m.x0 + m.w, m.y0 + WING_MAX_Y * pxPerM);
        ctx.stroke();

        const lbcbX = m.x0 + (10 - CB_HALF_WIDTH) * pxPerM;
        const cbrbX = m.x0 + (10 + CB_HALF_WIDTH) * pxPerM;
        ctx.beginPath();
        ctx.moveTo(lbcbX, m.y0 + 6 * pxPerM);
        ctx.lineTo(lbcbX, m.y0 + m.h);
        ctx.moveTo(cbrbX, m.y0 + 6 * pxPerM);
        ctx.lineTo(cbrbX, m.y0 + m.h);
        ctx.stroke();
        ctx.restore();

        // レーンラベル
        ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LW', m.x0 + 1.3 * pxPerM, m.y0 + 3.2 * pxPerM);
        ctx.fillText('RW', m.x0 + (COURT_WIDTH_M - 1.3) * pxPerM, m.y0 + 3.2 * pxPerM);
        ctx.fillText('LB', m.x0 + 3.8 * pxPerM, m.y0 + 9.8 * pxPerM);
        ctx.fillText('CB', m.x0 + 10.0 * pxPerM, m.y0 + 9.8 * pxPerM);
        ctx.fillText('RB', m.x0 + 16.2 * pxPerM, m.y0 + 9.8 * pxPerM);

        // 距離ラベル
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('6m', m.x0 + m.w - 6, m.y0 + 6 * pxPerM - 4);
        ctx.fillText('9m', m.x0 + m.w - 6, m.y0 + 9 * pxPerM - 4);

        // 過去プロット
        historyLogs.forEach(item => {
            if (!item.point) return;
            const pt = normToCanvas(m, item.point.x, item.point.y);
            ctx.beginPath();
            ctx.arc(pt.cx, pt.cy, 4.5, 0, Math.PI * 2);
            if (item.result === 'goal') {
                ctx.fillStyle = item.team === 'own' ? 'rgba(96, 165, 250, 0.65)' : 'rgba(251, 113, 133, 0.65)';
            } else if (item.result === 'save') {
                ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
            } else {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
            }
            ctx.fill();
        });

        // 選択中の打点とゴール中心への角度線
        if (shotPoint && !selectedQuickZone) {
            const activePt = normToCanvas(m, shotPoint.x, shotPoint.y);

            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(activePt.cx, activePt.cy);
            ctx.lineTo(goalCenter.cx, goalCenter.cy);
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(activePt.cx, activePt.cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = currentTeam === 'own' ? '#3b82f6' : '#f43f5e';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        // 上端ゴールライン＆ゴール枠
        ctx.beginPath();
        ctx.moveTo(m.x0, m.y0);
        ctx.lineTo(m.x0 + m.w, m.y0);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#6ee7b7';
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(leftPost.cx, m.y0, rightPost.cx - leftPost.cx, 5);

        ctx.restore();
    }

    function handleCourtPointer(e) {
        const m = getCourtMetrics();
        const rect = shotCanvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const { nx, ny } = canvasToNorm(m, cx, cy);
        const info = classifyShotArea(nx, ny);

        selectedQuickZone = null;
        quickZoneBtns.forEach(b => b.classList.remove('active'));

        shotPoint = {
            x: Number(nx.toFixed(3)),
            y: Number(ny.toFixed(3)),
            zone: info.zone,
            lane: info.lane,
            depth: info.depth,
            angleDeg: info.angleDeg,
            acuteAngleDeg: info.acuteAngleDeg,
            distM: info.distM
        };

        updateTelemetryUI();
        renderCourt();
    }

    shotCanvas.addEventListener('pointerdown', (e) => {
        shotCanvas.setPointerCapture(e.pointerId);
        handleCourtPointer(e);
    });

    shotCanvas.addEventListener('pointermove', (e) => {
        if (shotCanvas.hasPointerCapture(e.pointerId)) {
            handleCourtPointer(e);
        }
    });

    quickZoneBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.quickZone;
            if (selectedQuickZone === q) {
                selectedQuickZone = null;
                btn.classList.remove('active');
            } else {
                selectedQuickZone = q;
                shotPoint = null;
                quickZoneBtns.forEach(b => b.classList.toggle('active', b === btn));
            }
            updateTelemetryUI();
            renderCourt();
        });
    });

    // ==========================================
    // 前後半・タイマー・スコア・記録処理
    // ==========================================
    function updateHalfUI() {
        btnHalfToggle.textContent = matchInfo.half;
        btnHalfToggle.classList.toggle('second', matchInfo.half === '後半');
    }

    btnHalfToggle.addEventListener('click', () => {
        matchInfo.half = (matchInfo.half === '前半') ? '後半' : '前半';
        updateHalfUI();
        saveAllData();
    });

    function formatTimer(sec) {
        const mm = String(Math.floor(sec / 60)).padStart(2, '0');
        const ss = String(sec % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    }

    btnTimerToggle.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
            btnTimerToggle.textContent = '▶';
            btnTimerToggle.classList.remove('running');
            saveAllData();
        } else {
            isTimerRunning = true;
            btnTimerToggle.textContent = '❚❚';
            btnTimerToggle.classList.add('running');
            timerInterval = setInterval(() => {
                elapsedSec++;
                timerDisplay.textContent = formatTimer(elapsedSec);
                if (elapsedSec % 10 === 0) saveAllData();
            }, 1000);
        }
    });

    btnTimerReset.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
            btnTimerToggle.textContent = '▶';
            btnTimerToggle.classList.remove('running');
        }
        elapsedSec = 0;
        timerDisplay.textContent = '00:00';
        saveAllData();
    });

    function updateScoreUI() {
        scoreOwnEl.textContent = String(scoreOwn);
        scoreOppEl.textContent = String(scoreOpp);
    }

    const RESULT_LABEL_MAP = {
        goal: '得点',
        save: 'GKセーブ',
        miss: '枠外ミス',
        turnover: 'ターンオーバー',
        '2min': '2分退場',
        warning: '警告'
    };

    function renderHistoryUI() {
        btnUndo.disabled = historyLogs.length === 0;
        logCountEl.textContent = String(historyLogs.length);

        if (historyLogs.length === 0) {
            playLogList.innerHTML = '<li class="log-empty">まだ記録がありません</li>';
            return;
        }

        playLogList.innerHTML = '';
        [...historyLogs].reverse().forEach(item => {
            const li = document.createElement('li');
            li.className = `log-item ${item.team === 'opp' ? 'opp' : ''}`;

            const top = document.createElement('div');
            top.className = 'log-item-top';
            const teamTag = item.team === 'own' ? '自' : '相';
            const pTag = item.player === 'GK' ? 'GK' : `#${item.player}${item.playerName ? ' ' + item.playerName : ''}`;
            top.textContent = `[${item.half || '前半'}] ${item.timeStr} [${teamTag}] ${pTag} ${item.resultLabel}`;

            const sub = document.createElement('div');
            sub.className = 'log-item-sub';
            const detailParts = [];
            if (item.zoneLabel) detailParts.push(item.zoneLabel);
            if (item.angleDeg !== null && item.angleDeg !== undefined) detailParts.push(`${item.angleDeg}°`);
            if (item.courseLabel) detailParts.push(`コース:${item.courseLabel}`);
            sub.textContent = detailParts.length > 0 ? detailParts.join(' / ') : '位置・コース未指定';

            li.appendChild(top);
            li.appendChild(sub);
            playLogList.appendChild(li);
        });
    }

    resultBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const resultKey = btn.dataset.result;
            const resultLabel = RESULT_LABEL_MAP[resultKey] || resultKey;

            let zoneLabel = '';
            let angleDeg = null;
            let acuteAngleDeg = null;
            let distM = null;

            if (selectedQuickZone) {
                const qMap = { '7m': '7mスロー', 'fastbreak': '速攻(FB)', 'empty': 'エンプティ' };
                zoneLabel = qMap[selectedQuickZone] || selectedQuickZone;
            } else if (shotPoint) {
                zoneLabel = shotPoint.zone;
                angleDeg = shotPoint.angleDeg;
                acuteAngleDeg = shotPoint.acuteAngleDeg;
                distM = shotPoint.distM;
            }

            let courseLabel = '';
            if (selectedGoalCourse) {
                const foundGoal = GOAL_ZONES.find(g => g.id === selectedGoalCourse);
                if (foundGoal) {
                    courseLabel = foundGoal.label;
                } else if (selectedGoalCourse === 'post') {
                    courseLabel = 'ポスト・バー';
                } else if (selectedGoalCourse === 'block') {
                    courseLabel = 'DFブロック';
                }
            }

            if (resultKey === 'goal') {
                if (currentTeam === 'own') scoreOwn++;
                else scoreOpp++;
                updateScoreUI();
            }

            const entry = {
                id: Date.now() + Math.random(),
                half: matchInfo.half,
                timeStr: formatTimer(elapsedSec),
                team: currentTeam,
                player: selectedPlayer,
                playerName: getPlayerDisplayName(currentTeam, selectedPlayer),
                result: resultKey,
                resultLabel,
                zoneLabel,
                angleDeg,
                acuteAngleDeg,
                distM,
                courseLabel,
                point: shotPoint ? { ...shotPoint } : null
            };

            historyLogs.push(entry);
            renderHistoryUI();
            renderCourt();
            saveAllData();

            selectedGoalCourse = null;
            selectedQuickZone = null;
            shotPoint = null;
            quickZoneBtns.forEach(b => b.classList.remove('active'));
            updateGoalSelectionUI();
            updateTelemetryUI();
        });
    });

    btnUndo.addEventListener('click', () => {
        if (historyLogs.length === 0) return;
        const last = historyLogs.pop();
        if (last.result === 'goal') {
            if (last.team === 'own') scoreOwn = Math.max(0, scoreOwn - 1);
            else scoreOpp = Math.max(0, scoreOpp - 1);
            updateScoreUI();
        }
        renderHistoryUI();
        renderCourt();
        saveAllData();
    });

    // ==========================================
    // 名簿・CSV出力・データ管理タブ処理
    // ==========================================
    function updateSummaryCardUI() {
        matchTitleInput.value = matchInfo.title || '';
        matchOpponentInput.value = matchInfo.opponent || '';
        summaryTotalLogs.textContent = `${historyLogs.length} 件`;
        summaryScore.textContent = `${scoreOwn} - ${scoreOpp}`;
    }

    matchTitleInput.addEventListener('input', () => {
        matchInfo.title = matchTitleInput.value;
        saveAllData();
    });

    matchOpponentInput.addEventListener('input', () => {
        matchInfo.opponent = matchOpponentInput.value;
        saveAllData();
    });

    rosterTeamBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activeRosterTeam = btn.dataset.rosterTeam;
            rosterTeamBtns.forEach(b => b.classList.toggle('active', b === btn));
            renderRosterTable();
        });
    });

    const POS_OPTIONS = ['', 'GK', 'LW', 'LB', 'CB', 'RB', 'RW', 'PV'];

    function renderRosterTable() {
        rosterTbody.innerHTML = '';
        const targetMap = roster[activeRosterTeam];

        for (let i = 1; i <= MAX_JERSEY_NUM; i++) {
            const numStr = String(i);
            const info = targetMap[numStr] || { name: '', pos: '' };

            const tr = document.createElement('tr');

            const tdNum = document.createElement('td');
            tdNum.className = 'roster-num-cell';
            tdNum.textContent = `#${numStr}`;

            const tdName = document.createElement('td');
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'roster-name-input';
            nameInput.placeholder = `選手名 (#${numStr})`;
            nameInput.value = info.name || '';
            nameInput.addEventListener('input', () => {
                targetMap[numStr].name = nameInput.value;
                saveAllData();
                if (activeRosterTeam === currentTeam) {
                    buildJerseyGrid();
                }
            });
            tdName.appendChild(nameInput);

            const tdPos = document.createElement('td');
            const posSelect = document.createElement('select');
            posSelect.className = 'roster-pos-select';
            POS_OPTIONS.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p || '未設定';
                if (info.pos === p) opt.selected = true;
                posSelect.appendChild(opt);
            });
            posSelect.addEventListener('change', () => {
                targetMap[numStr].pos = posSelect.value;
                saveAllData();
            });
            tdPos.appendChild(posSelect);

            tr.appendChild(tdNum);
            tr.appendChild(tdName);
            tr.appendChild(tdPos);
            rosterTbody.appendChild(tr);
        }
    }

    // Excel用 CSV ダウンロード（BOM付きUTF-8）
    btnExportCsv.addEventListener('click', () => {
        const headers = [
            'No', '前後半', '時間', 'チーム', '背番号', '選手名',
            '結果', 'エリア', 'レーン', '深さ',
            '角度(0-180)', '射角(0-90)', '距離(m)',
            'X座標(m)', 'Y座標(m)', 'ゴールコース'
        ];

        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = historyLogs.map((item, idx) => {
            const teamName = item.team === 'own' ? '自チーム' : '相手チーム';
            const lane = item.point ? item.point.lane : '';
            const depth = item.point ? item.point.depth : '';
            const xM = item.point ? (item.point.x * COURT_WIDTH_M).toFixed(2) : '';
            const yM = item.point ? (item.point.y * 20.0).toFixed(2) : '';

            return [
                idx + 1,
                item.half || '前半',
                item.timeStr,
                teamName,
                item.player,
                item.playerName || '',
                item.resultLabel,
                item.zoneLabel || '',
                lane,
                depth,
                item.angleDeg !== null && item.angleDeg !== undefined ? item.angleDeg : '',
                item.acuteAngleDeg !== null && item.acuteAngleDeg !== undefined ? item.acuteAngleDeg : '',
                item.distM !== null && item.distM !== undefined ? item.distM : '',
                xM,
                yM,
                item.courseLabel || ''
            ].map(escapeCsv).join(',');
        });

        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const oppClean = (matchInfo.opponent || '試合データ').replace(/[\\/:*?"<>|]/g, '_');
        const filename = `STAT_${ymd}_${oppClean}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 試合データリセット（名簿は維持）
    btnResetMatch.addEventListener('click', () => {
        const ok = window.confirm('現在のスコア・タイマー・プレイ記録をすべて消去して新しい試合を始めますか？（登録した選手名簿は残ります）');
        if (!ok) return;

        if (isTimerRunning) {
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
            btnTimerToggle.textContent = '▶';
            btnTimerToggle.classList.remove('running');
        }

        historyLogs = [];
        scoreOwn = 0;
        scoreOpp = 0;
        elapsedSec = 0;
        matchInfo.half = '前半';
        shotPoint = null;
        selectedGoalCourse = null;
        selectedQuickZone = null;

        timerDisplay.textContent = '00:00';
        updateHalfUI();
        updateScoreUI();
        renderHistoryUI();
        updateTelemetryUI();
        updateGoalSelectionUI();
        renderCourt();
        updateSummaryCardUI();
        saveAllData();
    });

    // ==========================================
    // 初期化＆リサイズ追従
    // ==========================================
    timerDisplay.textContent = formatTimer(elapsedSec);
    updateHalfUI();
    buildJerseyGrid();
    buildGoalGrid();
    updateTelemetryUI();
    updateScoreUI();
    renderHistoryUI();
    resizeCourtCanvas();

    window.addEventListener('resize', () => {
        if (viewInput.style.display !== 'none') {
            resizeCourtCanvas();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStatApp);
} else {
    initStatApp();
}
