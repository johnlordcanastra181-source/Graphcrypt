/**
 * Intelligent Text Search, Compression, and Optimization Suite UI Controller
 * Bohol Island State University (BISU) Final Project
 */

class TextSuiteController {
    constructor() {
        this.currentCorpus = "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness, it was the spring of hope, it was the winter of despair. We had everything before us, we had nothing before us, we were all going direct to heaven, we were all going direct the other way.\n\nIn computational science, algorithms represent systematic sequences of unambiguous instructions designed to perform specific calculations, data processing, and automated reasoning tasks. Pattern matching algorithms such as Knuth-Morris-Pratt and Boyer-Moore optimize information retrieval across vast text repositories. Data compression algorithms such as Huffman coding and LZW maximize channel throughput and minimize storage footprints. Through algorithmic optimization and parallel computing, modern information systems achieve scalable efficiency across distributed computational architectures.";
        this.samples = [];
        this.init();
    }

    init() {
        this.bindDatasetEvents();
        this.bindPatternEvents();
        this.bindCompressionEvents();
        this.bindOptimizationEvents();
        this.bindParallelRandomEvents();
        this.bindPerformanceEvents();
        this.fetchSampleDatasets();
        this.fetchComplexityMatrix();
        this.updateCorpusText(this.currentCorpus);
    }

    // ==========================================
    // 1. DATASET & TEXT INPUT CONTROLLER
    // ==========================================
    bindDatasetEvents() {
        const textarea = document.getElementById('corpus-text-input');
        if (textarea) {
            textarea.value = this.currentCorpus;
            textarea.addEventListener('input', () => {
                this.currentCorpus = textarea.value;
                this.updateStatsBar();
            });
        }

        const fileInput = document.getElementById('input-file-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.updateCorpusText(event.target.result);
                    window.showToast(`Loaded "${file.name}" (${file.size} bytes)`, 'success');
                };
                reader.readAsText(file);
            });
        }

        document.getElementById('btn-send-to-pattern')?.addEventListener('click', () => {
            window.switchView?.('tab-pattern');
            const ptInput = document.getElementById('pattern-search-text');
            if (ptInput) ptInput.value = this.currentCorpus;
            window.showToast('Corpus loaded into Pattern Matching view.', 'info');
        });

        document.getElementById('btn-send-to-compression')?.addEventListener('click', () => {
            window.switchView?.('tab-compression');
            const compInput = document.getElementById('comp-source-text');
            if (compInput) compInput.value = this.currentCorpus;
            window.showToast('Corpus loaded into Compression view.', 'info');
        });

        document.getElementById('btn-send-to-parallel')?.addEventListener('click', () => {
            window.switchView?.('tab-parallel');
            const parInput = document.getElementById('par-search-text');
            if (parInput) parInput.value = this.currentCorpus;
            window.showToast('Corpus loaded into Parallel Search view.', 'info');
        });
    }

    updateCorpusText(text) {
        this.currentCorpus = text;
        const textarea = document.getElementById('corpus-text-input');
        if (textarea) textarea.value = text;
        
        // Also sync inputs in other views if available
        const ptInput = document.getElementById('pattern-search-text');
        if (ptInput && !ptInput.value) ptInput.value = text;

        const compInput = document.getElementById('comp-source-text');
        if (compInput && !compInput.value) compInput.value = text;

        const parInput = document.getElementById('par-search-text');
        if (parInput && !parInput.value) parInput.value = text;

        this.updateStatsBar();
    }

    updateStatsBar() {
        const text = this.currentCorpus || "";
        const charCount = text.length;
        const byteCount = new Blob([text]).size;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lineCount = text ? text.split('\n').length : 0;

        document.querySelectorAll('.stat-char-count').forEach(el => el.textContent = charCount.toLocaleString());
        document.querySelectorAll('.stat-byte-count').forEach(el => el.textContent = byteCount.toLocaleString());
        document.querySelectorAll('.stat-word-count').forEach(el => el.textContent = wordCount.toLocaleString());
        document.querySelectorAll('.stat-line-count').forEach(el => el.textContent = lineCount.toLocaleString());
    }

    async fetchSampleDatasets() {
        try {
            const res = await fetch('/api/text/samples');
            const data = await res.json();
            if (data.success && data.samples) {
                this.samples = data.samples;
                this.renderSampleCards(data.samples);
            }
        } catch (err) {
            console.error('Failed to load sample datasets', err);
        }
    }

    renderSampleCards(samples) {
        const container = document.getElementById('sample-presets-list');
        if (!container) return;

        container.innerHTML = samples.map(s => `
            <div class="sample-preset-card" data-sample-id="${s.id}">
                <div class="sample-card-title">
                    <i data-lucide="file-text" style="width:15px; height:15px; color:#00F0FF;"></i>
                    <span>${s.title}</span>
                </div>
                <div class="sample-card-desc">${s.preview}</div>
                <div class="sample-card-meta">${s.character_count.toLocaleString()} chars · ${(s.size_bytes / 1024).toFixed(1)} KB</div>
            </div>
        `).join('');
        lucide.createIcons();

        container.querySelectorAll('.sample-preset-card').forEach(card => {
            card.addEventListener('click', async () => {
                const sampleId = card.dataset.sampleId;
                container.querySelectorAll('.sample-preset-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                try {
                    const res = await fetch('/api/text/load-sample', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sample_id: sampleId })
                    });
                    const d = await res.json();
                    if (d.success) {
                        this.updateCorpusText(d.content);
                        window.showToast(`Loaded ${sampleId} dataset.`, 'success');
                    }
                } catch (e) {
                    window.showToast('Error loading sample dataset.', 'error');
                }
            });
        });
    }

    // ==========================================
    // 2. PATTERN MATCHING CONTROLLER
    // ==========================================
    bindPatternEvents() {
        const runBtn = document.getElementById('btn-run-pattern-search');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.executePatternSearch());
        }

        const algoSelect = document.getElementById('select-pattern-algo');
        algoSelect?.addEventListener('change', () => {
            const approxGroup = document.getElementById('group-approx-distance');
            if (approxGroup) {
                approxGroup.style.display = (algoSelect.value === 'Approximate Matching') ? 'block' : 'none';
            }
        });
    }

    async executePatternSearch() {
        const textInput = document.getElementById('pattern-search-text');
        const patternInput = document.getElementById('input-search-pattern');
        const algoSelect = document.getElementById('select-pattern-algo');
        const maxDistInput = document.getElementById('input-approx-dist');

        const text = textInput ? textInput.value : this.currentCorpus;
        const pattern = patternInput ? patternInput.value.trim() : "";
        const algo = algoSelect ? algoSelect.value : "All";
        const maxDist = maxDistInput ? parseInt(maxDistInput.value, 10) : 1;

        if (!text) {
            window.showToast('Please provide text to search.', 'error');
            return;
        }
        if (!pattern) {
            window.showToast('Please specify a pattern to search for.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/search/pattern', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    pattern: pattern,
                    algorithm: algo,
                    max_distance: maxDist
                })
            });
            const data = await res.json();
            if (!data.success) {
                window.showToast(data.error || 'Search failed', 'error');
                return;
            }

            this.renderPatternResults(data, text, pattern);
            window.showToast(`Pattern search complete.`, 'success');
        } catch (err) {
            window.showToast('Failed to run pattern search.', 'error');
        }
    }

    renderPatternResults(data, text, pattern) {
        const summaryBox = document.getElementById('pattern-results-summary');
        const highlightBox = document.getElementById('pattern-highlight-viewer');
        const compTable = document.getElementById('pattern-comparison-table-body');

        let matchIndices = [];
        let matchCount = 0;
        let comparisons = 0;
        let timeUs = 0;

        if (data.mode === 'comparison') {
            matchIndices = data.matches || [];
            matchCount = data.match_count || 0;

            if (compTable && data.results) {
                compTable.innerHTML = data.results.map(r => `
                    <tr>
                        <td><strong>${r.algorithm}</strong></td>
                        <td><span class="badge-code badge-cyan">${r.match_count} matches</span></td>
                        <td><span class="badge-code badge-purple">${r.comparisons.toLocaleString()}</span></td>
                        <td><span class="badge-code badge-green">${r.time_microseconds.toFixed(1)} µs</span></td>
                        <td style="font-size:0.75rem; color:#94A3B8;">${r.details || '-'}</td>
                    </tr>
                `).join('');
            }
            document.getElementById('pattern-comparison-card')?.classList.remove('hidden');
        } else {
            const r = data.result;
            matchIndices = r.matches || [];
            matchCount = r.match_count || 0;
            comparisons = r.comparisons || 0;
            timeUs = r.time_microseconds || 0;

            if (compTable) {
                compTable.innerHTML = `
                    <tr>
                        <td><strong>${r.algorithm}</strong></td>
                        <td><span class="badge-code badge-cyan">${matchCount} matches</span></td>
                        <td><span class="badge-code badge-purple">${comparisons.toLocaleString()}</span></td>
                        <td><span class="badge-code badge-green">${timeUs.toFixed(1)} µs</span></td>
                        <td style="font-size:0.75rem; color:#94A3B8;">${r.details || '-'}</td>
                    </tr>
                `;
            }
            document.getElementById('pattern-comparison-card')?.classList.remove('hidden');
        }

        // Update summary badges
        if (summaryBox) {
            document.getElementById('stat-pattern-matches').textContent = matchCount;
            document.getElementById('stat-pattern-indices').textContent = matchIndices.slice(0, 15).join(', ') + (matchIndices.length > 15 ? '...' : '');
        }

        // Render highlighted text
        if (highlightBox) {
            highlightBox.innerHTML = this.buildHighlightedText(text, pattern, matchIndices);
        }
    }

    buildHighlightedText(text, pattern, matchIndices) {
        if (!matchIndices || matchIndices.length === 0) {
            return this.escapeHtml(text);
        }

        const mLen = pattern.length;
        let html = "";
        let lastIdx = 0;

        for (const idx of matchIndices) {
            if (idx < lastIdx) continue;
            // Append text before match
            html += this.escapeHtml(text.substring(lastIdx, idx));
            // Append highlighted match
            html += `<mark class="match-hl">${this.escapeHtml(text.substring(idx, idx + mLen))}</mark>`;
            lastIdx = idx + mLen;
        }

        if (lastIdx < text.length) {
            html += this.escapeHtml(text.substring(lastIdx));
        }

        return html;
    }

    // ==========================================
    // 3. TEXT COMPRESSION CONTROLLER
    // ==========================================
    bindCompressionEvents() {
        document.getElementById('btn-run-compression')?.addEventListener('click', () => this.executeCompression());
        document.getElementById('btn-compress-compare-all')?.addEventListener('click', () => this.executeCompressionCompareAll());
    }

    async executeCompression() {
        const textInput = document.getElementById('comp-source-text');
        const methodSelect = document.getElementById('select-comp-method');

        const text = textInput ? textInput.value : this.currentCorpus;
        const method = methodSelect ? methodSelect.value : "Huffman";

        if (!text) {
            window.showToast('Please provide text to compress.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/compression/compress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, method: method })
            });
            const data = await res.json();
            if (!data.success) {
                window.showToast(data.error || 'Compression failed', 'error');
                return;
            }

            this.renderCompressionStats(data);
            window.showToast(`${method} compression completed. Lossless: ${data.is_lossless}`, 'success');
        } catch (err) {
            window.showToast('Error during compression.', 'error');
        }
    }

    async executeCompressionCompareAll() {
        const textInput = document.getElementById('comp-source-text');
        const text = textInput ? textInput.value : this.currentCorpus;

        if (!text) {
            window.showToast('Please provide text to compress.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/compression/compare-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            const data = await res.json();
            if (!data.success) {
                window.showToast('Comparison failed', 'error');
                return;
            }

            const tableBody = document.getElementById('comp-compare-table-body');
            if (tableBody) {
                tableBody.innerHTML = data.comparisons.map(c => `
                    <tr>
                        <td><strong>${c.method}</strong></td>
                        <td>${c.original_bytes?.toLocaleString()} B</td>
                        <td><strong>${c.compressed_bytes?.toLocaleString()} B</strong></td>
                        <td><span class="badge-code ${c.compression_ratio < 100 ? 'badge-green' : 'badge-orange'}">${c.compression_ratio}%</span></td>
                        <td><span class="badge-code ${c.space_savings > 0 ? 'badge-cyan' : 'badge-orange'}">${c.space_savings}%</span></td>
                        <td><span class="badge-code badge-green">${c.is_lossless ? '✓ Lossless' : '✗ Failed'}</span></td>
                        <td>${c.time_ms?.toFixed(2)} ms</td>
                    </tr>
                `).join('');
            }
            document.getElementById('comp-compare-all-card')?.classList.remove('hidden');
            window.showToast('Generated multi-method compression comparison.', 'success');
        } catch (err) {
            window.showToast('Comparison failed.', 'error');
        }
    }

    renderCompressionStats(data) {
        document.getElementById('comp-stat-orig-size').textContent = `${data.original_bytes?.toLocaleString()} B`;
        document.getElementById('comp-stat-comp-size').textContent = `${data.compressed_bytes?.toLocaleString()} B`;
        document.getElementById('comp-stat-ratio').textContent = `${data.compression_ratio}%`;
        document.getElementById('comp-stat-savings').textContent = `${data.space_savings}%`;

        const ratioFill = document.getElementById('comp-ratio-progress');
        if (ratioFill) {
            const clamped = Math.min(100, Math.max(0, data.compression_ratio));
            ratioFill.style.width = `${clamped}%`;
        }

        // Lossless badge
        const badge = document.getElementById('comp-lossless-badge');
        if (badge) {
            badge.className = data.is_lossless ? 'badge-code badge-green' : 'badge-code badge-orange';
            badge.textContent = data.is_lossless ? '✓ 100% Lossless Verified' : '✗ Integrity Mismatch';
        }

        // Render Codebook / Dictionary / Encoded stream
        const detailsContainer = document.getElementById('comp-method-details');
        if (detailsContainer) {
            if (data.method === 'Huffman' && data.codebook) {
                detailsContainer.innerHTML = `
                    <div style="font-size:0.8rem; margin-bottom:8px; color:#94A3B8;">Huffman Codebook Dictionary (${data.codebook.length} unique prefix symbols):</div>
                    <div class="codebook-scroll">
                        <table class="suite-table">
                            <thead><tr><th>Character</th><th>Frequency</th><th>Prefix Bitcode</th><th>Bits</th></tr></thead>
                            <tbody>
                                ${data.codebook.slice(0, 30).map(c => `
                                    <tr>
                                        <td><code>${c.char === ' ' ? '[space]' : c.char}</code></td>
                                        <td>${c.freq}</td>
                                        <td><code class="badge-code badge-cyan">${c.code}</code></td>
                                        <td>${c.bits}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="form-group mt-3">
                        <label class="form-label">Bitstream Stream (First 400 bits):</label>
                        <div class="terminal-preview-box" style="word-break:break-all; font-size:0.78rem; color:#00F0FF;">${data.encoded_bits}</div>
                    </div>
                `;
            } else if (data.method === 'Run-Length Encoding (RLE)') {
                detailsContainer.innerHTML = `
                    <div style="font-size:0.8rem; margin-bottom:8px; color:#94A3B8;">Encoded RLE Stream (${data.runs_count} run segments):</div>
                    <div class="terminal-preview-box" style="max-height:180px; overflow-y:auto; word-break:break-all; font-size:0.82rem; color:#00FF9D;">${data.encoded_text}</div>
                `;
            } else if (data.method === 'LZW Dictionary Compression') {
                detailsContainer.innerHTML = `
                    <div style="font-size:0.8rem; margin-bottom:8px; color:#94A3B8;">LZW Dynamic Dictionary (${data.dictionary_size} total dictionary entries):</div>
                    <div class="codebook-scroll">
                        <table class="suite-table">
                            <thead><tr><th>Sequence</th><th>Assigned Code</th><th>Emitted Code</th></tr></thead>
                            <tbody>
                                ${(data.sample_dictionary_entries || []).map(e => `
                                    <tr>
                                        <td><code>${e.entry}</code></td>
                                        <td><span class="badge-code badge-purple">${e.code}</span></td>
                                        <td><span class="badge-code badge-cyan">${e.emitted_code}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="form-group mt-3">
                        <label class="form-label">First 50 Emitted LZW Integer Codes:</label>
                        <div class="terminal-preview-box" style="font-size:0.8rem; color:#A78BFA;">${(data.codes || []).slice(0, 50).join(', ')}</div>
                    </div>
                `;
            }
        }
    }

    // ==========================================
    // 4. OPTIMIZATION CONTROLLER (GA & KNAPSACK)
    // ==========================================
    bindOptimizationEvents() {
        document.getElementById('btn-run-ga')?.addEventListener('click', () => this.executeGA());
        document.getElementById('btn-run-knapsack')?.addEventListener('click', () => this.executeKnapsack());
    }

    async executeGA() {
        const cap = parseInt(document.getElementById('input-ga-capacity')?.value || "50", 10);
        const pop = parseInt(document.getElementById('input-ga-pop')?.value || "40", 10);
        const gens = parseInt(document.getElementById('input-ga-gens')?.value || "50", 10);
        const cx = parseFloat(document.getElementById('input-ga-cx')?.value || "0.8");
        const mut = parseFloat(document.getElementById('input-ga-mut')?.value || "0.05");

        try {
            const res = await fetch('/api/optimization/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    technique: "GA",
                    capacity: cap,
                    population_size: pop,
                    generations: gens,
                    crossover_rate: cx,
                    mutation_rate: mut
                })
            });
            const data = await res.json();
            if (!data.success) {
                window.showToast('GA run failed', 'error');
                return;
            }

            this.renderGAResults(data);
            window.showToast(`Genetic Algorithm completed in ${data.time_ms} ms.`, 'success');
        } catch (err) {
            window.showToast('Error running Genetic Algorithm.', 'error');
        }
    }

    renderGAResults(data) {
        document.getElementById('ga-result-fitness').textContent = data.total_value;
        document.getElementById('ga-result-weight').textContent = `${data.total_weight} / ${data.capacity}`;
        document.getElementById('ga-result-optimality').textContent = `${data.comparison?.optimality_ratio}% of DP Exact`;
        document.getElementById('ga-result-time').textContent = `${data.time_ms} ms`;

        // Render selected items
        const itemsList = document.getElementById('ga-selected-items-list');
        if (itemsList && data.selected_items) {
            itemsList.innerHTML = data.selected_items.map(it => `
                <div class="stat-box" style="padding:8px 12px; margin-bottom:6px;">
                    <span style="font-weight:600; color:#E2E8F0;">${it.name}</span>
                    <span style="font-size:0.75rem; color:#94A3B8;">Weight: ${it.weight} | Value: <strong style="color:#00FF9D;">${it.value}</strong></span>
                </div>
            `).join('');
        }

        // Draw Canvas Convergence Graph
        this.drawConvergenceChart(data.convergence_history);
    }

    drawConvergenceChart(history) {
        const canvas = document.getElementById('ga-convergence-canvas');
        if (!canvas || !history || history.length === 0) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.offsetWidth;
        const h = canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, w, h);

        const pad = 35;
        const plotW = w - pad * 2;
        const plotH = h - pad * 2;

        const maxFit = Math.max(...history.map(d => d.best_fitness), 1);
        const minFit = 0;

        // Grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad + (plotH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(w - pad, y);
            ctx.stroke();

            ctx.fillStyle = "#64748B";
            ctx.font = "10px monospace";
            const val = Math.round(maxFit - (maxFit / 4) * i);
            ctx.fillText(val.toString(), 8, y + 3);
        }

        // Plot Best Fitness (Cyan)
        ctx.strokeStyle = "#00F0FF";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        history.forEach((d, i) => {
            const x = pad + (i / (history.length - 1)) * plotW;
            const y = pad + plotH - (d.best_fitness / maxFit) * plotH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Plot Average Fitness (Purple)
        ctx.strokeStyle = "#A78BFA";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        history.forEach((d, i) => {
            const x = pad + (i / (history.length - 1)) * plotW;
            const y = pad + plotH - (d.avg_fitness / maxFit) * plotH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Legend
        ctx.fillStyle = "#00F0FF";
        ctx.fillText("■ Best Fitness", pad + 10, h - 10);
        ctx.fillStyle = "#A78BFA";
        ctx.fillText("--- Avg Fitness", pad + 110, h - 10);
    }

    async executeKnapsack() {
        const cap = parseInt(document.getElementById('input-ga-capacity')?.value || "50", 10);
        try {
            const res = await fetch('/api/optimization/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    technique: "Knapsack_DP",
                    capacity: cap
                })
            });
            const data = await res.json();
            if (!data.success) {
                window.showToast('Knapsack failed', 'error');
                return;
            }

            const table = document.getElementById('knapsack-compare-table-body');
            if (table) {
                table.innerHTML = `
                    <tr>
                        <td><strong>${data.dp.method}</strong></td>
                        <td><span class="badge-code badge-green">${data.dp.total_value}</span></td>
                        <td>${data.dp.total_weight} / ${data.dp.capacity}</td>
                        <td>${data.dp.selected_items.length} items</td>
                        <td><span class="badge-code badge-cyan">${data.dp.time_microseconds.toFixed(1)} µs</span></td>
                        <td><span class="badge-code badge-green">Exact Optimum</span></td>
                    </tr>
                    <tr>
                        <td><strong>${data.greedy.method}</strong></td>
                        <td><span class="badge-code badge-purple">${data.greedy.total_value}</span></td>
                        <td>${data.greedy.total_weight} / ${data.greedy.capacity}</td>
                        <td>${data.greedy.selected_items.length} items</td>
                        <td><span class="badge-code badge-cyan">${data.greedy.time_microseconds.toFixed(1)} µs</span></td>
                        <td><span class="badge-code badge-orange">Heuristic Approx</span></td>
                    </tr>
                `;
            }
            document.getElementById('knapsack-compare-card')?.classList.remove('hidden');
            window.showToast('Computed DP and Greedy knapsack solutions.', 'success');
        } catch (err) {
            window.showToast('Error running Knapsack optimization.', 'error');
        }
    }

    // ==========================================
    // 5. PARALLEL & RANDOMIZED CONTROLLER
    // ==========================================
    bindParallelRandomEvents() {
        document.getElementById('btn-run-parallel-search')?.addEventListener('click', () => this.executeParallelSearch());
        document.getElementById('btn-run-random-sort')?.addEventListener('click', () => this.executeRandomSort());
        document.getElementById('btn-run-quickselect')?.addEventListener('click', () => this.executeQuickSelect());
    }

    async executeParallelSearch() {
        const textInput = document.getElementById('par-search-text');
        const patternInput = document.getElementById('input-par-pattern');
        const workersSelect = document.getElementById('select-par-workers');

        const text = textInput ? textInput.value : this.currentCorpus;
        const pattern = patternInput ? patternInput.value.trim() : "algorithm";
        const workers = workersSelect ? parseInt(workersSelect.value, 10) : 4;

        if (!text || !pattern) {
            window.showToast('Text and search pattern required.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/parallel/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    pattern: pattern,
                    workers: workers
                })
            });
            const data = await res.json();
            if (!data.success) {
                window.showToast('Parallel search failed', 'error');
                return;
            }

            document.getElementById('stat-par-speedup').textContent = `${data.speedup}x`;
            document.getElementById('stat-par-seq-time').textContent = `${data.sequential_time_us} µs`;
            document.getElementById('stat-par-par-time').textContent = `${data.parallel_time_us} µs`;
            document.getElementById('stat-par-matches').textContent = data.match_count;

            const partTable = document.getElementById('par-partitions-table-body');
            if (partTable && data.partitions) {
                partTable.innerHTML = data.partitions.map(p => `
                    <tr>
                        <td><strong>Worker #${p.worker_id}</strong></td>
                        <td><span class="badge-code badge-cyan">${p.matches_found}</span></td>
                        <td>${p.comparisons.toLocaleString()}</td>
                        <td>Active Concurrent Thread</td>
                    </tr>
                `).join('');
            }
            window.showToast(`Parallel search complete with ${data.speedup}x speedup.`, 'success');
        } catch (err) {
            window.showToast('Error during parallel search.', 'error');
        }
    }

    async executeRandomSort() {
        const text = this.currentCorpus || "Bohol Island State University Computer Science";
        try {
            const res = await fetch('/api/randomized/quicksort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, split_mode: "words" })
            });
            const data = await res.json();
            if (!data.success) return;

            document.getElementById('random-sort-comps').textContent = data.comparisons.toLocaleString();
            document.getElementById('random-sort-depth').textContent = data.recursion_depth;
            document.getElementById('random-sort-time').textContent = `${data.time_microseconds} µs`;
            document.getElementById('random-sort-output').textContent = (data.sorted_sample || []).join(' | ');
            window.showToast(`Randomized Quicksort sorted ${data.original_count} tokens.`, 'success');
        } catch (err) {
            window.showToast('Error running Randomized Quicksort.', 'error');
        }
    }

    async executeQuickSelect() {
        const k = parseInt(document.getElementById('input-quickselect-k')?.value || "0", 10);
        const tokens = (this.currentCorpus || "apple banana cherry date elderberry fig").split(/\s+/);

        try {
            const res = await fetch('/api/randomized/quickselect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: tokens, k: Math.min(k, tokens.length - 1) })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('quickselect-result').textContent = `Rank k=${data.k} Element: "${data.element}" (${data.time_microseconds} µs)`;
                window.showToast(`QuickSelect resolved rank ${data.k} in O(n) expected time.`, 'success');
            }
        } catch (err) {
            window.showToast('Quickselect error.', 'error');
        }
    }

    // ==========================================
    // 6. PERFORMANCE & COMPLEXITY CONTROLLER
    // ==========================================
    bindPerformanceEvents() {
        document.getElementById('btn-run-full-benchmark')?.addEventListener('click', () => this.executeFullBenchmark());
        document.getElementById('input-filter-complexity')?.addEventListener('input', (e) => this.filterComplexityTable(e.target.value));
    }

    async fetchComplexityMatrix() {
        try {
            const res = await fetch('/api/complexity/matrix');
            const data = await res.json();
            if (data.records) {
                this.renderComplexityTable(data.records);
            }
        } catch (err) {
            console.error('Failed to load complexity matrix', err);
        }
    }

    renderComplexityTable(records) {
        const tbody = document.getElementById('complexity-matrix-table-body');
        if (!tbody) return;

        tbody.innerHTML = records.map(r => `
            <tr>
                <td><span class="badge-code badge-purple">${r.category}</span></td>
                <td><strong>${r.name}</strong></td>
                <td><span class="badge-code badge-green">${r.time_best}</span></td>
                <td><span class="badge-code badge-cyan">${r.time_avg}</span></td>
                <td><span class="badge-code ${r.time_worst.includes('²') || r.time_worst.includes('· m') ? 'badge-orange' : 'badge-cyan'}">${r.time_worst}</span></td>
                <td><span class="badge-code badge-purple">${r.space_aux}</span></td>
                <td style="font-size:0.75rem; color:#94A3B8; max-width:280px;">${r.analysis}</td>
            </tr>
        `).join('');
    }

    filterComplexityTable(query) {
        const q = (query || "").toLowerCase();
        document.querySelectorAll('#complexity-matrix-table-body tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    }

    async executeFullBenchmark() {
        window.showToast('Initiating full system benchmark suite...', 'info');
        try {
            const res = await fetch('/api/benchmark/full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: this.currentCorpus, pattern: "algorithm" })
            });
            const data = await res.json();
            if (data.success) {
                const reportArea = document.getElementById('full-benchmark-report');
                if (reportArea) {
                    reportArea.classList.remove('hidden');
                    reportArea.innerHTML = `
                        <div class="glass-card" style="margin-top:16px;">
                            <div class="card-header-small"><span class="stats-card-title">BENCHMARK EXECUTION TELEMETRY</span></div>
                            <div style="font-size:0.85rem; color:#E2E8F0; line-height:1.7;">
                                <p><strong>Corpus Length:</strong> ${data.text_length.toLocaleString()} characters | <strong>Target Pattern:</strong> "${data.pattern}"</p>
                                <p><strong>Pattern Matchers:</strong> KMP executed in ${data.pattern_matching?.results?.find(r => r.algorithm.includes('KMP'))?.time_microseconds} µs vs Brute Force in ${data.pattern_matching?.results?.find(r => r.algorithm.includes('Brute'))?.time_microseconds} µs.</p>
                                <p><strong>Parallel Search Speedup:</strong> ${data.parallel_speedup?.speedup}x faster across 4 thread workers.</p>
                                <p><strong>Compression:</strong> Huffman (${data.compression?.find(c => c.method?.includes('Huffman'))?.space_savings}% space savings), LZW (${data.compression?.find(c => c.method?.includes('LZW'))?.space_savings}% space savings).</p>
                            </div>
                        </div>
                    `;
                }
                window.showToast('Full system benchmark concluded successfully!', 'success');
            }
        } catch (err) {
            window.showToast('Benchmark failed.', 'error');
        }
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.textSuite = new TextSuiteController();
});

