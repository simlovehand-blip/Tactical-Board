document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tactics-canvas');
    const ctx = canvas.getContext('2d');

    // UI要素
    const btnRecord = document.getElementById('btn-record');
    const recLabel = document.getElementById('rec-label');
    const btnReset = document.getElementById('btn-reset');
    const btnToggleOpp = document.getElementById('btn-toggle-opp');
    const playNameInput = document.getElementById('play-name-input');
    const settingsSubtitle = document.getElementById('settings-subtitle');
    const courtModeBtns = document.querySelectorAll('#court-mode-btns .toggle-btn');
    const offCountBtns = document.querySelectorAll('#off-count-btns .num-btn');
    const defCountBtns = document.querySelectorAll('#def-count-btns .num-btn');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const btnUndoDraw = document.getElementById('btn-undo-draw');
    const btnClearDraw = document.getElementById('btn-clear-draw');
    const videoResultBox = document.getElementById('video-result-box');
    const recordedVideo = document.getElementById('recorded-video');
    const btnDownloadVideo = document.getElementById('btn-download-video');
    const btnCloseVideo = document.getElementById('btn-close-video');

    // ==========================================
    // アプリ状態管理
    // ==========================================
    let courtMode = 'half'; // 'half' | 'full'
    let offCount = 6;
    let defCount = 6;
    let showOpponent = true;
    let activeTool = 'move'; // 'move' | 'arrow' | 'pass' | 'pen'

    // 描画データ（コート内の相対座標 0〜1 で保持）
    let drawings = [];
    let currentDrawing = null;

    // ドラッグ状態
    let draggedItem = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // 録画状態
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;
    let recordStartTime = 0;
    let recordTimerId = null;
    let recordAnimFrame = null;
    let lastVideoUrl = null;

    // ==========================================
    // 初期ポジション定義（コート幅・高さに対する 0.0〜1.0 比率）
    // ==========================================
    function getDefaultHalfState() {
        return {
            players: [
                // 攻撃（青）1〜7
                { id: 'off-1', team: 'off', num: 1, label: '1', x: 0.06, y: 0.08 },
                { id: 'off-2', team: 'off', num: 2, label: '2', x: 0.16, y: 0.56 },
                { id: 'off-3', team: 'off', num: 3, label: '3', x: 0.50, y: 0.70 },
                { id: 'off-4', team: 'off', num: 4, label: '4', x: 0.84, y: 0.56 },
                { id: 'off-5', team: 'off', num: 5, label: '5', x: 0.94, y: 0.08 },
                { id: 'off-6', team: 'off', num: 6, label: '6', x: 0.50, y: 0.36 },
                { id: 'off-7', team: 'off', num: 7, label: '7', x: 0.33, y: 0.36 },
                // 守備（赤）1〜6
                { id: 'def-1', team: 'def', num: 1, label: '1', x: 0.16, y: 0.20 },
                { id: 'def-2', team: 'def', num: 2, label: '2', x: 0.27, y: 0.31 },
                { id: 'def-3', team: 'def', num: 3, label: '3', x: 0.40, y: 0.35 },
                { id: 'def-4', team: 'def', num: 4, label: '4', x: 0.60, y: 0.35 },
                { id: 'def-5', team: 'def', num: 5, label: '5', x: 0.73, y: 0.31 },
                { id: 'def-6', team: 'def', num: 6, label: '6', x: 0.84, y: 0.20 },
                // 相手GK（緑）
                { id: 'gk-def', team: 'gk-def', num: 0, label: 'GK', x: 0.50, y: 0.10 }
            ],
            ball: { x: 0.56, y: 0.72 }
        };
    }

    function getDefaultFullState() {
        return {
            players: [
                // 攻撃（青：左→右へ攻める配置）
                { id: 'off-1', team: 'off', num: 1, label: '1', x: 0.92, y: 0.08 },
                { id: 'off-2', team: 'off', num: 2, label: '2', x: 0.69, y: 0.20 },
                { id: 'off-3', team: 'off', num: 3, label: '3', x: 0.62, y: 0.50 },
                { id: 'off-4', team: 'off', num: 4, label: '4', x: 0.69, y: 0.80 },
                { id: 'off-5', team: 'off', num: 5, label: '5', x: 0.92, y: 0.92 },
                { id: 'off-6', team: 'off', num: 6, label: '6', x: 0.81, y: 0.50 },
                { id: 'off-7', team: 'off', num: 7, label: '7', x: 0.81, y: 0.33 },
                // 自チームGK（全面時・6人以下の攻撃時に表示）
                { id: 'gk-off', team: 'gk-off', num: 0, label: 'GK', x: 0.06, y: 0.50 },
                // 守備（赤）
                { id: 'def-1', team: 'def', num: 1, label: '1', x: 0.89, y: 0.19 },
                { id: 'def-2', team: 'def', num: 2, label: '2', x: 0.84, y: 0.30 },
                { id: 'def-3', team: 'def', num: 3, label: '3', x: 0.82, y: 0.42 },
                { id: 'def-4', team: 'def', num: 4, label: '4', x: 0.82, y: 0.58 },
                { id: 'def-5', team: 'def', num: 5, label: '5', x: 0.84, y: 0.70 },
                { id: 'def-6', team: 'def', num: 6, label: '6', x: 0.89, y: 0.81 },
                // 相手GK（緑）
                { id: 'gk-def', team: 'gk-def', num: 0, label: 'GK', x: 0.94, y: 0.50 }
            ],
            ball: { x: 0.60, y: 0.56 }
        };
    }

    let state = getDefaultHalfState();

    // ==========================================
    // キャンバス寸法・コート矩形計算
    // ==========================================
    function getLayout() {
        if (courtMode === 'half') {
            return {
                width: 760,
                height: 780,
                courtX: 40,
                courtY: 64,
                courtW: 680,
                courtH: 680,
                playerRadius: 23,
                ballRadius: 11
            };
        } else {
            return {
                width: 1040,
                height: 580,
                courtX: 40,
                courtY: 64,
                courtW: 960,
                courtH: 480,
                playerRadius: 18,
                ballRadius: 9
            };
        }
    }

    function setupCanvasSize() {
        const layout = getLayout();
        canvas.width = layout.width;
        canvas.height = layout.height;
    }

    // プレイヤー表示判定
    function isPlayerVisible(p) {
        if (p.team === 'off') return p.num <= offCount;
        if (p.team === 'def') return showOpponent && p.num <= defCount;
        if (p.team === 'gk-def') return showOpponent;
        if (p.team === 'gk-off') return courtMode === 'full' && offCount < 7;
        return true;
    }

    // ==========================================
    // 描画処理（コート・線・コマ・ボール・タイトル）
    // ==========================================
    function render() {
        const L = getLayout();

        // 1. 全体背景
        ctx.fillStyle = '#09111f';
        ctx.fillRect(0, 0, L.width, L.height);

        // 2. サインプレー名タイトルバー（動画にもそのまま記録されます）
        const playName = playNameInput.value.trim();
        ctx.save();
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = playName ? '#f8fafc' : '#475569';
        ctx.fillText(playName || 'Zero-Step Tactics', L.courtX, 34);

        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748b';
        const modeText = `${courtMode === 'half' ? '半面' : '全面'}・${offCount}対${defCount}`;
        ctx.fillText(modeText, L.courtX + L.courtW, 34);
        ctx.restore();

        // 3. ハンドボールコート描画（国際規格の比率に準拠）
        drawCourt(L);

        // 4. ユーザーが引いた線・矢印を描画
        drawAllAnnotations(L);

        // 5. ボールに最も近い選手を判定（黄色の所持リング表示用）
        const bx = L.courtX + state.ball.x * L.courtW;
        const by = L.courtY + state.ball.y * L.courtH;
        let holder = null;
        let minDist = L.playerRadius * 2.7;

        state.players.forEach(p => {
            if (!isPlayerVisible(p)) return;
            const px = L.courtX + p.x * L.courtW;
            const py = L.courtY + p.y * L.courtH;
            const d = Math.hypot(bx - px, by - py);
            if (d < minDist) {
                minDist = d;
                holder = p;
            }
        });

        // 6. 選手コマ描画
        state.players.forEach(p => {
            if (!isPlayerVisible(p)) return;
            drawPlayer(L, p, holder && holder.id === p.id);
        });

        // 7. ボール描画
        drawBall(L, bx, by);
    }

    function drawCourt(L) {
        const { courtX, courtY, courtW, courtH } = L;

        // コート面ベース
        ctx.save();
        ctx.fillStyle = '#0d1a2d';
        ctx.fillRect(courtX, courtY, courtW, courtH);

        // クリップ領域（9m線がコート外にはみ出さないようにする）
        ctx.beginPath();
        ctx.rect(courtX, courtY, courtW, courtH);
        ctx.clip();

        if (courtMode === 'half') {
            // 20m × 20m の半面（1m = courtW / 20）
            const s = courtW / 20;
            const cx = courtX + courtW / 2;
            const leftPost = cx - 1.5 * s;
            const rightPost = cx + 1.5 * s;

            // 6mゴールエリア塗りつぶし＆ライン
            ctx.beginPath();
            ctx.arc(leftPost, courtY, 6 * s, Math.PI, Math.PI / 2, true);
            ctx.lineTo(rightPost, courtY + 6 * s);
            ctx.arc(rightPost, courtY, 6 * s, Math.PI / 2, 0, true);
            ctx.closePath();
            ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#34d399';
            ctx.stroke();

            // 9mフリースローライン（点線）
            ctx.beginPath();
            ctx.setLineDash([10, 8]);
            ctx.arc(leftPost, courtY, 9 * s, Math.PI, Math.PI / 2, true);
            ctx.lineTo(rightPost, courtY + 9 * s);
            ctx.arc(rightPost, courtY, 9 * s, Math.PI / 2, 0, true);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
            ctx.stroke();
            ctx.setLineDash([]);

            // 4m GKライン
            ctx.beginPath();
            ctx.moveTo(cx - 0.35 * s, courtY + 4 * s);
            ctx.lineTo(cx + 0.35 * s, courtY + 4 * s);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
            ctx.stroke();

            // 7mスローライン
            ctx.beginPath();
            ctx.moveTo(cx - 0.6 * s, courtY + 7 * s);
            ctx.lineTo(cx + 0.6 * s, courtY + 7 * s);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#e2e8f0';
            ctx.stroke();
        } else {
            // 40m × 20m の全面（1m = courtW / 40）
            const s = courtW / 40;
            const cy = courtY + courtH / 2;
            const topPost = cy - 1.5 * s;
            const botPost = cy + 1.5 * s;
            const rightX = courtX + courtW;

            // センターライン
            ctx.beginPath();
            ctx.moveTo(courtX + courtW / 2, courtY);
            ctx.lineTo(courtX + courtW / 2, courtY + courtH);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
            ctx.stroke();

            // 交代ライン（下部サイドライン側 4.5m）
            ctx.beginPath();
            ctx.moveTo(courtX + courtW / 2 - 4.5 * s, courtY + courtH - 8);
            ctx.lineTo(courtX + courtW / 2 - 4.5 * s, courtY + courtH);
            ctx.moveTo(courtX + courtW / 2 + 4.5 * s, courtY + courtH - 8);
            ctx.lineTo(courtX + courtW / 2 + 4.5 * s, courtY + courtH);
            ctx.stroke();

            // 左右の6m・9m・7m・4mラインを描画
            ['left', 'right'].forEach(side => {
                const isLeft = side === 'left';
                const gx = isLeft ? courtX : rightX;
                const dir = isLeft ? 1 : -1;

                // 6mエリア
                ctx.beginPath();
                if (isLeft) {
                    ctx.arc(gx, topPost, 6 * s, -Math.PI / 2, 0, false);
                    ctx.lineTo(gx + 6 * s, botPost);
                    ctx.arc(gx, botPost, 6 * s, 0, Math.PI / 2, false);
                } else {
                    ctx.arc(gx, botPost, 6 * s, Math.PI / 2, Math.PI, false);
                    ctx.lineTo(gx - 6 * s, topPost);
                    ctx.arc(gx, topPost, 6 * s, Math.PI, Math.PI * 1.5, false);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
                ctx.fill();
                ctx.lineWidth = 2.2;
                ctx.strokeStyle = '#34d399';
                ctx.stroke();

                // 9mライン
                ctx.beginPath();
                ctx.setLineDash([8, 6]);
                if (isLeft) {
                    ctx.arc(gx, topPost, 9 * s, -Math.PI / 2, 0, false);
                    ctx.lineTo(gx + 9 * s, botPost);
                    ctx.arc(gx, botPost, 9 * s, 0, Math.PI / 2, false);
                } else {
                    ctx.arc(gx, botPost, 9 * s, Math.PI / 2, Math.PI, false);
                    ctx.lineTo(gx - 9 * s, topPost);
                    ctx.arc(gx, topPost, 9 * s, Math.PI, Math.PI * 1.5, false);
                }
                ctx.lineWidth = 1.8;
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
                ctx.stroke();
                ctx.setLineDash([]);

                // 4mライン
                ctx.beginPath();
                ctx.moveTo(gx + dir * 4 * s, cy - 0.35 * s);
                ctx.lineTo(gx + dir * 4 * s, cy + 0.35 * s);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
                ctx.stroke();

                // 7mライン
                ctx.beginPath();
                ctx.moveTo(gx + dir * 7 * s, cy - 0.6 * s);
                ctx.lineTo(gx + dir * 7 * s, cy + 0.6 * s);
                ctx.lineWidth = 2.2;
                ctx.strokeStyle = '#e2e8f0';
                ctx.stroke();
            });
        }
        ctx.restore();

        // 外枠ライン（ネオングリーン風）
        ctx.save();
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(52, 211, 153, 0.45)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(courtX, courtY, courtW, courtH);
        ctx.restore();

        // ゴール枠（赤）
        ctx.save();
        ctx.fillStyle = '#ef4444';
        if (courtMode === 'half') {
            const s = courtW / 20;
            const cx = courtX + courtW / 2;
            ctx.fillRect(cx - 1.5 * s, courtY - 10, 3 * s, 12);
        } else {
            const s = courtW / 40;
            const cy = courtY + courtH / 2;
            ctx.fillRect(courtX - 10, cy - 1.5 * s, 12, 3 * s);
            ctx.fillRect(courtX + courtW - 2, cy - 1.5 * s, 12, 3 * s);
        }
        ctx.restore();
    }

    function drawPlayer(L, p, isBallHolder) {
        const px = L.courtX + p.x * L.courtW;
        const py = L.courtY + p.y * L.courtH;
        const r = L.playerRadius;

        // ボール保持者の黄色いリング
        if (isBallHolder) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(px, py, r + 9, 0, Math.PI * 2);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.restore();
        }

        // チームカラー
        let fill = '#3b82f6';
        let border = '#93c5fd';
        let glow = 'rgba(59, 130, 246, 0.55)';
        if (p.team === 'def') {
            fill = '#e11d48';
            border = '#fda4af';
            glow = 'rgba(225, 29, 72, 0.55)';
        } else if (p.team === 'gk-def' || p.team === 'gk-off') {
            fill = p.team === 'gk-def' ? '#10b981' : '#0ea5e9';
            border = '#a7f3d0';
            glow = 'rgba(16, 185, 129, 0.55)';
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = border;
        ctx.stroke();

        // 背番号 / GK文字
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${p.label === 'GK' ? Math.round(r * 0.72) : Math.round(r * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, px, py + 1);
        ctx.restore();
    }

    function drawBall(L, bx, by) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, L.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
    }

    function drawAllAnnotations(L) {
        const list = currentDrawing ? [...drawings, currentDrawing] : drawings;
        list.forEach(item => {
            if (!item.points || item.points.length < 2) return;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (item.type === 'pen') {
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                item.points.forEach((pt, idx) => {
                    const x = L.courtX + pt.x * L.courtW;
                    const y = L.courtY + pt.y * L.courtH;
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            } else {
                const start = item.points[0];
                const end = item.points[item.points.length - 1];
                const x1 = L.courtX + start.x * L.courtW;
                const y1 = L.courtY + start.y * L.courtH;
                const x2 = L.courtX + end.x * L.courtW;
                const y2 = L.courtY + end.y * L.courtH;

                const isPass = item.type === 'pass';
                ctx.strokeStyle = isPass ? '#38bdf8' : '#fde047';
                ctx.fillStyle = isPass ? '#38bdf8' : '#fde047';
                ctx.lineWidth = 3.5;
                if (isPass) ctx.setLineDash([10, 8]);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.setLineDash([]);

                // 矢印の先端
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const headLen = 15;
                if (Math.hypot(x2 - x1, y2 - y1) > 10) {
                    ctx.beginPath();
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        });
    }

    // ==========================================
    // ポインター操作（コマ移動 & ペン／矢印描画）
    // ==========================================
    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    canvas.addEventListener('pointerdown', (e) => {
        const L = getLayout();
        const pos = getCanvasPos(e);
        canvas.setPointerCapture(e.pointerId);

        if (activeTool === 'move') {
            // 1. まずボールの当たり判定（指で掴みやすいよう広めに設定）
            const bx = L.courtX + state.ball.x * L.courtW;
            const by = L.courtY + state.ball.y * L.courtH;
            if (Math.hypot(pos.x - bx, pos.y - by) <= L.ballRadius + 14) {
                draggedItem = state.ball;
                dragOffsetX = pos.x - bx;
                dragOffsetY = pos.y - by;
                return;
            }

            // 2. 選手の当たり判定（手前に描かれている順）
            for (let i = state.players.length - 1; i >= 0; i--) {
                const p = state.players[i];
                if (!isPlayerVisible(p)) continue;
                const px = L.courtX + p.x * L.courtW;
                const py = L.courtY + p.y * L.courtH;
                if (Math.hypot(pos.x - px, pos.y - py) <= L.playerRadius + 8) {
                    draggedItem = p;
                    dragOffsetX = pos.x - px;
                    dragOffsetY = pos.y - py;
                    return;
                }
            }
        } else {
            // 描画モード
            const relX = Math.max(0, Math.min(1, (pos.x - L.courtX) / L.courtW));
            const relY = Math.max(0, Math.min(1, (pos.y - L.courtY) / L.courtH));
            currentDrawing = {
                type: activeTool,
                points: [{ x: relX, y: relY }, { x: relX, y: relY }]
            };
            render();
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!draggedItem && !currentDrawing) return;
        const L = getLayout();
        const pos = getCanvasPos(e);

        if (draggedItem) {
            const newX = pos.x - dragOffsetX;
            const newY = pos.y - dragOffsetY;
            draggedItem.x = Math.max(0.02, Math.min(0.98, (newX - L.courtX) / L.courtW));
            draggedItem.y = Math.max(0.02, Math.min(0.98, (newY - L.courtY) / L.courtH));
            render();
        } else if (currentDrawing) {
            const relX = Math.max(0, Math.min(1, (pos.x - L.courtX) / L.courtW));
            const relY = Math.max(0, Math.min(1, (pos.y - L.courtY) / L.courtH));
            if (currentDrawing.type === 'pen') {
                currentDrawing.points.push({ x: relX, y: relY });
            } else {
                currentDrawing.points[1] = { x: relX, y: relY };
            }
            render();
        }
    });

    function finishPointer(e) {
        if (draggedItem) {
            draggedItem = null;
        }
        if (currentDrawing) {
            const p0 = currentDrawing.points[0];
            const pLast = currentDrawing.points[currentDrawing.points.length - 1];
            if (Math.hypot(pLast.x - p0.x, pLast.y - p0.y) > 0.01) {
                drawings.push(currentDrawing);
            }
            currentDrawing = null;
            render();
        }
        if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
    }

    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);

    // ==========================================
    // 動画録画機能（MediaRecorder API）
    // ==========================================
    function getSupportedMimeType() {
        const candidates = [
            'video/mp4;codecs=avc1.42E01E',
            'video/mp4',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];
        if (typeof MediaRecorder === 'undefined') return '';
        return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }

    function startRecording() {
        if (!canvas.captureStream || typeof MediaRecorder === 'undefined') {
            alert('お使いのブラウザは動画録画機能に対応していません。Chrome・Edge・最新のSafariをお試しください。');
            return;
        }

        const mimeType = getSupportedMimeType();
        const stream = canvas.captureStream(30);
        recordedChunks = [];

        try {
            mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 })
                : new MediaRecorder(stream);
        } catch (err) {
            alert('録画の開始に失敗しました: ' + err.message);
            return;
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const actualType = mediaRecorder.mimeType || mimeType || 'video/webm';
            const ext = actualType.includes('mp4') ? 'mp4' : 'webm';
            const blob = new Blob(recordedChunks, { type: actualType });

            if (lastVideoUrl) URL.revokeObjectURL(lastVideoUrl);
            lastVideoUrl = URL.createObjectURL(blob);

            const baseName = playNameInput.value.trim().replace(/[\\/:*?"<>|]/g, '_') || 'ZeroStep_Tactics';
            const fileName = `${baseName}.${ext}`;

            recordedVideo.src = lastVideoUrl;
            btnDownloadVideo.href = lastVideoUrl;
            btnDownloadVideo.download = fileName;
            videoResultBox.style.display = 'flex';
        };

        mediaRecorder.start(200);
        isRecording = true;
        recordStartTime = Date.now();
        btnRecord.classList.add('recording');
        recLabel.textContent = '録画停止 (00:00)';

        // 録画中は半面／全面の切り替え（キャンバス寸法変更）をロック
        courtModeBtns.forEach(b => b.disabled = true);

        recordTimerId = setInterval(() => {
            const sec = Math.floor((Date.now() - recordStartTime) / 1000);
            const mm = String(Math.floor(sec / 60)).padStart(2, '0');
            const ss = String(sec % 60).padStart(2, '0');
            recLabel.textContent = `録画停止 (${mm}:${ss})`;
        }, 500);

        // 録画中は静止時もフレームを流し続ける
        function pumpFrames() {
            if (!isRecording) return;
            render();
            recordAnimFrame = requestAnimationFrame(pumpFrames);
        }
        pumpFrames();
    }

    function stopRecording() {
        if (!isRecording || !mediaRecorder) return;
        isRecording = false;
        clearInterval(recordTimerId);
        cancelAnimationFrame(recordAnimFrame);
        mediaRecorder.stop();

        btnRecord.classList.remove('recording');
        recLabel.textContent = '動きを録画する';
        courtModeBtns.forEach(b => b.disabled = false);
    }

    btnRecord.addEventListener('click', () => {
        if (isRecording) stopRecording();
        else startRecording();
    });

    btnCloseVideo.addEventListener('click', () => {
        videoResultBox.style.display = 'none';
    });

    // ==========================================
    // コントロールパネル操作
    // ==========================================
    function updateSubtitle() {
        const modeLabel = courtMode === 'half' ? '半面' : '全面';
        settingsSubtitle.textContent = `${modeLabel}・${offCount}対${defCount}`;
    }

    // 配置リセット
    btnReset.addEventListener('click', () => {
        state = courtMode === 'half' ? getDefaultHalfState() : getDefaultFullState();
        drawings = [];
        render();
    });

    // 半面 / 全面 切り替え
    courtModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRecording) return;
            const nextMode = btn.dataset.mode;
            if (nextMode === courtMode) return;
            courtMode = nextMode;
            courtModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state = courtMode === 'half' ? getDefaultHalfState() : getDefaultFullState();
            drawings = [];
            setupCanvasSize();
            updateSubtitle();
            render();
        });
    });

    // 攻撃人数
    offCountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            offCountBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            offCount = parseInt(btn.dataset.count, 10);
            updateSubtitle();
            render();
        });
    });

    // 守備人数
    defCountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            defCountBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            defCount = parseInt(btn.dataset.count, 10);
            updateSubtitle();
            render();
        });
    });

    // 相手チーム表示切替
    btnToggleOpp.addEventListener('click', () => {
        showOpponent = !showOpponent;
        btnToggleOpp.textContent = showOpponent ? '表示中' : '非表示';
        btnToggleOpp.classList.toggle('active', showOpponent);
        render();
    });

    // サインプレー名のリアルタイム反映
    playNameInput.addEventListener('input', () => render());

    // 描画ツール切り替え
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTool = btn.dataset.tool;
            canvas.classList.toggle('drawing-mode', activeTool !== 'move');
        });
    });

    btnUndoDraw.addEventListener('click', () => {
        if (drawings.length > 0) {
            drawings.pop();
            render();
        }
    });

    btnClearDraw.addEventListener('click', () => {
        drawings = [];
        render();
    });

    // 初回描画
    setupCanvasSize();
    updateSubtitle();
    render();
});
