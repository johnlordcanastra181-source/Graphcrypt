/**
 * GraphCrypt v1.0 - Cryptography & Data Export Controller
 * Manages Caesar Cipher calculations, visual transformation cards,
 * TXT report preview generation, and direct file download.
 */

class CryptoUIController {
    constructor() {
        // Form Elements
        this.selectCipher = document.getElementById('select-cipher-method');
        this.inputShift = document.getElementById('input-shift-val');
        this.btnShiftInc = document.getElementById('btn-shift-inc');
        this.btnShiftDec = document.getElementById('btn-shift-dec');
        this.btnApply = document.getElementById('btn-apply-transformation');

        // Transformation Display
        this.transformContainer = document.getElementById('transformations-container');
        this.tabTransformPath = document.getElementById('tab-transform-path');
        this.tabTransformAll = document.getElementById('tab-transform-all');
        this.currentFilter = 'path'; // 'path' or 'all'

        // Results Summary
        this.summaryPathDisplay = document.getElementById('summary-path-display');
        this.summaryTotalWeight = document.getElementById('summary-total-weight');

        // TXT Preview & Export
        this.outputTxtContent = document.getElementById('output-txt-content');
        this.btnFmtConcise = document.getElementById('btn-fmt-concise');
        this.btnFmtFull = document.getElementById('btn-fmt-full');
        this.btnPreviewTxt = document.getElementById('btn-preview-txt');
        this.btnGenerateTxt = document.getElementById('btn-generate-txt');
        this.btnExportTxt = document.getElementById('btn-export-txt');

        // State
        this.currentShift = 3;
        this.currentPathNodes = ['A', 'C', 'F', 'J', 'P', 'R', 'S', 'T'];
        this.currentTotalWeight = 1382.6;
        this.currentHeuristic = 'Euclidean Distance';
        this.formatType = 'concise'; // 'concise' or 'full'
        this.latestTransforms = null;

        this.initEvents();
    }

    initEvents() {
        // Shift Stepper Controls
        this.btnShiftInc.addEventListener('click', () => {
            let val = parseInt(this.inputShift.value, 10) || 0;
            val = Math.min(9, val + 1);
            this.inputShift.value = val;
            this.updateShift(val);
        });

        this.btnShiftDec.addEventListener('click', () => {
            let val = parseInt(this.inputShift.value, 10) || 0;
            val = Math.max(-9, val - 1);
            this.inputShift.value = val;
            this.updateShift(val);
        });

        this.inputShift.addEventListener('change', () => {
            let val = parseInt(this.inputShift.value, 10) || 0;
            this.updateShift(val);
        });

        this.btnApply.addEventListener('click', () => {
            this.fetchTransformations();
            window.showToast?.('Caesar Cipher transformation applied!', 'success');
        });

        // Filter Tabs
        this.tabTransformPath.addEventListener('click', () => {
            this.currentFilter = 'path';
            this.tabTransformPath.classList.add('active');
            this.tabTransformAll.classList.remove('active');
            this.renderTransformationCards();
        });

        this.tabTransformAll.addEventListener('click', () => {
            this.currentFilter = 'all';
            this.tabTransformAll.classList.add('active');
            this.tabTransformPath.classList.remove('active');
            this.renderTransformationCards();
        });

        // Format Switcher
        this.btnFmtConcise.addEventListener('click', () => {
            this.formatType = 'concise';
            this.btnFmtConcise.classList.add('active');
            this.btnFmtFull.classList.remove('active');
            this.fetchTxtPreview();
        });

        this.btnFmtFull.addEventListener('click', () => {
            this.formatType = 'full';
            this.btnFmtFull.classList.add('active');
            this.btnFmtConcise.classList.remove('active');
            this.fetchTxtPreview();
        });

        // Preview & Generate
        this.btnPreviewTxt.addEventListener('click', () => {
            this.fetchTxtPreview();
            window.showToast?.('TXT preview refreshed', 'info');
        });

        this.btnGenerateTxt.addEventListener('click', () => {
            this.fetchTxtPreview();
            window.showToast?.('Encrypted report generated successfully', 'success');
            window.updateWorkflowStep?.(5);
        });

        // Export Download Action
        this.btnExportTxt.addEventListener('click', () => {
            this.downloadEncryptedTxt();
        });
    }

    updateShift(newShift) {
        this.currentShift = newShift;
        this.fetchTransformations();
        this.fetchTxtPreview();
    }

    onAStarCompleted(astarResult) {
        if (!astarResult || !astarResult.success) return;

        this.currentPathNodes = astarResult.path || [];
        this.currentTotalWeight = astarResult.total_cost || 0.0;
        this.currentHeuristic = astarResult.heuristic_used || 'Euclidean Distance';

        this.updateResultsSummary();
        this.fetchTransformations();
        this.fetchTxtPreview();
    }

    updateResultsSummary() {
        // Render path pills
        this.summaryPathDisplay.innerHTML = '';
        if (this.currentPathNodes.length === 0) {
            this.summaryPathDisplay.innerHTML = '<span class="text-dim">No path found</span>';
        } else {
            this.currentPathNodes.forEach((nodeId, idx) => {
                const pill = document.createElement('span');
                pill.className = 'path-node-pill';
                pill.textContent = nodeId;
                this.summaryPathDisplay.appendChild(pill);

                if (idx < this.currentPathNodes.length - 1) {
                    const arrow = document.createElement('span');
                    arrow.className = 'path-arrow';
                    arrow.textContent = '→';
                    this.summaryPathDisplay.appendChild(arrow);
                }
            });
        }

        this.summaryTotalWeight.textContent = this.currentTotalWeight;
    }

    async fetchTransformations() {
        try {
            const response = await fetch('/api/cipher/encrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shift: this.currentShift,
                    path_nodes: this.currentPathNodes
                })
            });

            const data = await response.json();
            if (response.ok) {
                this.latestTransforms = data;
                this.renderTransformationCards();
                window.updateWorkflowStep?.(4);
            }
        } catch (err) {
            console.error('Failed to fetch transformations:', err);
        }
    }

    renderTransformationCards() {
        if (!this.latestTransforms) return;

        this.transformContainer.innerHTML = '';
        const list = this.currentFilter === 'path' 
            ? this.latestTransforms.path_transformations 
            : this.latestTransforms.all_transformations;

        if (!list || list.length === 0) {
            this.transformContainer.innerHTML = `
                <div class="empty-state-text" style="padding: 20px; text-align: center; color: var(--text-dim);">
                    No edge transformations available in this view.
                </div>
            `;
            return;
        }

        const shiftStr = this.currentShift >= 0 ? `+${this.currentShift}` : `${this.currentShift}`;

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'transform-card';

            card.innerHTML = `
                <div class="t-node-header">
                    <span class="t-node">${item.source}</span>
                    <i data-lucide="arrow-right" class="t-arrow-icon"></i>
                    <span class="t-node">${item.target}</span>
                    ${item.is_on_path || this.currentFilter === 'path' ? '<span class="version-tag" style="margin-left:auto; font-size:10px;">Shortest Path</span>' : ''}
                </div>
                <div class="t-values-row">
                    <div class="t-val-box">
                        <span class="t-number">${item.original_weight}</span>
                        <span class="t-sub">Original</span>
                    </div>
                    <div class="t-shift-badge">
                        <span class="t-shift-text">Shift</span>
                        <span class="t-shift-num">${shiftStr}</span>
                        <i data-lucide="arrow-right"></i>
                    </div>
                    <div class="t-val-box active-enc">
                        <span class="t-number cyan-txt">${item.encrypted_weight}</span>
                        <span class="t-sub cyan-txt">Encrypted</span>
                    </div>
                </div>
            `;

            this.transformContainer.appendChild(card);
        });

        lucide.createIcons();
    }

    async fetchTxtPreview() {
        try {
            const response = await fetch('/api/export/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shift: this.currentShift,
                    path_nodes: this.currentPathNodes,
                    heuristic: this.currentHeuristic,
                    format: this.formatType
                })
            });

            const data = await response.json();
            if (response.ok && data.preview_text) {
                this.outputTxtContent.textContent = data.preview_text;
            }
        } catch (err) {
            console.error('Failed to fetch TXT preview:', err);
        }
    }

    async downloadEncryptedTxt() {
        try {
            window.showToast?.('Preparing encrypted TXT download...', 'info');
            
            const response = await fetch('/api/export/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shift: this.currentShift,
                    path_nodes: this.currentPathNodes,
                    heuristic: this.currentHeuristic,
                    format: this.formatType
                })
            });

            if (!response.ok) {
                throw new Error('Export file generation failed on server.');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'encrypted_edge_weights.txt';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            window.showToast?.('File downloaded: encrypted_edge_weights.txt', 'success');
            window.updateWorkflowStep?.(6);

        } catch (err) {
            console.error('Download error:', err);
            window.showToast?.(`Download failed: ${err.message}`, 'error');
        }
    }
}
