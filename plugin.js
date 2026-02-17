class Plugin {
    constructor(workspace) {
        this.workspace = workspace;
        this.btnContainer = null;
        this.modalContainer = null;
        this.consoleContainer = null;
        this.fileManagerContainer = null;
        this.styleElement = null;
        this.DEFAULT_BASE_URL = "https://cloud.keitodaze.net";
        this.currentFileId = null;
        this.currentProcessId = null;
        this.logInterval = null;
        this._lastLogContent = null;
    }

    async onload() {
        console.log("KEITO Cloud Deployer v3.0.0 Loaded!");
        this.applyStyles();
        this.createUI();
        this.createSettingsModal();
        this.createConsolePanel();
        this.createFileManagerPanel();
    }

    async onunload() {
        console.log("KEITO Cloud Deployer Unloaded");
        this.stopLogPolling();
        if (this.btnContainer) this.btnContainer.remove();
        if (this.modalContainer) this.modalContainer.remove();
        if (this.consoleContainer) this.consoleContainer.remove();
        if (this.fileManagerContainer) this.fileManagerContainer.remove();
        if (this.styleElement) this.styleElement.remove();
    }

    // ═══════════════════════════════════════
    //  Material 3 Light Green スタイル
    // ═══════════════════════════════════════
    applyStyles() {
        if (this.styleElement) return;
        const css = `
            /* ── Material 3 Token ── */
            :root {
                --kc-primary: #4d6b3a;
                --kc-on-primary: #ffffff;
                --kc-primary-container: #cef3ad;
                --kc-on-primary-container: #0e2000;
                --kc-secondary: #56624b;
                --kc-on-secondary: #ffffff;
                --kc-secondary-container: #d9e7ca;
                --kc-on-secondary-container: #141e0c;
                --kc-tertiary: #386666;
                --kc-surface: #f9faf3;
                --kc-surface-dim: #dadbd4;
                --kc-surface-container: #edeee8;
                --kc-surface-container-low: #f3f4ed;
                --kc-surface-container-high: #e8e9e2;
                --kc-surface-container-highest: #e2e3dc;
                --kc-on-surface: #1a1c18;
                --kc-on-surface-variant: #44483e;
                --kc-outline: #74796d;
                --kc-outline-variant: #c4c8ba;
                --kc-error: #ba1a1a;
                --kc-error-container: #ffdad6;
                --kc-shadow: rgba(0,0,0,0.12);
                --kc-radius-sm: 8px;
                --kc-radius-md: 12px;
                --kc-radius-lg: 16px;
                --kc-radius-xl: 28px;
            }

            /* ── FAB パネル ── */
            .keito-floating-panel {
                position: fixed; bottom: 20px;
                left: 50%; transform: translateX(-50%);
                background: var(--kc-surface-container);
                border: none; border-radius: var(--kc-radius-lg);
                padding: 8px; display: flex; gap: 6px; z-index: 1000;
                box-shadow: 0 1px 3px 1px var(--kc-shadow), 0 1px 2px 0 var(--kc-shadow);
                font-family: 'Google Sans', 'Segoe UI', system-ui, sans-serif;
            }

            /* ── ボタン共通 (Filled Tonal) ── */
            .keito-btn {
                padding: 10px 20px; border-radius: var(--kc-radius-xl);
                border: none; cursor: pointer; font-weight: 500;
                color: var(--kc-on-secondary-container); font-size: 14px;
                background: var(--kc-secondary-container);
                transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
                letter-spacing: 0.1px;
                display: flex; align-items: center; gap: 6px;
                line-height: 20px; position: relative; overflow: hidden;
            }
            .keito-btn::before {
                content: ''; position: absolute; inset: 0;
                background: currentColor; opacity: 0;
                transition: opacity 0.2s;
            }
            .keito-btn:hover::before { opacity: 0.08; }
            .keito-btn:active::before { opacity: 0.12; }
            .keito-btn:disabled { opacity: 0.38; cursor: default; }

            /* ── ボタンバリエーション ── */
            .keito-btn-deploy {
                background: var(--kc-primary);
                color: var(--kc-on-primary);
            }
            .keito-btn-run {
                background: var(--kc-primary-container);
                color: var(--kc-on-primary-container);
            }
            .keito-btn-stop {
                background: var(--kc-error-container);
                color: var(--kc-error);
            }
            .keito-btn-logs {
                background: var(--kc-secondary-container);
                color: var(--kc-on-secondary-container);
            }
            .keito-btn-config {
                background: var(--kc-surface-container-high);
                color: var(--kc-on-surface-variant);
                padding: 10px 14px;
            }

            /* ── モーダル (Dialog) ── */
            .keito-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.32); display: none;
                justify-content: center; align-items: center; z-index: 2000;
            }
            .keito-modal {
                background: var(--kc-surface-container-high);
                color: var(--kc-on-surface); padding: 24px;
                border-radius: var(--kc-radius-xl);
                width: 420px; font-family: 'Google Sans', 'Segoe UI', system-ui, sans-serif;
                max-height: 80vh; overflow-y: auto;
                box-shadow: 0 8px 12px 6px var(--kc-shadow), 0 4px 4px 0 var(--kc-shadow);
            }
            .keito-modal h3 {
                font-size: 24px; font-weight: 400;
                color: var(--kc-on-surface); margin: 0 0 16px 0;
            }
            .keito-modal label {
                font-size: 12px; color: var(--kc-on-surface-variant);
                font-weight: 500; letter-spacing: 0.5px;
            }

            /* ── テキストフィールド (Outlined) ── */
            .keito-input {
                width: 100%; padding: 14px 16px; margin: 6px 0 14px 0;
                border-radius: var(--kc-radius-sm);
                border: 1px solid var(--kc-outline);
                background: transparent;
                color: var(--kc-on-surface);
                box-sizing: border-box; font-size: 16px;
                font-family: inherit;
                transition: border-color 0.2s;
            }
            .keito-input:focus {
                outline: none;
                border: 2px solid var(--kc-primary);
                padding: 13px 15px;
            }
            .keito-input::placeholder { color: var(--kc-on-surface-variant); opacity: 0.6; }

            /* ── Filled Button ── */
            .keito-save-btn {
                background: var(--kc-primary);
                width: 100%; padding: 14px;
                border: none; border-radius: var(--kc-radius-xl);
                color: var(--kc-on-primary);
                font-weight: 500; font-size: 14px;
                cursor: pointer; margin-top: 8px;
                letter-spacing: 0.1px;
                transition: box-shadow 0.2s;
            }
            .keito-save-btn:hover {
                box-shadow: 0 1px 3px 1px var(--kc-shadow), 0 1px 2px 0 var(--kc-shadow);
            }

            /* ── コンソール (Card / ドラッグ可能ウィンドウ) ── */
            .keito-console {
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 560px; min-height: 200px; max-height: 80vh;
                background: var(--kc-surface-container-low);
                border: 1px solid var(--kc-outline-variant);
                border-radius: var(--kc-radius-lg); z-index: 1500;
                font-family: 'Google Sans Mono', 'Consolas', monospace;
                display: none; flex-direction: column;
                box-shadow: 0 8px 24px 4px var(--kc-shadow), 0 4px 8px 0 var(--kc-shadow);
                resize: both; overflow: hidden;
            }
            .keito-console-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 12px 16px;
                background: var(--kc-surface-container);
                border-bottom: 1px solid var(--kc-outline-variant);
                border-radius: var(--kc-radius-lg) var(--kc-radius-lg) 0 0;
                color: var(--kc-on-surface-variant); font-size: 14px;
                font-family: 'Google Sans', 'Segoe UI', system-ui, sans-serif;
                font-weight: 500;
                cursor: grab; user-select: none;
            }
            .keito-console-header:active { cursor: grabbing; }
            .keito-console-header button {
                background: none; border: none;
                color: var(--kc-on-surface-variant);
                cursor: pointer; font-size: 18px; padding: 4px 6px;
                border-radius: 50%;
                transition: background 0.15s;
            }
            .keito-console-header button:hover {
                background: var(--kc-surface-container-highest);
            }
            .keito-console-body {
                padding: 12px 16px; overflow-y: auto; flex: 1;
                font-size: 13px; color: var(--kc-on-surface);
                white-space: pre-wrap; word-break: break-all; line-height: 1.6;
            }
            .keito-log-info { color: var(--kc-primary); }
            .keito-log-error { color: var(--kc-error); }
            .keito-log-success { color: #2e7d32; }
            .keito-log-warn { color: #e65100; }
            .keito-log-dim { color: var(--kc-outline); }

            /* ── ステータスバッジ (Assist Chip) ── */
            .keito-status-badge {
                display: inline-flex; align-items: center;
                padding: 2px 10px; border-radius: 8px;
                font-size: 11px; font-weight: 500;
                margin-left: 8px; letter-spacing: 0.5px;
            }
            .keito-status-running {
                background: var(--kc-primary-container);
                color: var(--kc-on-primary-container);
            }
            .keito-status-stopped {
                background: var(--kc-surface-container-highest);
                color: var(--kc-on-surface-variant);
            }
            .keito-status-error {
                background: var(--kc-error-container);
                color: var(--kc-error);
            }

            /* ── ファイル/プロセスリスト ── */
            .keito-file-list { list-style: none; padding: 0; margin: 12px 0; }
            .keito-file-list li {
                padding: 12px 16px; margin: 4px 0;
                background: var(--kc-surface-container-low);
                border-radius: var(--kc-radius-md);
                display: flex; justify-content: space-between; align-items: center;
                font-size: 14px; color: var(--kc-on-surface);
                border: 1px solid var(--kc-outline-variant);
                transition: background 0.15s;
            }
            .keito-file-list li:hover {
                background: var(--kc-surface-container);
            }
            .keito-file-list li .keito-file-actions {
                display: flex; gap: 8px;
            }
            .keito-file-list li button {
                padding: 6px 14px; border: none;
                border-radius: var(--kc-radius-xl);
                cursor: pointer; font-size: 12px;
                font-weight: 500; transition: all 0.15s;
                letter-spacing: 0.1px;
            }
            .keito-file-btn-run {
                background: var(--kc-primary-container);
                color: var(--kc-on-primary-container);
            }
            .keito-file-btn-delete {
                background: var(--kc-error-container);
                color: var(--kc-error);
            }
            .keito-file-btn-stop {
                background: var(--kc-error-container);
                color: var(--kc-error);
            }

            /* ── Divider ── */
            .keito-divider {
                border: none; border-top: 1px solid var(--kc-outline-variant);
                margin: 16px 0;
            }

            /* ── 空リスト ── */
            .keito-empty {
                text-align: center; padding: 24px;
                color: var(--kc-on-surface-variant); font-size: 14px;
            }

            /* ── ファイルマネージャ ウィンドウ ── */
            .keito-filemanager {
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 520px; min-height: 300px; max-height: 80vh;
                background: var(--kc-surface-container-low);
                border: 1px solid var(--kc-outline-variant);
                border-radius: var(--kc-radius-lg); z-index: 1500;
                font-family: 'Google Sans', 'Segoe UI', system-ui, sans-serif;
                display: none; flex-direction: column;
                box-shadow: 0 8px 24px 4px var(--kc-shadow), 0 4px 8px 0 var(--kc-shadow);
                resize: both; overflow: hidden;
            }
            .keito-fm-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 12px 16px;
                background: var(--kc-surface-container);
                border-bottom: 1px solid var(--kc-outline-variant);
                border-radius: var(--kc-radius-lg) var(--kc-radius-lg) 0 0;
                color: var(--kc-on-surface-variant); font-size: 14px;
                font-weight: 500;
                cursor: grab; user-select: none;
            }
            .keito-fm-header:active { cursor: grabbing; }
            .keito-fm-header button {
                background: none; border: none;
                color: var(--kc-on-surface-variant);
                cursor: pointer; font-size: 18px; padding: 4px 6px;
                border-radius: 50%;
                transition: background 0.15s;
            }
            .keito-fm-header button:hover {
                background: var(--kc-surface-container-highest);
            }
            .keito-fm-toolbar {
                display: flex; gap: 8px; padding: 10px 16px;
                border-bottom: 1px solid var(--kc-outline-variant);
                background: var(--kc-surface-container-low);
                align-items: center;
            }
            .keito-fm-upload-btn {
                padding: 8px 18px; border-radius: var(--kc-radius-xl);
                border: none; cursor: pointer; font-weight: 500;
                font-size: 13px; letter-spacing: 0.1px;
                background: var(--kc-primary);
                color: var(--kc-on-primary);
                display: flex; align-items: center; gap: 6px;
                transition: box-shadow 0.2s;
            }
            .keito-fm-upload-btn:hover {
                box-shadow: 0 1px 3px 1px var(--kc-shadow);
            }
            .keito-fm-refresh-btn {
                padding: 8px 14px; border-radius: var(--kc-radius-xl);
                border: 1px solid var(--kc-outline-variant);
                cursor: pointer; font-size: 13px; font-weight: 500;
                background: var(--kc-surface-container);
                color: var(--kc-on-surface-variant);
                transition: background 0.15s;
            }
            .keito-fm-refresh-btn:hover {
                background: var(--kc-surface-container-high);
            }
            .keito-fm-body {
                padding: 8px 16px; overflow-y: auto; flex: 1;
            }
            .keito-fm-file-item {
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px 14px; margin: 4px 0;
                background: var(--kc-surface-container);
                border: 1px solid var(--kc-outline-variant);
                border-radius: var(--kc-radius-md);
                font-size: 13px; color: var(--kc-on-surface);
                transition: background 0.15s;
            }
            .keito-fm-file-item:hover {
                background: var(--kc-surface-container-high);
            }
            .keito-fm-file-info {
                display: flex; align-items: center; gap: 8px;
                overflow: hidden; flex: 1; min-width: 0;
            }
            .keito-fm-file-icon { font-size: 18px; flex-shrink: 0; }
            .keito-fm-file-name {
                font-weight: 500; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis;
            }
            .keito-fm-file-meta {
                font-size: 11px; color: var(--kc-outline);
                white-space: nowrap; flex-shrink: 0;
            }
            .keito-fm-file-actions { display: flex; gap: 6px; flex-shrink: 0; margin-left: 8px; }
            .keito-fm-file-actions button {
                padding: 5px 12px; border: none;
                border-radius: var(--kc-radius-xl);
                cursor: pointer; font-size: 12px;
                font-weight: 500; transition: all 0.15s;
                letter-spacing: 0.1px;
            }
            .keito-fm-btn-delete {
                background: var(--kc-error-container);
                color: var(--kc-error);
            }
            .keito-fm-btn-delete:hover {
                box-shadow: 0 1px 2px 0 var(--kc-shadow);
            }
            .keito-fm-drop-zone {
                border: 2px dashed var(--kc-outline-variant);
                border-radius: var(--kc-radius-md);
                padding: 32px; text-align: center;
                color: var(--kc-on-surface-variant); font-size: 13px;
                margin: 8px 0; transition: all 0.2s;
            }
            .keito-fm-drop-zone.drag-over {
                border-color: var(--kc-primary);
                background: var(--kc-primary-container);
                color: var(--kc-on-primary-container);
            }
            .keito-fm-loading {
                text-align: center; padding: 24px;
                color: var(--kc-on-surface-variant); font-size: 13px;
            }
        `;
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = css;
        document.head.appendChild(this.styleElement);
    }

    // ═══════════════════════════════════════
    //  UIコンポーネント
    // ═══════════════════════════════════════
    createUI() {
        this.btnContainer = document.createElement('div');
        this.btnContainer.className = 'keito-floating-panel';

        const buttons = [
            { label: '+ Upload', cls: 'keito-btn-deploy', action: () => this.handleDeploy() },
            { label: '> Run', cls: 'keito-btn-run', action: () => this.showRunSelector() },
            { label: '[] Stop', cls: 'keito-btn-stop', action: () => this.showStopSelector() },
            { label: '# Log', cls: 'keito-btn-logs', action: () => this.toggleConsole() },
            { label: '@ Files', cls: 'keito-btn-logs', action: () => this.toggleFileManager() },
            { label: '*', cls: 'keito-btn-config', action: () => this.openSettings() },
        ];

        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = `keito-btn ${b.cls}`;
            btn.textContent = b.label;
            btn.onclick = b.action;
            this.btnContainer.appendChild(btn);
        });

        document.body.appendChild(this.btnContainer);
    }

    createSettingsModal() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'keito-modal-overlay';
        this.modalContainer.innerHTML = `
            <div class="keito-modal">
                <h3>接続設定</h3>
                <label>Base URL</label>
                <input type="text" id="keito-url" class="keito-input" placeholder="https://cloud.keitodaze.net">
                <label>API Key</label>
                <input type="password" id="keito-key" class="keito-input" placeholder="kc_xxxxxxxx...">
                <hr class="keito-divider">
                <label>Discord Bot Token</label>
                <input type="password" id="keito-bot-token" class="keito-input" placeholder="MTIzNDU2Nzg5...">
                <p style="font-size:12px; color:var(--kc-on-surface-variant); margin:4px 0 12px 0;">
                    デプロイ時にコードへ自動挿入されます
                </p>
                <button class="keito-save-btn" id="keito-save">保存</button>
                <p style="font-size:11px; color:var(--kc-outline); margin-top:14px; text-align:center;">
                    設定はブラウザのlocalStorageに保存されます
                </p>
            </div>
        `;
        document.body.appendChild(this.modalContainer);

        this.modalContainer.onclick = (e) => {
            if (e.target === this.modalContainer) this.modalContainer.style.display = 'none';
        };
        setTimeout(() => {
            document.getElementById('keito-save').onclick = () => this.saveSettings();
        }, 0);
    }

    createConsolePanel() {
        this.consoleContainer = document.createElement('div');
        this.consoleContainer.className = 'keito-console';
        this.consoleContainer.innerHTML = `
            <div class="keito-console-header">
                <span>コンソール <span id="keito-process-status"></span></span>
                <div>
                    <button id="keito-console-refresh" title="更新">↻</button>
                    <button id="keito-console-clear" title="クリア">⌫</button>
                    <button id="keito-console-close" title="閉じる">✕</button>
                </div>
            </div>
            <div class="keito-console-body" id="keito-console-output">
                <span class="keito-log-dim">ログはここに表示されます</span>
            </div>
        `;
        document.body.appendChild(this.consoleContainer);

        setTimeout(() => {
            document.getElementById('keito-console-close').onclick = () => {
                this.consoleContainer.style.display = 'none';
                this.stopLogPolling();
            };
            document.getElementById('keito-console-clear').onclick = () => {
                document.getElementById('keito-console-output').innerHTML = '';
            };
            document.getElementById('keito-console-refresh').onclick = () => this.fetchLogs();
            this.initConsoleDrag();
        }, 0);
    }

    // ═══════════════════════════════════════
    //  コンソール ドラッグ移動
    // ═══════════════════════════════════════
    initConsoleDrag() {
        const header = this.consoleContainer.querySelector('.keito-console-header');
        const panel = this.consoleContainer;
        let isDragging = false;
        let startX, startY, origX, origY;

        header.addEventListener('mousedown', (e) => {
            // ボタンクリックは無視
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // 初回ドラッグ時に transform を解除して top/left に切り替え
            const rect = panel.getBoundingClientRect();
            panel.style.transform = 'none';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';

            origX = rect.left;
            origY = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panel.style.left = (origX + dx) + 'px';
            panel.style.top = (origY + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // ═══════════════════════════════════════
    //  汎用モーダル
    // ═══════════════════════════════════════
    showModal(title, contentHTML, onMount) {
        const existing = document.getElementById('keito-dynamic-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'keito-dynamic-modal';
        overlay.className = 'keito-modal-overlay';
        overlay.style.display = 'flex';

        overlay.innerHTML = `
            <div class="keito-modal">
                <h3>${title}</h3>
                ${contentHTML}
                <button class="keito-save-btn" style="background:var(--kc-secondary);margin-top:16px;" id="keito-modal-close">閉じる</button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        document.getElementById('keito-modal-close').onclick = () => overlay.remove();

        if (onMount) onMount(overlay);
        return overlay;
    }

    // ═══════════════════════════════════════
    //  設定管理
    // ═══════════════════════════════════════
    getConfig() {
        return {
            apiKey: localStorage.getItem('keito_api_key') || "",
            baseUrl: localStorage.getItem('keito_base_url') || this.DEFAULT_BASE_URL
        };
    }

    getBaseUrl() {
        return this.getConfig().baseUrl.replace(/\/$/, "");
    }

    getHeaders() {
        const key = this.getConfig().apiKey;
        return { 'Authorization': key.startsWith('Bearer ') ? key : `Bearer ${key}` };
    }

    openSettings() {
        const config = this.getConfig();
        document.getElementById('keito-url').value = config.baseUrl;
        document.getElementById('keito-key').value = config.apiKey;
        document.getElementById('keito-bot-token').value = localStorage.getItem('keito_bot_token') || '';
        this.modalContainer.style.display = 'flex';
    }

    saveSettings() {
        const rawKey = document.getElementById('keito-key').value;
        const cleanKey = rawKey.replace(/[^\x20-\x7E]/g, "").trim();
        localStorage.setItem('keito_base_url', document.getElementById('keito-url').value.trim());
        localStorage.setItem('keito_api_key', cleanKey);
        const botToken = document.getElementById('keito-bot-token').value.replace(/[^\x20-\x7E]/g, "").trim();
        if (botToken) localStorage.setItem('keito_bot_token', botToken);
        this.modalContainer.style.display = 'none';
        this.logToConsole("設定を保存しました", "success");
    }

    requireConfig() {
        const config = this.getConfig();
        if (!config.apiKey) {
            this.logToConsole("APIキーが設定されていません", "warn");
            this.openSettings();
            return null;
        }
        return config;
    }

    // ═══════════════════════════════════════
    //  API通信ヘルパー
    // ═══════════════════════════════════════
    async apiRequest(method, path, body = null, isFormData = false) {
        const baseUrl = this.getBaseUrl();
        const headers = this.getHeaders();

        if (!isFormData && body) {
            headers['Content-Type'] = 'application/json';
        }

        const opts = { method, headers };
        if (body) {
            opts.body = isFormData ? body : JSON.stringify(body);
        }

        const res = await fetch(`${baseUrl}${path}`, opts);

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`${res.status}: ${errText || res.statusText}`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await res.json();
        }
        return await res.text();
    }

    // ═══════════════════════════════════════
    //  コンソール出力
    // ═══════════════════════════════════════
    logToConsole(message, type = "info") {
        const output = document.getElementById('keito-console-output');
        if (!output) return;

        const line = document.createElement('div');
        line.className = `keito-log-${type}`;
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        line.textContent = `[${timestamp}] ${message}`;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;

        this.consoleContainer.style.display = 'flex';
    }

    toggleConsole() {
        const isVisible = this.consoleContainer.style.display === 'flex';
        this.consoleContainer.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible && this.currentProcessId) {
            this.fetchLogs();
        }
    }

    setProcessStatus(status) {
        const badge = document.getElementById('keito-process-status');
        if (!badge) return;
        const map = {
            running: { text: 'RUNNING', cls: 'keito-status-running' },
            stopped: { text: 'STOPPED', cls: 'keito-status-stopped' },
            error: { text: 'ERROR', cls: 'keito-status-error' },
        };
        const s = map[status] || { text: status, cls: 'keito-status-stopped' };
        badge.className = `keito-status-badge ${s.cls}`;
        badge.textContent = s.text;
    }

    // ═══════════════════════════════════════
    //  コード前処理
    // ═══════════════════════════════════════
    wrapCode(rawCode) {
        const botToken = localStorage.getItem('keito_bot_token') || '';

        if (!botToken) {
            this.logToConsole("Bot Tokenが未設定です。設定から入力してください", "warn");
        }

        let code = rawCode;

        if (botToken && /token\s*=\s*["']TOKEN["']/i.test(code)) {
            code = code.replace(
                /token\s*=\s*["']TOKEN["']/i,
                `token = "${botToken}"`
            );
            this.logToConsole("トークンをコードに注入しました", "info");
            return code;
        }

        if (/^(?:import discord|from discord)/m.test(code) && /bot\s*=/.test(code)) {
            return code;
        }

        if (!botToken) return code;

        const boilerplate = `import discord
from discord.ext import commands
import os

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} としてログインしました')

`;
        const footer = `
bot.run('${botToken}')
`;

        const needsRun = !/bot\.run\s*\(/.test(code);
        return boilerplate + code + (needsRun ? footer : '');
    }

    // ═══════════════════════════════════════
    //  デプロイ（アップロードのみ）
    // ═══════════════════════════════════════
    async handleDeploy() {
        if (!this.requireConfig()) return;

        this.logToConsole("アップロード開始...", "info");

        try {
            let code = Blockly.Python.workspaceToCode(this.workspace);
            if (!code || code.trim() === '') {
                this.logToConsole("コードが空です。ブロックを配置してください", "warn");
                return;
            }

            code = this.wrapCode(code);
            this.logToConsole(`コード生成完了 (${code.length} bytes)`, "info");

            const blob = new Blob([code], { type: 'text/x-python' });
            const formData = new FormData();
            formData.append('file', blob, 'bot.py');

            const uploadData = await this.apiRequest('POST', '/api/v1/files/upload', formData, true);
            this.currentFileId = uploadData.id;
            this.logToConsole(`アップロード成功 — File ID: ${uploadData.id}`, "success");

        } catch (err) {
            this.logToConsole(`アップロード失敗: ${err.message}`, "error");
            console.error(err);
        }
    }

    // ═══════════════════════════════════════
    //  実行：ファイル選択ダイアログ
    // ═══════════════════════════════════════
    async showRunSelector() {
        if (!this.requireConfig()) return;

        this.logToConsole("ファイル一覧を取得中...", "info");

        try {
            const files = await this.apiRequest('GET', '/api/v1/files');
            const fileArray = Array.isArray(files) ? files : (files.files || files.data || []);

            if (fileArray.length === 0) {
                this.showModal('ファイル実行', '<p class="keito-empty">ファイルがありません。先にアップロードしてください。</p>');
                return;
            }

            let listHTML = '<ul class="keito-file-list">';
            fileArray.forEach(f => {
                const fileId = f.id || f.fileId || f.file_id;
                const fileName = f.name || f.filename || f.file_name || `File ${fileId}`;
                listHTML += `
                    <li>
                        <span>- ${fileName}</span>
                        <div class="keito-file-actions">
                            <button class="keito-file-btn-run" data-id="${fileId}"> > Run</button>
                            <button class="keito-file-btn-delete" data-id="${fileId}">削除</button>
                        </div>
                    </li>
                `;
            });
            listHTML += '</ul>';

            this.showModal('実行するファイルを選択', listHTML, (overlay) => {
                overlay.querySelectorAll('.keito-file-btn-run').forEach(btn => {
                    btn.onclick = () => {
                        overlay.remove();
                        this.runFileById(btn.dataset.id);
                    };
                });
                overlay.querySelectorAll('.keito-file-btn-delete').forEach(btn => {
                    btn.onclick = async () => {
                        if (confirm(`ファイル ${btn.dataset.id} を削除しますか？`)) {
                            try {
                                await this.apiRequest('DELETE', `/api/v1/files/${btn.dataset.id}`);
                                this.logToConsole(`ファイル ${btn.dataset.id} を削除しました`, "success");
                                overlay.remove();
                                this.showRunSelector();
                            } catch (err) {
                                this.logToConsole(`削除失敗: ${err.message}`, "error");
                            }
                        }
                    };
                });
            });

        } catch (err) {
            this.logToConsole(`ファイル一覧取得失敗: ${err.message}`, "error");
        }
    }

    async runFileById(fileId) {
        if (!this.requireConfig()) return;

        try {
            this.logToConsole(`ファイル ${fileId} を実行中...`, "info");
            this.currentFileId = fileId;
            const runData = await this.apiRequest('POST', `/api/v1/files/${fileId}/run`);
            this.currentProcessId = runData.id || runData.processId || runData.process_id;
            this.logToConsole(`プロセス起動 — Process ID: ${this.currentProcessId}`, "success");
            this.setProcessStatus('running');
            this.startLogPolling();
        } catch (err) {
            this.logToConsole(`実行失敗: ${err.message}`, "error");
            this.setProcessStatus('error');
        }
    }

    // ═══════════════════════════════════════
    //  停止：プロセス選択ダイアログ
    // ═══════════════════════════════════════
    async showStopSelector() {
        if (!this.requireConfig()) return;

        this.logToConsole("プロセス一覧を取得中...", "info");

        try {
            const processes = await this.apiRequest('GET', '/api/v1/processes');
            const procArray = Array.isArray(processes) ? processes : (processes.processes || processes.data || []);

            // 実行中のプロセスのみフィルタ（statusフィールドがある場合）
            const running = procArray.filter(p => {
                const s = p.status || p.state || '';
                // statusが無い場合は全件表示
                return !s || s === 'running' || s === 'active' || s === 'started';
            });

            if (running.length === 0) {
                this.showModal('プロセス停止', '<p class="keito-empty">実行中のプロセスがありません。</p>');
                return;
            }

            let listHTML = '<ul class="keito-file-list">';
            running.forEach(p => {
                const procId = p.id || p.processId || p.process_id;
                const procName = p.name || p.filename || p.file_name || `Process ${procId}`;
                const statusText = p.status || p.state || 'running';
                listHTML += `
                    <li>
                        <span>* ${procName} <span class="keito-status-badge keito-status-running">${statusText}</span></span>
                        <div class="keito-file-actions">
                            <button class="keito-file-btn-stop" data-id="${procId}">[] Stop</button>
                        </div>
                    </li>
                `;
            });
            listHTML += '</ul>';

            this.showModal('停止するプロセスを選択', listHTML, (overlay) => {
                overlay.querySelectorAll('.keito-file-btn-stop').forEach(btn => {
                    btn.onclick = async () => {
                        try {
                            await this.apiRequest('POST', `/api/v1/processes/${btn.dataset.id}/kill`);
                            this.logToConsole(`プロセス ${btn.dataset.id} を停止しました`, "success");
                            this.setProcessStatus('stopped');
                            this.stopLogPolling();
                            overlay.remove();
                        } catch (err) {
                            this.logToConsole(`停止失敗: ${err.message}`, "error");
                        }
                    };
                });
            });

        } catch (err) {
            this.logToConsole(`プロセス一覧取得失敗: ${err.message}`, "error");
        }
    }

    // ═══════════════════════════════════════
    //  ログ取得・ポーリング
    // ═══════════════════════════════════════
    // システムノイズ行を除外するフィルタ
    _isNoiseLine(line) {
        const trimmed = line.trim();
        if (!trimmed) return true;
        // bubblewrap サンドボックス通知
        if (/bubblewrap/i.test(trimmed)) return true;
        // プロセス開始メタ情報 (PID, unit)
        if (/^プロセス開始\s*\(PID:/.test(trimmed)) return true;
        return false;
    }

    async fetchLogs() {
        if (!this.currentProcessId) {
            this.logToConsole("ログを取得するプロセスがありません", "warn");
            return;
        }

        try {
            const logsData = await this.apiRequest('GET', `/api/v1/processes/${this.currentProcessId}/logs`);
            const output = document.getElementById('keito-console-output');
            if (!output) return;

            const stringify = (item) => {
                if (typeof item === 'string') return item;
                if (item === null || item === undefined) return '';
                for (const key of ['message', 'text', 'content', 'log', 'data', 'line', 'output', 'msg', 'body']) {
                    if (item[key] !== undefined && item[key] !== null) {
                        return typeof item[key] === 'string' ? item[key] : JSON.stringify(item[key]);
                    }
                }
                return JSON.stringify(item, null, 2);
            };

            let rawLogs = '';
            if (typeof logsData === 'string') {
                rawLogs = logsData;
            } else if (Array.isArray(logsData)) {
                rawLogs = logsData.map(stringify).join('\n');
            } else if (logsData && typeof logsData === 'object') {
                const arrayProp = Object.keys(logsData).find(k => Array.isArray(logsData[k]));
                const stringProp = Object.keys(logsData).find(k => typeof logsData[k] === 'string' && logsData[k].length > 0);
                if (arrayProp) {
                    rawLogs = logsData[arrayProp].map(stringify).join('\n');
                } else if (stringProp) {
                    rawLogs = logsData[stringProp];
                } else {
                    rawLogs = JSON.stringify(logsData, null, 2);
                }
            }

            // ノイズ行を除外
            const lines = rawLogs.split('\n').filter(l => !this._isNoiseLine(l));
            const logs = lines.join('\n');

            if (!logs.trim()) return;
            if (this._lastLogContent === logs) return;

            // 前回との差分のみ追記
            let newLines = logs;
            if (this._lastLogContent) {
                const prevLines = this._lastLogContent.split('\n');
                const currLines = logs.split('\n');
                // 前回の最終行以降を差分として取得
                const lastPrev = prevLines[prevLines.length - 1];
                const idx = currLines.lastIndexOf(lastPrev);
                if (idx >= 0 && idx < currLines.length - 1) {
                    newLines = currLines.slice(idx + 1).join('\n');
                } else if (idx === currLines.length - 1) {
                    // 差分なし
                    this._lastLogContent = logs;
                    return;
                }
            }
            this._lastLogContent = logs;

            if (newLines.trim()) {
                const pre = document.createElement('pre');
                pre.style.cssText = 'margin: 0; white-space: pre-wrap; color: var(--kc-on-surface); font-size: 13px;';
                pre.textContent = newLines;
                output.appendChild(pre);
                output.scrollTop = output.scrollHeight;
            }
        } catch (err) {
            console.warn("Log fetch error:", err);
        }
    }

    startLogPolling() {
        this.stopLogPolling();
        setTimeout(() => this.fetchLogs(), 1000);
        this.logInterval = setInterval(() => this.fetchLogs(), 3000);
    }

    stopLogPolling() {
        if (this.logInterval) {
            clearInterval(this.logInterval);
            this.logInterval = null;
        }
    }

    // ═══════════════════════════════════════
    //  ファイルマネージャ
    // ═══════════════════════════════════════
    createFileManagerPanel() {
        this.fileManagerContainer = document.createElement('div');
        this.fileManagerContainer.className = 'keito-filemanager';
        this.fileManagerContainer.innerHTML = `
            <div class="keito-fm-header">
                <span>@ File Manager</span>
                <div>
                    <button id="keito-fm-close" title="閉じる">✕</button>
                </div>
            </div>
            <div class="keito-fm-toolbar">
                <button class="keito-fm-upload-btn" id="keito-fm-upload-btn">+ Upload</button>
                <button class="keito-fm-refresh-btn" id="keito-fm-refresh-btn">↻ 更新</button>
                <input type="file" id="keito-fm-file-input" multiple style="display:none;">
            </div>
            <div class="keito-fm-body" id="keito-fm-body">
                <div class="keito-fm-drop-zone" id="keito-fm-dropzone">
                    ここにファイルをドラッグ＆ドロップ<br>
                    またはアップロードボタンを使用
                </div>
                <div id="keito-fm-file-list"></div>
            </div>
        `;
        document.body.appendChild(this.fileManagerContainer);

        setTimeout(() => {
            document.getElementById('keito-fm-close').onclick = () => {
                this.fileManagerContainer.style.display = 'none';
            };
            document.getElementById('keito-fm-upload-btn').onclick = () => {
                document.getElementById('keito-fm-file-input').click();
            };
            document.getElementById('keito-fm-file-input').onchange = (e) => {
                if (e.target.files.length > 0) {
                    this.uploadFilesToCloud(e.target.files);
                    e.target.value = '';
                }
            };
            document.getElementById('keito-fm-refresh-btn').onclick = () => {
                this.refreshFileManagerList();
            };
            this.initFileManagerDrag();
            this.initFileManagerDropZone();
        }, 0);
    }

    initFileManagerDrag() {
        const header = this.fileManagerContainer.querySelector('.keito-fm-header');
        const panel = this.fileManagerContainer;
        let isDragging = false;
        let startX, startY, origX, origY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            panel.style.transform = 'none';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            origX = rect.left;
            origY = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panel.style.left = (origX + dx) + 'px';
            panel.style.top = (origY + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    initFileManagerDropZone() {
        const dropZone = document.getElementById('keito-fm-dropzone');
        if (!dropZone) return;

        ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.uploadFilesToCloud(files);
            }
        });
    }

    toggleFileManager() {
        const isVisible = this.fileManagerContainer.style.display === 'flex';
        this.fileManagerContainer.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            this.refreshFileManagerList();
        }
    }

    async uploadFilesToCloud(files) {
        if (!this.requireConfig()) return;

        for (const file of files) {
            try {
                this.logToConsole(`アップロード中: ${file.name} (${this.formatFileSize(file.size)})`, 'info');
                const formData = new FormData();
                formData.append('file', file, file.name);
                const result = await this.apiRequest('POST', '/api/v1/files/upload', formData, true);
                this.logToConsole(`アップロード成功: ${file.name} — ID: ${result.id}`, 'success');
            } catch (err) {
                this.logToConsole(`アップロード失敗 (${file.name}): ${err.message}`, 'error');
            }
        }
        this.refreshFileManagerList();
    }

    async refreshFileManagerList() {
        if (!this.requireConfig()) return;

        const listEl = document.getElementById('keito-fm-file-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="keito-fm-loading">読み込み中...</div>';

        try {
            const files = await this.apiRequest('GET', '/api/v1/files');
            const fileArray = Array.isArray(files) ? files : (files.files || files.data || []);

            if (fileArray.length === 0) {
                listEl.innerHTML = '<div class="keito-empty">ファイルがありません</div>';
                return;
            }

            listEl.innerHTML = '';
            fileArray.forEach(f => {
                const fileId = f.id || f.fileId || f.file_id;
                const fileName = f.name || f.filename || f.file_name || `File ${fileId}`;
                const fileSize = f.size || f.file_size || null;
                const ext = fileName.split('.').pop().toLowerCase();
                const icon = this.getFileIcon(ext);

                const item = document.createElement('div');
                item.className = 'keito-fm-file-item';
                item.innerHTML = `
                    <div class="keito-fm-file-info">
                        <span class="keito-fm-file-icon">${icon}</span>
                        <span class="keito-fm-file-name" title="${fileName}">${fileName}</span>
                    </div>
                    ${fileSize ? `<span class="keito-fm-file-meta">${this.formatFileSize(fileSize)}</span>` : ''}
                    <div class="keito-fm-file-actions">
                        <button class="keito-fm-btn-delete" data-id="${fileId}" data-name="${fileName}">x Del</button>
                    </div>
                `;
                listEl.appendChild(item);

                item.querySelector('.keito-fm-btn-delete').onclick = async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const name = e.currentTarget.dataset.name;
                    if (confirm(`「${name}」を削除しますか？`)) {
                        await this.deleteFileFromCloud(id, name);
                    }
                };
            });
        } catch (err) {
            listEl.innerHTML = `<div class="keito-empty" style="color:var(--kc-error)">取得失敗: ${err.message}</div>`;
            this.logToConsole(`ファイル一覧取得失敗: ${err.message}`, 'error');
        }
    }

    async deleteFileFromCloud(fileId, fileName) {
        try {
            await this.apiRequest('DELETE', `/api/v1/files/${fileId}`);
            this.logToConsole(`削除しました: ${fileName || fileId}`, 'success');
            this.refreshFileManagerList();
        } catch (err) {
            this.logToConsole(`削除失敗 (${fileName || fileId}): ${err.message}`, 'error');
        }
    }

    getFileIcon(ext) {
        const icons = {
            py: '.py', js: '.js', ts: '.ts', json: '{}', txt: '.tx',
            md: '.md', html: '<>', css: '.cs', yml: '.ym', yaml: '.ym',
            png: '.im', jpg: '.im', jpeg: '.im', gif: '.im', svg: '.sv',
            zip: '.zp', tar: '.zp', gz: '.zp',
            pdf: '.pd', csv: '.cv', xml: '.xm',
        };
        return icons[ext] || '--';
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        let size = bytes;
        while (size >= 1024 && i < units.length - 1) {
            size /= 1024;
            i++;
        }
        return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }
}