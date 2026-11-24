function initStatApp() {
    const STORAGE_KEY = 'TB_STAT_SHARED_V1';
    const MAX_JERSEY_NUM = 18;
    const COURT_WIDTH_M = 20.0;
    const MAX_VIEW_METERS_Y = 11.5;

    // コーナー境界定数
    const WING_MAX_Y = 6.5;
    const WING_TOP_X = 3.5;
    const WING_BOT_X = 2.0;
    const CB_HALF_WIDTH = 3.0;

    // ==========================================
    // 共通要素取得
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const views = {
        input: document.getElementById('view-input'),
        map: document.getElementById('view-map'),
        tactics: document.getElementById('view-tactics'),
        roster: document.getElementById('view-roster')
    };

    const btnHalfToggle = document.getElementById('btn-half-toggle');
    const timerDisplay = document.getElementById('timer-display');
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const scoreOwnEl = document.getElementById('score-own');
    const scoreOppEl = document.getElementById('score-opp');

    // タブ1：試合入力
    const jerseyGrid = document.getElementById('jersey-grid');
    const btnSelectGk = document.getElementById('btn-select-gk');
    const selectedPlayerBadge = document.getElementById('selected-player-badge');
    const teamBtns = document.querySelectorAll('.team-btn');
    const goalGrid = document.getElementById('goal-grid');
    const specialCourseBtns = document.querySelectorAll('[data-special-course]');
    const btnClearSelection = document.getElementById('btn-clear-selection');
    const quickZoneBtns = document.querySelectorAll('[data-quick-zone]');
    const shotCanvas = document.getElementById('shot-court-canvas');
    const shotCtx = shotCanvas.getContext('2d');
    const telemetryZone = document.getElementById('telemetry-zone');
    const telemetryAngle = document.getElementById('telemetry-angle');
    const telemetryDist = document.getElementById('telemetry-dist');
    const resultBtns = document.querySelectorAll('.result-btn');
    const playLogList = document.getElementById('play-log-list');
    const logCountEl = document.getElementById('log-count');
    const btnUndo = document.getElementById('btn-undo');

    // タブ2：分析マップ
    const mapTeamBtns = document.querySelectorAll('.map-team-btn');
    const mapHalfFilter = document.getElementById('map-half-filter');
    const mapPlayerFilter = document.getElementById('map-player-filter');
    const mapShowLines = document.getElementById('map-show-lines');
    const kpiShotsEl = document.getElementById('kpi-shots');
    const kpiGoalsEl = document.getElementById('kpi-goals');
    const kpiRatePill = document.getElementById('kpi-rate-pill');
    const analysisCanvas = document.getElementById('analysis-court-canvas');
    const analysisCtx = analysisCanvas.getContext('2d');
    const mapGoalTitle = document.getElementById('map-goal-title');
    const mapSpecialCounts = document.getElementById('map-special-counts');
    const analysisGoalGrid = document.getElementById('analysis-goal-grid');
    const thRateCol = document.getElementById('th-rate-col');
    const analysisAreaTbody = document.getElementById('analysis-area-tbody');

    // タブ3：作戦盤
    const tbToolBtns = document.querySelectorAll('.tb-tool-btn');
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const btnTbUndoLine = document.getElementById('btn-tb-undo-line');
    const btnTbClearLines = document.getElementById('btn-tb-clear-lines');
    const btnTbCourtMode = document.getElementById('btn-tb-court-mode');
    const tbStatOverlay = document.getElementById('tb-stat-overlay');
    const btnTbDefSide = document.getElementById('btn-tb-def-side');
    const tbPresetBtns = document.querySelectorAll('.tb-preset-btn');
    const btnTbResetPos = document.getElementById('btn-tb-reset-pos');
    const btnKfAdd = document.getElementById('btn-kf-add');
    const btnKfPlay = document.getElementById('btn-kf-play');
    const chkKfLoop = document.getElementById('chk-kf-loop');
    const kfListWrap = document.getElementById('kf-list-wrap');
    const btnKfClear = document.getElementById('btn-kf-clear');
    const tacticsCanvas = document.getElementById('tactics-canvas');
    const tbCtx = tacticsCanvas.getContext('2d');

    // タブ4：名簿・出力
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
    // 永続化データ読み書き（localStorage）
    // ==========================================
    function createDefaultRoster() {
        const obj = {};
        for (let i = 1; i <= MAX_JERSEY_NUM; i++) {
            obj[String(i)] = { name: '', pos: (i === 1 || i === 12) ? 'GK' : '' };
        }
        return obj;
    }

    function createDefaultMarkers() {
        return [
            { id: 'own_gk', team: 'own', num: '1', isGk: true, x: 0.50, y: 0.96 },
            { id: 'own_2',  team: 'own', num: '2', isGk: false, x: 0.08, y: 0.22 },
            { id: 'own_3',  team: 'own', num: '3', isGk: false, x: 0.24, y: 0.56 },
            { id: 'own_4',  team: 'own', num: '4', isGk: false, x: 0.50, y: 0.62 },
            { id: 'own_5',  team: 'own', num: '5', isGk: false, x: 0.76, y: 0.56 },
            { id: 'own_6',  team: 'own', num: '6', isGk: false, x: 0.92, y: 0.22 },
            { id: 'own_7',  team: 'own', num: '7', isGk: false, x: 0.58, y: 0.34 },
            { id: 'opp_gk', team: 'opp', num: '1', isGk: true, x: 0.50, y: 0.03 },
            { id: 'opp_2',  team: 'opp', num: '2', isGk: false, x: 0.16, y: 0.24 },
            { id: 'opp_3',  team: 'opp', num: '3', isGk: false, x: 0.30, y: 0.33 },
            { id: 'opp_4',  team: 'opp', num: '4', isGk: false, x: 0.43, y: 0.35 },
            { id: 'opp_5',  team: 'opp', num: '5', isGk: false, x: 0.57, y: 0.35 },
            { id: 'opp_6',  team: 'opp', num: '6', isGk: false, x: 0.70, y: 0.33 },
            { id: 'opp_7',  team: 'opp', num: '7', isGk: false, x: 0.84, y: 0.24 },
            { id: 'ball',   team: 'ball', num: '', isGk: false, x: 0.50, y: 0.58 }
        ];
    }

    function loadSavedData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    const saved = loadSavedData();

    let matchInfo = (saved && saved.matchInfo) ? saved.matchInfo : { title: '', opponent: '', half: '前半' };
    let roster = (saved && saved.roster) ? {
        own: { ...createDefaultRoster(), ...(saved.roster.own || {}) },
        opp: { ...createDefaultRoster(), ...(saved.roster.opp || {}) }
    } : { own: createDefaultRoster(), opp: createDefaultRoster() };

    let historyLogs = (saved && saved.state && Array.isArray(saved.state.historyLogs)) ? saved.state.historyLogs : [];
    let scoreOwn = (saved && saved.state && typeof saved.state.scoreOwn === 'number') ? saved.state.scoreOwn : 0;
    let scoreOpp = (saved && saved.state && typeof saved.state.scoreOpp === 'number') ? saved.state.scoreOpp : 0;
    let elapsedSec = (saved && saved.state && typeof saved.state.elapsedSec === 'number') ? saved.state.elapsedSec : 0;

    let tbMarkers = (saved && saved.tactics && Array.isArray(saved.tactics.markers)) ? saved.tactics.markers : createDefaultMarkers();
    let tbStrokes = (saved && saved.tactics && Array.isArray(saved.tactics.strokes)) ? saved.tactics.strokes : [];
    let tbKeyframes = (saved && saved.tactics && Array.isArray(saved.tactics.keyframes)) ? saved.tactics.keyframes : [];

    let saveFlashTimer = null;
    function saveAllData() {
        try {
            const payload = {
                version: 3,
                updatedAt: new Date().toISOString(),
                matchInfo,
                roster,
                state: { scoreOwn, scoreOpp, elapsedSec, historyLogs },
                tactics: { markers: tbMarkers, strokes: tbStrokes, keyframes: tbKeyframes }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            if (autosaveStatus) {
                autosaveStatus.textContent = '保存済み ✓';
                clearTimeout(saveFlashTimer);
                saveFlashTimer = setTimeout(() => { autosaveStatus.textContent = '自動保存ON'; }, 1200);
            }
        } catch (e) {}
    }

    // ==========================================
    // 共通ヘルパー＆タブ切替
    // ==========================================
    let activeTab = 'input';

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            activeTab = target;
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));

            Object.keys(views).forEach(k => {
                views[k].style.display = (k === target) ? '' : 'none';
            });

            if (target === 'input') {
                resizeShotCanvas();
            } else if (target === 'map') {
                refreshMapPlayerFilter();
                renderAnalysisView();
                resizeAnalysisCanvas();
            } else if (target === 'tactics') {
                renderKeyframeChips();
                resizeTacticsCanvas();
            } else if (target === 'roster') {
                updateSummaryCardUI();
                renderRosterTable();
            }
        });
    });

    function getPlayerDisplayName(team, playerKey) {
        if (playerKey === 'GK') return 'GK';
        const entry = roster[team] && roster[team][playerKey];
        return entry && entry.name ? entry.name.trim() : '';
    }

    const GOAL_ZONES = [
        { id: 'UL', label: '左上' }, { id: 'UC', label: '中上' }, { id: 'UR', label: '右上' },
        { id: 'ML', label: '左中' }, { id: 'MC', label: '中央' }, { id: 'MR', label: '右中' },
        { id: 'DL', label: '左下' }, { id: 'DC', label: '下中' }, { id: 'DR', label: '右下' }
    ];

    // ==========================================
    // タブ1：試合入力ロジック
    // ==========================================
    let currentTeam = 'own';
    let selectedPlayer = '1';
    let selectedGoalCourse = null;
    let selectedQuickZone = null;
    let shotPoint = null;
    let timerInterval = null;
    let isTimerRunning = false;

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
            selectedPlayerBadge.textContent = pName ? `${teamLabel}: #${selectedPlayer} ${pName}` : `${teamLabel}: #${selectedPlayer}`;
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
        renderShotCourt();
    });

    function getZoomCourtMetrics(canvasEl) {
        const wrap = canvasEl.parentElement;
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

    function normToZoomCanvas(m, nx, ny) {
        return {
            cx: m.x0 + nx * m.w,
            cy: m.y0 + (ny * 20.0) * m.pxPerM
        };
    }

    function zoomCanvasToNorm(m, cx, cy) {
        const nx = Math.max(0, Math.min(1, (cx - m.x0) / m.w));
        const yMeters = Math.max(0.2, Math.min(MAX_VIEW_METERS_Y, (cy - m.y0) / m.pxPerM));
        return { nx, ny: yMeters / 20.0 };
    }

    function drawZoomBaseCourt(targetCtx, m) {
        targetCtx.clearRect(0, 0, m.viewW, m.viewH);
        targetCtx.save();
        targetCtx.fillStyle = '#0c182c';
        targetCtx.fillRect(m.x0, m.y0, m.w, m.h);

        targetCtx.beginPath();
        targetCtx.rect(m.x0, m.y0, m.w, m.h);
        targetCtx.clip();

        const pxPerM = m.pxPerM;
        const leftPost = normToZoomCanvas(m, 0.5 - 1.5 / 20, 0);
        const rightPost = normToZoomCanvas(m, 0.5 + 1.5 / 20, 0);

        targetCtx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        targetCtx.beginPath();
        targetCtx.moveTo(m.x0, m.y0);
        targetCtx.lineTo(m.x0 + WING_TOP_X * pxPerM, m.y0);
        targetCtx.lineTo(m.x0 + WING_BOT_X * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.lineTo(m.x0, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.beginPath();
        targetCtx.moveTo(m.x0 + m.w, m.y0);
        targetCtx.lineTo(m.x0 + (COURT_WIDTH_M - WING_TOP_X) * pxPerM, m.y0);
        targetCtx.lineTo(m.x0 + (COURT_WIDTH_M - WING_BOT_X) * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.lineTo(m.x0 + m.w, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.beginPath();
        targetCtx.arc(leftPost.cx, leftPost.cy, 6 * pxPerM, Math.PI, Math.PI / 2, true);
        targetCtx.lineTo(rightPost.cx, leftPost.cy + 6 * pxPerM);
        targetCtx.arc(rightPost.cx, rightPost.cy, 6 * pxPerM, Math.PI / 2, 0, true);
        targetCtx.closePath();
        targetCtx.fillStyle = 'rgba(16, 185, 129, 0.11)';
        targetCtx.fill();
        targetCtx.lineWidth = 2.2;
        targetCtx.strokeStyle = '#34d399';
        targetCtx.stroke();

        targetCtx.beginPath();
        targetCtx.setLineDash([7, 6]);
        targetCtx.arc(leftPost.cx, leftPost.cy, 9 * pxPerM, Math.PI, Math.PI / 2, true);
        targetCtx.lineTo(rightPost.cx, leftPost.cy + 9 * pxPerM);
        targetCtx.arc(rightPost.cx, rightPost.cy, 9 * pxPerM, Math.PI / 2, 0, true);
        targetCtx.lineWidth = 1.8;
        targetCtx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
        targetCtx.stroke();
        targetCtx.setLineDash([]);

        const p7L = normToZoomCanvas(m, 0.5 - 0.5 / 20, 7 / 20);
        const p7R = normToZoomCanvas(m, 0.5 + 0.5 / 20, 7 / 20);
        targetCtx.beginPath();
        targetCtx.moveTo(p7L.cx, p7L.cy);
        targetCtx.lineTo(p7R.cx, p7R.cy);
        targetCtx.lineWidth = 2;
        targetCtx.strokeStyle = 'rgba(248, 250, 252, 0.75)';
        targetCtx.stroke();

        targetCtx.save();
        targetCtx.setLineDash([4, 5]);
        targetCtx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        targetCtx.lineWidth = 1.2;

        targetCtx.beginPath();
        targetCtx.moveTo(m.x0 + WING_TOP_X * pxPerM, m.y0);
        targetCtx.lineTo(m.x0 + WING_BOT_X * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.lineTo(m.x0, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.stroke();

        targetCtx.beginPath();
        targetCtx.moveTo(m.x0 + (COURT_WIDTH_M - WING_TOP_X) * pxPerM, m.y0);
        targetCtx.lineTo(m.x0 + (COURT_WIDTH_M - WING_BOT_X) * pxPerM, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.lineTo(m.x0 + m.w, m.y0 + WING_MAX_Y * pxPerM);
        targetCtx.stroke();

        const lbcbX = m.x0 + (10 - CB_HALF_WIDTH) * pxPerM;
        const cbrbX = m.x0 + (10 + CB_HALF_WIDTH) * pxPerM;
        targetCtx.beginPath();
        targetCtx.moveTo(lbcbX, m.y0 + 6 * pxPerM);
        targetCtx.lineTo(lbcbX, m.y0 + m.h);
        targetCtx.moveTo(cbrbX, m.y0 + 6 * pxPerM);
        targetCtx.lineTo(cbrbX, m.y0 + m.h);
        targetCtx.stroke();
        targetCtx.restore();

        targetCtx.fillStyle = 'rgba(226, 232, 240, 0.75)';
        targetCtx.font = 'bold 12px sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.fillText('LW', m.x0 + 1.3 * pxPerM, m.y0 + 3.2 * pxPerM);
        targetCtx.fillText('RW', m.x0 + (COURT_WIDTH_M - 1.3) * pxPerM, m.y0 + 3.2 * pxPerM);
        targetCtx.fillText('LB', m.x0 + 3.8 * pxPerM, m.y0 + 9.8 * pxPerM);
        targetCtx.fillText('CB', m.x0 + 10.0 * pxPerM, m.y0 + 9.8 * pxPerM);
        targetCtx.fillText('RB', m.x0 + 16.2 * pxPerM, m.y0 + 9.8 * pxPerM);

        targetCtx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        targetCtx.font = 'bold 10px sans-serif';
        targetCtx.textAlign = 'right';
        targetCtx.fillText('6m', m.x0 + m.w - 6, m.y0 + 6 * pxPerM - 4);
        targetCtx.fillText('9m', m.x0 + m.w - 6, m.y0 + 9 * pxPerM - 4);

        targetCtx.beginPath();
        targetCtx.moveTo(m.x0, m.y0);
        targetCtx.lineTo(m.x0 + m.w, m.y0);
        targetCtx.lineWidth = 3;
        targetCtx.strokeStyle = '#6ee7b7';
        targetCtx.stroke();

        targetCtx.fillStyle = '#ef4444';
        targetCtx.fillRect(leftPost.cx, m.y0, rightPost.cx - leftPost.cx, 5);
        targetCtx.restore();
    }

    function classifyShotArea(nx, ny) {
        const xMeters = nx * COURT_WIDTH_M;
        const yMeters = ny * 20.0;
        const dxCenter = xMeters - 10.0;
        const distM = Math.hypot(dxCenter, yMeters);

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
        if (yMeters <= 6.2) depth = '6m際';
        else if (yMeters > 9.0) depth = '9m外';

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

    function resizeShotCanvas() {
        const wrap = shotCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        shotCanvas.width = Math.floor(rect.width * dpr);
        shotCanvas.height = Math.floor(rect.height * dpr);
        shotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderShotCourt();
    }

    function renderShotCourt() {
        const m = getZoomCourtMetrics(shotCanvas);
        drawZoomBaseCourt(shotCtx, m);

        const goalCenter = normToZoomCanvas(m, 0.5, 0);

        historyLogs.forEach(item => {
            if (!item.point) return;
            const pt = normToZoomCanvas(m, item.point.x, item.point.y);
            shotCtx.beginPath();
            shotCtx.arc(pt.cx, pt.cy, 4.5, 0, Math.PI * 2);
            if (item.result === 'goal') {
                shotCtx.fillStyle = item.team === 'own' ? 'rgba(96, 165, 250, 0.65)' : 'rgba(251, 113, 133, 0.65)';
            } else if (item.result === 'save') {
                shotCtx.fillStyle = 'rgba(251, 191, 36, 0.65)';
            } else {
                shotCtx.fillStyle = 'rgba(148, 163, 184, 0.45)';
            }
            shotCtx.fill();
        });

        if (shotPoint && !selectedQuickZone) {
            const activePt = normToZoomCanvas(m, shotPoint.x, shotPoint.y);

            shotCtx.save();
            shotCtx.setLineDash([5, 5]);
            shotCtx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
            shotCtx.lineWidth = 1.6;
            shotCtx.beginPath();
            shotCtx.moveTo(activePt.cx, activePt.cy);
            shotCtx.lineTo(goalCenter.cx, goalCenter.cy);
            shotCtx.stroke();
            shotCtx.restore();

            shotCtx.beginPath();
            shotCtx.arc(activePt.cx, activePt.cy, 8, 0, Math.PI * 2);
            shotCtx.fillStyle = currentTeam === 'own' ? '#3b82f6' : '#f43f5e';
            shotCtx.fill();
            shotCtx.lineWidth = 2.5;
            shotCtx.strokeStyle = '#ffffff';
            shotCtx.stroke();
        }
    }

    function handleCourtPointer(e) {
        const m = getZoomCourtMetrics(shotCanvas);
        const rect = shotCanvas.getBoundingClientRect();
        const { nx, ny } = zoomCanvasToNorm(m, e.clientX - rect.left, e.clientY - rect.top);
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
        renderShotCourt();
    }

    shotCanvas.addEventListener('pointerdown', (e) => {
        shotCanvas.setPointerCapture(e.pointerId);
        handleCourtPointer(e);
    });

    shotCanvas.addEventListener('pointermove', (e) => {
        if (shotCanvas.hasPointerCapture(e.pointerId)) handleCourtPointer(e);
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
            renderShotCourt();
        });
    });

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
        goal: '得点', save: 'GKセーブ', miss: '枠外ミス',
        turnover: 'ターンオーバー', '2min': '2分退場', warning: '警告'
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
            let quickType = selectedQuickZone || null;
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
                if (foundGoal) courseLabel = foundGoal.label;
                else if (selectedGoalCourse === 'post') courseLabel = 'ポスト・バー';
                else if (selectedGoalCourse === 'block') courseLabel = 'DFブロック';
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
                quickType,
                angleDeg,
                acuteAngleDeg,
                distM,
                courseId: selectedGoalCourse || null,
                courseLabel,
                point: shotPoint ? { ...shotPoint } : null
            };

            historyLogs.push(entry);
            renderHistoryUI();
            renderShotCourt();
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
        renderShotCourt();
        saveAllData();
    });

    // ==========================================
    // タブ2：分析マップロジック
    // ==========================================
    let mapTargetTeam = 'own';

    function refreshMapPlayerFilter() {
        const curVal = mapPlayerFilter.value;
        mapPlayerFilter.innerHTML = '<option value="all">全選手</option>';
        for (let i = 1; i <= MAX_JERSEY_NUM; i++) {
            const numStr = String(i);
            const pName = getPlayerDisplayName(mapTargetTeam, numStr);
            const opt = document.createElement('option');
            opt.value = numStr;
            opt.textContent = pName ? `#${numStr} ${pName}` : `#${numStr}`;
            mapPlayerFilter.appendChild(opt);
        }
        mapPlayerFilter.value = curVal || 'all';
    }

    function getFilteredShots() {
        const halfVal = mapHalfFilter.value;
        const playerVal = mapPlayerFilter.value;
        const SHOT_RESULTS = ['goal', 'save', 'miss'];

        return historyLogs.filter(item => {
            if (item.team !== mapTargetTeam) return false;
            if (!SHOT_RESULTS.includes(item.result)) return false;
            if (halfVal !== 'all' && (item.half || '前半') !== halfVal) return false;
            if (playerVal !== 'all' && item.player !== playerVal) return false;
            return true;
        });
    }

    mapTeamBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mapTargetTeam = btn.dataset.mapTeam;
            mapTeamBtns.forEach(b => b.classList.toggle('active', b === btn));
            refreshMapPlayerFilter();
            renderAnalysisView();
        });
    });

    mapHalfFilter.addEventListener('change', renderAnalysisView);
    mapPlayerFilter.addEventListener('change', renderAnalysisView);
    mapShowLines.addEventListener('change', renderAnalysisCourt);

    function resizeAnalysisCanvas() {
        const wrap = analysisCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        analysisCanvas.width = Math.floor(rect.width * dpr);
        analysisCanvas.height = Math.floor(rect.height * dpr);
        analysisCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderAnalysisCourt();
    }

    function renderAnalysisCourt() {
        const m = getZoomCourtMetrics(analysisCanvas);
        drawZoomBaseCourt(analysisCtx, m);

        const shots = getFilteredShots();
        const goalCenter = normToZoomCanvas(m, 0.5, 0);
        const showLines = mapShowLines.checked;

        shots.forEach(item => {
            if (!item.point) return;
            const pt = normToZoomCanvas(m, item.point.x, item.point.y);

            if (showLines) {
                analysisCtx.save();
                analysisCtx.setLineDash([4, 4]);
                analysisCtx.lineWidth = 1.2;
                if (item.result === 'goal') {
                    analysisCtx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
                } else if (item.result === 'save') {
                    analysisCtx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
                } else {
                    analysisCtx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
                }
                analysisCtx.beginPath();
                analysisCtx.moveTo(pt.cx, pt.cy);
                analysisCtx.lineTo(goalCenter.cx, goalCenter.cy);
                analysisCtx.stroke();
                analysisCtx.restore();
            }

            analysisCtx.beginPath();
            analysisCtx.arc(pt.cx, pt.cy, 6.5, 0, Math.PI * 2);
            if (item.result === 'goal') {
                analysisCtx.fillStyle = '#3b82f6';
            } else if (item.result === 'save') {
                analysisCtx.fillStyle = '#f59e0b';
            } else {
                analysisCtx.fillStyle = '#64748b';
            }
            analysisCtx.fill();
            analysisCtx.lineWidth = 1.5;
            analysisCtx.strokeStyle = '#ffffff';
            analysisCtx.stroke();

            analysisCtx.fillStyle = '#ffffff';
            analysisCtx.font = 'bold 8px sans-serif';
            analysisCtx.textAlign = 'center';
            analysisCtx.textBaseline = 'middle';
            analysisCtx.fillText(item.player, pt.cx, pt.cy);
        });
    }

    function renderAnalysisView() {
        const shots = getFilteredShots();
        const isGkAnalysis = (mapTargetTeam === 'opp');

        const totalShots = shots.length;
        const totalGoals = shots.filter(s => s.result === 'goal').length;
        const totalSaves = shots.filter(s => s.result === 'save').length;

        kpiShotsEl.textContent = String(totalShots);
        kpiGoalsEl.textContent = String(totalGoals);

        if (isGkAnalysis) {
            const onTarget = totalGoals + totalSaves;
            const saveRate = onTarget > 0 ? ((totalSaves / onTarget) * 100).toFixed(1) : '0.0';
            kpiRatePill.innerHTML = `GKセーブ率: <strong>${saveRate}%</strong> (${totalSaves}/${onTarget})`;
            mapGoalTitle.textContent = 'コース別 GKセーブ率（相手シュート）';
            thRateCol.textContent = 'セーブ率';
        } else {
            const shootRate = totalShots > 0 ? ((totalGoals / totalShots) * 100).toFixed(1) : '0.0';
            kpiRatePill.innerHTML = `決定率: <strong>${shootRate}%</strong>`;
            mapGoalTitle.textContent = 'ゴールコース別 決定率';
            thRateCol.textContent = '決定率';
        }

        const postCnt = shots.filter(s => s.courseId === 'post').length;
        const blockCnt = shots.filter(s => s.courseId === 'block').length;
        mapSpecialCounts.textContent = `ポスト:${postCnt} / ブロック:${blockCnt}`;

        analysisGoalGrid.innerHTML = '';
        GOAL_ZONES.forEach(z => {
            const cellShots = shots.filter(s => s.courseId === z.id);
            const cGoals = cellShots.filter(s => s.result === 'goal').length;
            const cSaves = cellShots.filter(s => s.result === 'save').length;
            const cTotal = cellShots.length;

            let pct = 0;
            let rateText = '--%';
            let subText = `${z.label} (0)`;

            if (isGkAnalysis) {
                const denom = cGoals + cSaves;
                if (denom > 0) {
                    pct = Math.round((cSaves / denom) * 100);
                    rateText = `${pct}%`;
                }
                subText = `${z.label} 止${cSaves}/打${denom}`;
            } else {
                if (cTotal > 0) {
                    pct = Math.round((cGoals / cTotal) * 100);
                    rateText = `${pct}%`;
                }
                subText = `${z.label} ${cGoals}/${cTotal}`;
            }

            const div = document.createElement('div');
            div.className = 'ag-cell';
            if ((isGkAnalysis ? (cGoals + cSaves) : cTotal) > 0) {
                const alpha = 0.15 + (pct / 100) * 0.55;
                div.style.backgroundColor = isGkAnalysis
                    ? `rgba(16, 185, 129, ${alpha.toFixed(2)})`
                    : `rgba(37, 99, 235, ${alpha.toFixed(2)})`;
                div.style.borderColor = isGkAnalysis ? '#34d399' : '#60a5fa';
            }

            const rEl = document.createElement('div');
            rEl.className = 'ag-rate';
            rEl.textContent = rateText;

            const sEl = document.createElement('div');
            sEl.className = 'ag-sub';
            sEl.textContent = subText;

            div.appendChild(rEl);
            div.appendChild(sEl);
            analysisGoalGrid.appendChild(div);
        });

        const groups = [
            { section: 'レーン別集計' },
            { label: 'LW (左サイド)', fn: s => s.point && s.point.lane === 'LW' },
            { label: 'LB (左バック)', fn: s => s.point && s.point.lane === 'LB' },
            { label: 'CB (センター)', fn: s => s.point && s.point.lane === 'CB' },
            { label: 'RB (右バック)', fn: s => s.point && s.point.lane === 'RB' },
            { label: 'RW (右サイド)', fn: s => s.point && s.point.lane === 'RW' },
            { label: '7mスロー',      fn: s => s.quickType === '7m' },
            { label: '速攻 (FB)',     fn: s => s.quickType === 'fastbreak' },
            { section: '距離帯別集計' },
            { label: '6m際 (イン)',   fn: s => s.point && s.point.depth === '6m際' },
            { label: '6〜9m (ミドル)',fn: s => s.point && s.point.depth === '6-9m' },
            { label: '9m外 (ロング)', fn: s => s.point && s.point.depth === '9m外' }
        ];

        analysisAreaTbody.innerHTML = '';
        groups.forEach(g => {
            if (g.section) {
                const tr = document.createElement('tr');
                tr.className = 'section-row';
                tr.innerHTML = `<td colspan="5">${g.section}</td>`;
                analysisAreaTbody.appendChild(tr);
                return;
            }
            const sub = shots.filter(g.fn);
            const cnt = sub.length;
            const gl = sub.filter(s => s.result === 'goal').length;
            const sv = sub.filter(s => s.result === 'save').length;

            let rateStr = '-';
            if (isGkAnalysis) {
                const denom = gl + sv;
                if (denom > 0) rateStr = `${Math.round((sv / denom) * 100)}%`;
            } else {
                if (cnt > 0) rateStr = `${Math.round((gl / cnt) * 100)}%`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${g.label}</td>
                <td>${cnt}</td>
                <td>${gl}</td>
                <td>${sv}</td>
                <td><strong>${rateStr}</strong></td>
            `;
            analysisAreaTbody.appendChild(tr);
        });

        renderAnalysisCourt();
    }

    // ==========================================
    // タブ3：作戦盤（Tactical-Board ＋ STATデータ重ね表示）
    // ==========================================
    let tbTool = 'move';
    let tbColor = '#facc15';
    let tbCourtMode = 'half';
    let tbDefTargetTeam = 'opp';
    let draggingMarker = null;
    let activeStroke = null;

    let activeKfIndex = -1;
    let isPlayingAnim = false;
    let animFrameId = null;
    let animDisplayMarkers = null;

    tbToolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tbTool = btn.dataset.tbTool;
            tbToolBtns.forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    colorSwatches.forEach(sw => {
        sw.addEventListener('click', () => {
            tbColor = sw.dataset.tbColor;
            colorSwatches.forEach(s => s.classList.toggle('active', s === sw));
            if (tbTool === 'move' || tbTool === 'erase') {
                tbTool = 'line';
                tbToolBtns.forEach(b => b.classList.toggle('active', b.dataset.tbTool === 'line'));
            }
        });
    });

    btnTbUndoLine.addEventListener('click', () => {
        if (tbStrokes.length === 0) return;
        tbStrokes.pop();
        saveAllData();
        renderTacticsBoard();
    });

    btnTbClearLines.addEventListener('click', () => {
        tbStrokes = [];
        saveAllData();
        renderTacticsBoard();
    });

    btnTbCourtMode.addEventListener('click', () => {
        tbCourtMode = (tbCourtMode === 'half') ? 'full' : 'half';
        btnTbCourtMode.textContent = tbCourtMode === 'half' ? 'コート: 半面' : 'コート: 全面';
        renderTacticsBoard();
    });

    tbStatOverlay.addEventListener('change', renderTacticsBoard);

    btnTbDefSide.addEventListener('click', () => {
        tbDefTargetTeam = (tbDefTargetTeam === 'opp') ? 'own' : 'opp';
        btnTbDefSide.textContent = tbDefTargetTeam === 'opp' ? '守備: 相手(赤)' : '守備: 自チーム(青)';
    });

    const FORMATION_COORDS = {
        '6-0': [
            { x: 0.16, y: 0.24 }, { x: 0.30, y: 0.33 }, { x: 0.43, y: 0.35 },
            { x: 0.57, y: 0.35 }, { x: 0.70, y: 0.33 }, { x: 0.84, y: 0.24 }
        ],
        '5-1': [
            { x: 0.16, y: 0.24 }, { x: 0.32, y: 0.33 }, { x: 0.50, y: 0.35 },
            { x: 0.68, y: 0.33 }, { x: 0.84, y: 0.24 }, { x: 0.50, y: 0.48 }
        ],
        '3-2-1': [
            { x: 0.22, y: 0.28 }, { x: 0.50, y: 0.34 }, { x: 0.78, y: 0.28 },
            { x: 0.35, y: 0.43 }, { x: 0.65, y: 0.43 }, { x: 0.50, y: 0.52 }
        ],
        '4-2': [
            { x: 0.18, y: 0.25 }, { x: 0.38, y: 0.34 }, { x: 0.62, y: 0.34 },
            { x: 0.82, y: 0.25 }, { x: 0.36, y: 0.47 }, { x: 0.64, y: 0.47 }
        ]
    };

    tbPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            stopKeyframeAnim();
            const fmt = btn.dataset.formation;
            const coords = FORMATION_COORDS[fmt];
            if (!coords) return;

            const fieldPlayers = tbMarkers.filter(m => m.team === tbDefTargetTeam && !m.isGk);
            fieldPlayers.forEach((p, idx) => {
                if (coords[idx]) {
                    p.x = coords[idx].x;
                    p.y = coords[idx].y;
                }
            });
            saveAllData();
            renderTacticsBoard();
        });
    });

    btnTbResetPos.addEventListener('click', () => {
        stopKeyframeAnim();
        tbMarkers = createDefaultMarkers();
        saveAllData();
        renderTacticsBoard();
    });

    function renderKeyframeChips() {
        kfListWrap.innerHTML = '';
        tbKeyframes.forEach((kf, idx) => {
            const chip = document.createElement('button');
            chip.className = `kf-chip ${idx === activeKfIndex ? 'active' : ''}`;
            chip.textContent = `コマ${idx + 1}`;
            chip.title = 'タップでこの配置を表示';
            chip.addEventListener('click', () => {
                stopKeyframeAnim();
                activeKfIndex = idx;
                tbMarkers = JSON.parse(JSON.stringify(tbKeyframes[idx]));
                renderKeyframeChips();
                renderTacticsBoard();
            });
            kfListWrap.appendChild(chip);
        });
    }

    btnKfAdd.addEventListener('click', () => {
        stopKeyframeAnim();
        tbKeyframes.push(JSON.parse(JSON.stringify(tbMarkers)));
        activeKfIndex = tbKeyframes.length - 1;
        saveAllData();
        renderKeyframeChips();
    });

    btnKfClear.addEventListener('click', () => {
        stopKeyframeAnim();
        tbKeyframes = [];
        activeKfIndex = -1;
        saveAllData();
        renderKeyframeChips();
    });

    function stopKeyframeAnim() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        isPlayingAnim = false;
        animDisplayMarkers = null;
        btnKfPlay.textContent = '▶ 再生';
        btnKfPlay.classList.remove('playing');
    }

    btnKfPlay.addEventListener('click', () => {
        if (isPlayingAnim) {
            stopKeyframeAnim();
            renderTacticsBoard();
            return;
        }
        if (tbKeyframes.length < 2) {
            alert('アニメーション再生するには、選手を動かしながら「＋コマ追加」を2コマ以上登録してください。');
            return;
        }

        isPlayingAnim = true;
        btnKfPlay.textContent = '❚❚ 停止';
        btnKfPlay.classList.add('playing');

        const STEP_DURATION_MS = 950;
        let startTime = performance.now();

        function stepAnim(now) {
            if (!isPlayingAnim) return;
            const elapsed = now - startTime;
            const totalSegments = tbKeyframes.length - 1;
            const rawStep = elapsed / STEP_DURATION_MS;

            if (rawStep >= totalSegments) {
                if (chkKfLoop.checked) {
                    startTime = now;
                    animFrameId = requestAnimationFrame(stepAnim);
                } else {
                    tbMarkers = JSON.parse(JSON.stringify(tbKeyframes[totalSegments]));
                    activeKfIndex = totalSegments;
                    stopKeyframeAnim();
                    renderKeyframeChips();
                    renderTacticsBoard();
                }
                return;
            }

            const segIdx = Math.floor(rawStep);
            const t = rawStep - segIdx;
            const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

            const fromFrame = tbKeyframes[segIdx];
            const toFrame = tbKeyframes[segIdx + 1];

            animDisplayMarkers = fromFrame.map((fm, i) => {
                const tm = toFrame[i] || fm;
                return {
                    ...fm,
                    x: fm.x + (tm.x - fm.x) * easeT,
                    y: fm.y + (tm.y - fm.y) * easeT
                };
            });

            if (activeKfIndex !== segIdx) {
                activeKfIndex = segIdx;
                renderKeyframeChips();
            }

            renderTacticsBoard();
            animFrameId = requestAnimationFrame(stepAnim);
        }

        animFrameId = requestAnimationFrame(stepAnim);
    });

    function resizeTacticsCanvas() {
        const wrap = tacticsCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        tacticsCanvas.width = Math.floor(rect.width * dpr);
        tacticsCanvas.height = Math.floor(rect.height * dpr);
        tbCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderTacticsBoard();
    }

    function getTacticsMetrics() {
        const wrap = tacticsCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        const pad = 14;
        const availW = Math.max(200, rect.width - pad * 2);
        const availH = Math.max(200, rect.height - pad * 2);

        const realW = tbCourtMode === 'half' ? 20.0 : 40.0;
        const realH = 20.0;

        const pxPerM = Math.min(availW / realW, availH / realH);
        const drawW = realW * pxPerM;
        const drawH = realH * pxPerM;

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

    function renderTacticsBoard() {
        const m = getTacticsMetrics();
        tbCtx.clearRect(0, 0, m.viewW, m.viewH);

        tbCtx.save();
        tbCtx.fillStyle = '#0d2238';
        tbCtx.fillRect(m.x0, m.y0, m.w, m.h);
        tbCtx.strokeStyle = '#e2e8f0';
        tbCtx.lineWidth = 2.5;
        tbCtx.strokeRect(m.x0, m.y0, m.w, m.h);

        tbCtx.beginPath();
        tbCtx.rect(m.x0, m.y0, m.w, m.h);
        tbCtx.clip();

        const pxPerM = m.pxPerM;

        if (tbCourtMode === 'half') {
            const leftPostX = m.x0 + (10 - 1.5) * pxPerM;
            const rightPostX = m.x0 + (10 + 1.5) * pxPerM;

            tbCtx.beginPath();
            tbCtx.arc(leftPostX, m.y0, 6 * pxPerM, Math.PI, Math.PI / 2, true);
            tbCtx.lineTo(rightPostX, m.y0 + 6 * pxPerM);
            tbCtx.arc(rightPostX, m.y0, 6 * pxPerM, Math.PI / 2, 0, true);
            tbCtx.closePath();
            tbCtx.fillStyle = 'rgba(16, 185, 129, 0.14)';
            tbCtx.fill();
            tbCtx.lineWidth = 2;
            tbCtx.strokeStyle = '#34d399';
            tbCtx.stroke();

            tbCtx.beginPath();
            tbCtx.setLineDash([7, 6]);
            tbCtx.arc(leftPostX, m.y0, 9 * pxPerM, Math.PI, Math.PI / 2, true);
            tbCtx.lineTo(rightPostX, m.y0 + 9 * pxPerM);
            tbCtx.arc(rightPostX, m.y0, 9 * pxPerM, Math.PI / 2, 0, true);
            tbCtx.lineWidth = 1.8;
            tbCtx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
            tbCtx.stroke();
            tbCtx.setLineDash([]);

            tbCtx.beginPath();
            tbCtx.moveTo(m.x0 + 9.5 * pxPerM, m.y0 + 7 * pxPerM);
            tbCtx.lineTo(m.x0 + 10.5 * pxPerM, m.y0 + 7 * pxPerM);
            tbCtx.lineWidth = 2;
            tbCtx.strokeStyle = '#ffffff';
            tbCtx.stroke();

            tbCtx.fillStyle = '#ef4444';
            tbCtx.fillRect(leftPostX, m.y0, 3 * pxPerM, 5);

            const overlayMode = tbStatOverlay.value;
            if (overlayMode !== 'off') {
                const goalCenterX = m.x0 + 10 * pxPerM;
                const goalCenterY = m.y0;
                const SHOT_RESULTS = ['goal', 'save', 'miss'];

                historyLogs.forEach(item => {
                    if (item.team !== overlayMode) return;
                    if (!SHOT_RESULTS.includes(item.result)) return;
                    if (!item.point) return;

                    const sx = m.x0 + item.point.x * m.w;
                    const sy = m.y0 + item.point.y * m.h;

                    tbCtx.save();
                    tbCtx.setLineDash([4, 4]);
                    tbCtx.lineWidth = 1.3;
                    tbCtx.strokeStyle = item.result === 'goal'
                        ? 'rgba(56, 189, 248, 0.5)'
                        : 'rgba(251, 191, 36, 0.45)';
                    tbCtx.beginPath();
                    tbCtx.moveTo(sx, sy);
                    tbCtx.lineTo(goalCenterX, goalCenterY);
                    tbCtx.stroke();
                    tbCtx.restore();

                    tbCtx.beginPath();
                    tbCtx.arc(sx, sy, 5.5, 0, Math.PI * 2);
                    tbCtx.fillStyle = item.result === 'goal' ? '#38bdf8' : (item.result === 'save' ? '#fbbf24' : '#94a3b8');
                    tbCtx.fill();
                    tbCtx.lineWidth = 1.2;
                    tbCtx.strokeStyle = '#0f172a';
                    tbCtx.stroke();
                });
            }
        } else {
            const midX = m.x0 + m.w / 2;
            tbCtx.beginPath();
            tbCtx.moveTo(midX, m.y0);
            tbCtx.lineTo(midX, m.y0 + m.h);
            tbCtx.lineWidth = 2;
            tbCtx.strokeStyle = '#e2e8f0';
            tbCtx.stroke();

            const topPostY = m.y0 + (10 - 1.5) * pxPerM;
            const botPostY = m.y0 + (10 + 1.5) * pxPerM;

            tbCtx.beginPath();
            tbCtx.arc(m.x0, topPostY, 6 * pxPerM, -Math.PI / 2, 0, false);
            tbCtx.lineTo(m.x0 + 6 * pxPerM, botPostY);
            tbCtx.arc(m.x0, botPostY, 6 * pxPerM, 0, Math.PI / 2, false);
            tbCtx.closePath();
            tbCtx.fillStyle = 'rgba(16, 185, 129, 0.14)';
            tbCtx.fill();
            tbCtx.strokeStyle = '#34d399';
            tbCtx.stroke();

            tbCtx.beginPath();
            tbCtx.setLineDash([6, 6]);
            tbCtx.arc(m.x0, topPostY, 9 * pxPerM, -Math.PI / 2, 0, false);
            tbCtx.lineTo(m.x0 + 9 * pxPerM, botPostY);
            tbCtx.arc(m.x0, botPostY, 9 * pxPerM, 0, Math.PI / 2, false);
            tbCtx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
            tbCtx.stroke();

            tbCtx.setLineDash([]);
            tbCtx.beginPath();
            tbCtx.arc(m.x0 + m.w, topPostY, 6 * pxPerM, Math.PI, Math.PI * 1.5, false);
            tbCtx.arc(m.x0 + m.w, botPostY, 6 * pxPerM, Math.PI / 2, Math.PI, false);
            tbCtx.closePath();
            tbCtx.fillStyle = 'rgba(16, 185, 129, 0.14)';
            tbCtx.fill();
            tbCtx.strokeStyle = '#34d399';
            tbCtx.stroke();

            tbCtx.beginPath();
            tbCtx.setLineDash([6, 6]);
            tbCtx.arc(m.x0 + m.w, topPostY, 9 * pxPerM, Math.PI, Math.PI * 1.5, false);
            tbCtx.arc(m.x0 + m.w, botPostY, 9 * pxPerM, Math.PI / 2, Math.PI, false);
            tbCtx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
            tbCtx.stroke();
            tbCtx.setLineDash([]);
        }

        const allStrokes = activeStroke ? [...tbStrokes, activeStroke] : tbStrokes;
        allStrokes.forEach(st => {
            if (!st.points || st.points.length < 2) return;
            tbCtx.save();
            tbCtx.strokeStyle = st.color;
            tbCtx.fillStyle = st.color;
            tbCtx.lineWidth = 3;
            tbCtx.lineCap = 'round';
            tbCtx.lineJoin = 'round';
            if (st.type === 'dashed') tbCtx.setLineDash([8, 7]);

            tbCtx.beginPath();
            st.points.forEach((p, idx) => {
                const px = m.x0 + p.x * m.w;
                const py = m.y0 + p.y * m.h;
                if (idx === 0) tbCtx.moveTo(px, py);
                else tbCtx.lineTo(px, py);
            });
            tbCtx.stroke();

            if (st.type === 'arrow') {
                const pLast = st.points[st.points.length - 1];
                const pPrev = st.points[Math.max(0, st.points.length - 3)];
                const x2 = m.x0 + pLast.x * m.w;
                const y2 = m.y0 + pLast.y * m.h;
                const x1 = m.x0 + pPrev.x * m.w;
                const y1 = m.y0 + pPrev.y * m.h;
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const headLen = 13;

                tbCtx.setLineDash([]);
                tbCtx.beginPath();
                tbCtx.moveTo(x2, y2);
                tbCtx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
                tbCtx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
                tbCtx.closePath();
                tbCtx.fill();
            }
            tbCtx.restore();
        });

        const markersToDraw = animDisplayMarkers || tbMarkers;
        markersToDraw.forEach(mk => {
            const cx = m.x0 + mk.x * m.w;
            const cy = m.y0 + mk.y * m.h;

            if (mk.team === 'ball') {
                tbCtx.beginPath();
                tbCtx.arc(cx, cy, 9, 0, Math.PI * 2);
                tbCtx.fillStyle = '#facc15';
                tbCtx.fill();
                tbCtx.lineWidth = 2;
                tbCtx.strokeStyle = '#1e293b';
                tbCtx.stroke();
                return;
            }

            const radius = 15;
            tbCtx.beginPath();
            tbCtx.arc(cx, cy, radius, 0, Math.PI * 2);
            if (mk.isGk) {
                tbCtx.fillStyle = '#059669';
            } else {
                tbCtx.fillStyle = mk.team === 'own' ? '#2563eb' : '#e11d48';
            }
            tbCtx.fill();
            tbCtx.lineWidth = 2.2;
            tbCtx.strokeStyle = '#ffffff';
            tbCtx.stroke();

            tbCtx.fillStyle = '#ffffff';
            tbCtx.font = 'bold 12px sans-serif';
            tbCtx.textAlign = 'center';
            tbCtx.textBaseline = 'middle';
            tbCtx.fillText(mk.num, cx, cy);

            const pName = getPlayerDisplayName(mk.team, mk.num);
            if (pName) {
                tbCtx.font = 'bold 10px sans-serif';
                tbCtx.fillStyle = '#f8fafc';
                tbCtx.fillText(pName, cx, cy + radius + 9);
            }
        });

        tbCtx.restore();
    }

    tacticsCanvas.addEventListener('pointerdown', (e) => {
        stopKeyframeAnim();
        const m = getTacticsMetrics();
        const rect = tacticsCanvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const nx = Math.max(0.02, Math.min(0.98, (px - m.x0) / m.w));
        const ny = Math.max(0.02, Math.min(0.98, (py - m.y0) / m.h));

        tacticsCanvas.setPointerCapture(e.pointerId);

        if (tbTool === 'move') {
            for (let i = tbMarkers.length - 1; i >= 0; i--) {
                const mk = tbMarkers[i];
                const mx = m.x0 + mk.x * m.w;
                const my = m.y0 + mk.y * m.h;
                if (Math.hypot(px - mx, py - my) <= 24) {
                    draggingMarker = mk;
                    break;
                }
            }
        } else if (tbTool === 'erase') {
            tbStrokes = tbStrokes.filter(st => {
                return !st.points.some(pt => {
                    const sx = m.x0 + pt.x * m.w;
                    const sy = m.y0 + pt.y * m.h;
                    return Math.hypot(px - sx, py - sy) <= 18;
                });
            });
            saveAllData();
            renderTacticsBoard();
        } else {
            activeStroke = {
                type: tbTool,
                color: tbColor,
                points: [{ x: nx, y: ny }]
            };
            renderTacticsBoard();
        }
    });

    tacticsCanvas.addEventListener('pointermove', (e) => {
        if (!tacticsCanvas.hasPointerCapture(e.pointerId)) return;
        const m = getTacticsMetrics();
        const rect = tacticsCanvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const nx = Math.max(0.02, Math.min(0.98, (px - m.x0) / m.w));
        const ny = Math.max(0.02, Math.min(0.98, (py - m.y0) / m.h));

        if (tbTool === 'move' && draggingMarker) {
            draggingMarker.x = Number(nx.toFixed(4));
            draggingMarker.y = Number(ny.toFixed(4));
            renderTacticsBoard();
        } else if (tbTool === 'erase') {
            tbStrokes = tbStrokes.filter(st => {
                return !st.points.some(pt => {
                    const sx = m.x0 + pt.x * m.w;
                    const sy = m.y0 + pt.y * m.h;
                    return Math.hypot(px - sx, py - sy) <= 18;
                });
            });
            renderTacticsBoard();
        } else if (activeStroke) {
            activeStroke.points.push({ x: nx, y: ny });
            renderTacticsBoard();
        }
    });

    tacticsCanvas.addEventListener('pointerup', (e) => {
        if (tacticsCanvas.hasPointerCapture(e.pointerId)) {
            tacticsCanvas.releasePointerCapture(e.pointerId);
        }
        if (draggingMarker) {
            draggingMarker = null;
            saveAllData();
        }
        if (activeStroke) {
            if (activeStroke.points.length >= 2) {
                tbStrokes.push(activeStroke);
            }
            activeStroke = null;
            saveAllData();
            renderTacticsBoard();
        }
    });

    // ==========================================
    // タブ4：名簿・CSV出力・データ管理
    // ==========================================
    let activeRosterTeam = 'own';

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
                if (activeRosterTeam === currentTeam) buildJerseyGrid();
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
            return (str.includes(',') || str.includes('"') || str.includes('\n'))
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };

        const rows = historyLogs.map((item, idx) => {
            const teamName = item.team === 'own' ? '自チーム' : '相手チーム';
            const lane = item.point ? item.point.lane : '';
            const depth = item.point ? item.point.depth : '';
            const xM = item.point ? (item.point.x * COURT_WIDTH_M).toFixed(2) : '';
            const yM = item.point ? (item.point.y * 20.0).toFixed(2) : '';

            return [
                idx + 1, item.half || '前半', item.timeStr, teamName,
                item.player, item.playerName || '', item.resultLabel,
                item.zoneLabel || '', lane, depth,
                item.angleDeg ?? '', item.acuteAngleDeg ?? '', item.distM ?? '',
                xM, yM, item.courseLabel || ''
            ].map(escapeCsv).join(',');
        });

        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const oppClean = (matchInfo.opponent || '試合データ').replace(/[\\/:*?"<>|]/g, '_');
        const a = document.createElement('a');
        a.href = url;
        a.download = `STAT_${ymd}_${oppClean}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    btnResetMatch.addEventListener('click', () => {
        if (!window.confirm('現在のスコア・タイマー・プレイ記録をすべて消去して新しい試合を始めますか？（登録した選手名簿は残ります）')) return;

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
        renderShotCourt();
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
    resizeShotCanvas();

    window.addEventListener('resize', () => {
        if (activeTab === 'input') resizeShotCanvas();
        else if (activeTab === 'map') resizeAnalysisCanvas();
        else if (activeTab === 'tactics') resizeTacticsCanvas();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStatApp);
} else {
    initStatApp();
}
