document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 要素取得
    // ==========================================
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
    const btnUndo = document.getElementById('btn-undo');

    const timerDisplay = document.getElementById('timer-display');
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const scoreOwnEl = document.getElementById('score-own');
    const scoreOppEl = document.getElementById('score-opp');

    // ==========================================
    // 状態管理
    // ==========================================
    let currentTeam = 'own';       // 'own' | 'opp'
    let selectedPlayer = '1';      // '1'..'16' | 'GK'
    let selectedGoalCourse = null; // 'UL','UC','UR','ML','MC','MR','DL','DC','DR','post','block'
    let selectedQuickZone = null;  // '7m' | 'fastbreak' | 'empty'

    // コート上タップ情報（半面20m×20m基準の相対座標 x:0..1, y:0..1）
    // y=0 がゴールライン、y=0.30 が6mライン、y=0.45 が9mライン、y=0.575 が11.5m表示下端
    let shotPoint = null;          // { x, y, zone, angleDeg, distM }
    let historyLogs = [];
    let scoreOwn = 0;
    let scoreOpp = 0;

    // タイマー状態
    let elapsedSec = 0;
    let timerInterval = null;
    let isTimerRunning = false;

    // ゴール9分割ラベル（画面表示は「ゴール正面から見た左右」基準）
    const GOAL_ZONES = [
        { id: 'UL', label: '左上' }, { id: 'UC', label: '中上' }, { id: 'UR', label: '右上' },
        { id: 'ML', label: '左中' }, { id: 'MC', label: '中央' }, { id: 'MR', label: '右中' },
        { id: 'DL', label: '左下' }, { id: 'DC', label: '下中' }, { id: 'DR', label: '右下' }
    ];

    // ==========================================
    // 背番号グリッド初期化（1〜16）
    // ==========================================
    function buildJerseyGrid() {
        jerseyGrid.innerHTML = '';
        for (let i = 1; i <= 16; i++) {
            const numStr = String(i);
            const btn = document.createElement('button');
            btn.className = 'jersey-btn';
            btn.textContent = numStr;
            btn.dataset.num = numStr;
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
        const playerLabel = isGk ? 'GK' : `#${selectedPlayer}`;
        selectedPlayerBadge.textContent = `${teamLabel}: ${playerLabel}`;
    }

    btnSelectGk.addEventListener('click', () => {
        selectedPlayer = 'GK';
        updatePlayerSelectionUI();
    });

    teamBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentTeam = btn.dataset.team;
            teamBtns.forEach(b => b.classList.toggle('active', b === btn));
            updatePlayerSelectionUI();
        });
    });

    // ==========================================
    // ゴール9分割＆特殊コース初期化
    // ==========================================
    function buildGoalGrid() {
        // ゴール枠内を赤白枠線＋3x3グリッドで構成
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
    // 6m〜9m実測コート図（パターンA：LW・RWサイド重視）
    // 表示範囲：横 0〜20m（x: 0..1）、縦 0〜11.5m（y: 0..0.575）
    // ==========================================
    const MAX_VIEW_METERS_Y = 11.5;
    const COURT_WIDTH_M = 20.0;

    function resizeCourtCanvas() {
        const wrap = shotCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(240, Math.floor(rect.width));
        const h = Math.max(160, Math.floor(rect.height));
        shotCanvas.width = Math.floor(w * dpr);
        shotCanvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderCourt();
    }

    function getCourtMetrics() {
        const wrap = shotCanvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        const padX = 12;
        const padTop = 10;
        const padBottom = 10;
        const drawW = Math.max(180, rect.width - padX * 2);
        const drawH = Math.max(120, rect.height - padTop - padBottom);
        return {
            viewW: rect.width,
            viewH: rect.height,
            x0: padX,
            y0: padTop,
            w: drawW,
            h: drawH
        };
    }

    // 半面20m×20mの相対座標 (x:0..1, y:0..1) から canvasピクセルへ変換
    function normToCanvas(m, nx, ny) {
        return {
            cx: m.x0 + nx * m.w,
            cy: m.y0 + (ny / (MAX_VIEW_METERS_Y / 20.0)) * m.h
        };
    }

    // canvasピクセルから半面20m×20mの相対座標 (x:0..1, y:0..1) へ逆変換
    function canvasToNorm(m, cx, cy) {
        const nx = Math.max(0, Math.min(1, (cx - m.x0) / m.w));
        const ny = Math.max(0.01, Math.min(MAX_VIEW_METERS_Y / 20.0, ((cy - m.y0) / m.h) * (MAX_VIEW_METERS_Y / 20.0)));
        return { nx, ny };
    }

    // パターンA（LW・RWサイド重視）：
    // ゴール中央(x=0.5, y=0)からの角度・メートル距離・サイドレーンでエリアを判定
    function classifyShotArea(nx, ny) {
        const xMeters = nx * COURT_WIDTH_M; // 0..20m
        const yMeters = ny * 20.0;           // 0..11.5m
        const dxCenter = xMeters - 10.0;     // ゴール中心からの左右オフセット(-10..+10m)
        const distM = Math.hypot(dxCenter, yMeters);

        // ゴール中心(10, 0)を原点とし、左サイド=0°、正面=90°、右サイド=180°
        const radFromLeft = Math.atan2(yMeters, xMeters);
        const angleDeg = Math.round((radFromLeft * 180) / Math.PI);

        // パターンA：サイドライン際〜外側ゾーン（|dx| > 5.8m または y < 3.5m かつ |dx| > 4.2m）を LW / RW として広く確保
        let lane = 'CB';
        if (dxCenter < -5.8 || (yMeters < 3.6 && dxCenter < -4.2)) {
            lane = 'LW';
        } else if (dxCenter > 5.8 || (yMeters < 3.6 && dxCenter > 4.2)) {
            lane = 'RW';
        } else if (dxCenter < -2.1) {
            lane = 'LB';
        } else if (dxCenter > 2.1) {
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
        telemetryAngle.textContent = `角度: ${shotPoint.angleDeg}°`;
        telemetryDist.textContent = `距離: ${shotPoint.distM.toFixed(1)}m`;
    }

    function renderCourt() {
        const m = getCourtMetrics();
        ctx.clearRect(0, 0, m.viewW, m.viewH);

        // コート背景
        ctx.save();
        ctx.fillStyle = '#0c182c';
        ctx.fillRect(m.x0, m.y0, m.w, m.h);

        ctx.beginPath();
        ctx.rect(m.x0, m.y0, m.w, m.h);
        ctx.clip();

        // パターンA：LW / RW サイドゾーンをうっすら色分けして視認性アップ
        const lwW = m.w * 0.21;
        const rwX = m.x0 + m.w * 0.79;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
        ctx.fillRect(m.x0, m.y0, lwW, m.h);
        ctx.fillRect(rwX, m.y0, m.w * 0.21, m.h);

        // 1m = pxPerM
        const pxPerM = m.w / COURT_WIDTH_M;
        const goalCenter = normToCanvas(m, 0.5, 0);
        const leftPost = normToCanvas(m, 0.5 - 1.5 / 20, 0);
        const rightPost = normToCanvas(m, 0.5 + 1.5 / 20, 0);

        // 6mゴールエリア（塗りつぶし＋実線）
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

        // 9mフリースローライン（点線）
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

        // パターンA 境界ガイド線（LW/LB、LB/CB、CB/RB、RB/RW）
        ctx.save();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.2;

        // LW / LB 境界（ゴール中心から左5.8m付近）
        const lwBoundTop = normToCanvas(m, (10 - 4.2) / 20, 3.6 / 20);
        const lwBoundBot = normToCanvas(m, (10 - 5.8) / 20, MAX_VIEW_METERS_Y / 20);
        ctx.beginPath();
        ctx.moveTo(lwBoundTop.cx, lwBoundTop.cy);
        ctx.lineTo(lwBoundBot.cx, lwBoundBot.cy);
        ctx.stroke();

        // RW / RB 境界（ゴール中心から右5.8m付近）
        const rwBoundTop = normToCanvas(m, (10 + 4.2) / 20, 3.6 / 20);
        const rwBoundBot = normToCanvas(m, (10 + 5.8) / 20, MAX_VIEW_METERS_Y / 20);
        ctx.beginPath();
        ctx.moveTo(rwBoundTop.cx, rwBoundTop.cy);
        ctx.lineTo(rwBoundBot.cx, rwBoundBot.cy);
        ctx.stroke();

        // LB / CB ＆ CB / RB 境界
        const lbcbBot = normToCanvas(m, (10 - 2.1) / 20, MAX_VIEW_METERS_Y / 20);
        const cbrbBot = normToCanvas(m, (10 + 2.1) / 20, MAX_VIEW_METERS_Y / 20);
        ctx.beginPath();
        ctx.moveTo(leftPost.cx, leftPost.cy + 6 * pxPerM);
        ctx.lineTo(lbcbBot.cx, lbcbBot.cy);
        ctx.moveTo(rightPost.cx, rightPost.cy + 6 * pxPerM);
        ctx.lineTo(cbrbBot.cx, cbrbBot.cy);
        ctx.stroke();
        ctx.restore();

        // レーンラベル描画（LWを左サイド際、RWを右サイド際に配置）
        ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LW', m.x0 + m.w * 0.08, m.y0 + m.h * 0.62);
        ctx.fillText('LB', m.x0 + m.w * 0.29, m.y0 + m.h * 0.84);
        ctx.fillText('CB', m.x0 + m.w * 0.50, m.y0 + m.h * 0.84);
        ctx.fillText('RB', m.x0 + m.w * 0.71, m.y0 + m.h * 0.84);
        ctx.fillText('RW', m.x0 + m.w * 0.92, m.y0 + m.h * 0.62);

        // 距離ラベル（6m / 9m）
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('6m', m.x0 + m.w - 6, m.y0 + (6 / MAX_VIEW_METERS_Y) * m.h - 4);
        ctx.fillText('9m', m.x0 + m.w - 6, m.y0 + (9 / MAX_VIEW_METERS_Y) * m.h - 4);

        // 過去の記録マーカーを薄くプロット
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

        // 現在選択中の打点とゴールへの角度ガイド線
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
    // タイマー＆記録・Undo処理
    // ==========================================
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
        } else {
            isTimerRunning = true;
            btnTimerToggle.textContent = '❚❚';
            btnTimerToggle.classList.add('running');
            timerInterval = setInterval(() => {
                elapsedSec++;
                timerDisplay.textContent = formatTimer(elapsedSec);
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
        if (historyLogs.length === 0) {
            playLogList.innerHTML = '<li class="log-empty">まだ記録がありません</li>';
            return;
        }

        playLogList.innerHTML = '';
        // 新しい記録を上に表示
        [...historyLogs].reverse().forEach(item => {
            const li = document.createElement('li');
            li.className = `log-item ${item.team === 'opp' ? 'opp' : ''}`;

            const top = document.createElement('div');
            top.className = 'log-item-top';
            const teamTag = item.team === 'own' ? '自' : '相';
            const pTag = item.player === 'GK' ? 'GK' : `#${item.player}`;
            top.textContent = `${item.timeStr} [${teamTag}] ${pTag} ${item.resultLabel}`;

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
            if (selectedQuickZone) {
                const qMap = { '7m': '7mスロー', 'fastbreak': '速攻(FB)', 'empty': 'エンプティ' };
                zoneLabel = qMap[selectedQuickZone] || selectedQuickZone;
            } else if (shotPoint) {
                zoneLabel = shotPoint.zone;
                angleDeg = shotPoint.angleDeg;
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
                timeStr: formatTimer(elapsedSec),
                team: currentTeam,
                player: selectedPlayer,
                result: resultKey,
                resultLabel,
                zoneLabel,
                angleDeg,
                courseLabel,
                point: shotPoint ? { ...shotPoint } : null
            };

            historyLogs.push(entry);
            renderHistoryUI();
            renderCourt();

            // 次の入力に備えてシュート打点・コース選択だけをリセット（選手とチームは維持）
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
    });

    // ==========================================
    // 初期化＆リサイズ追従
    // ==========================================
    buildJerseyGrid();
    buildGoalGrid();
    updateTelemetryUI();
    updateScoreUI();
    renderHistoryUI();
    resizeCourtCanvas();

    window.addEventListener('resize', () => {
        resizeCourtCanvas();
    });
});
