/**
 * Intelligent Text Search, Compression, and Optimization Suite UI Controller
 * Bohol Island State University (BISU) Final Project
 * Offline / Localhost Only Ready with Rich Educational Telemetry & Flow Breakdowns
 */

class TextSuiteController {
    constructor() {
        this.currentCorpus = "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness, it was the spring of hope, it was the winter of despair. We had everything before us, we had nothing before us, we were all going direct to heaven, we were all going direct the other way.\n\nIn computational science, algorithms represent systematic sequences of unambiguous instructions designed to perform specific calculations, data processing, and automated reasoning tasks. Pattern matching algorithms such as Knuth-Morris-Pratt and Boyer-Moore optimize information retrieval across vast text repositories. Data compression algorithms such as Huffman coding and LZW maximize channel throughput and minimize storage footprints. Through algorithmic optimization and parallel computing, modern information systems achieve scalable efficiency across distributed computational architectures.";
        this.samples = [];
        this.currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'en';
        this.lastResults = {
            pattern: null,
            compression: null,
            compressionComparison: null,
            ga: null,
            knapsack: null,
            parallelSearch: null,
            randomSort: null,
            quickSelect: null
        };
        this.init();
    }

    init() {
        this.bindLanguageSwitcher();
        this.bindDatasetEvents();
        this.bindPatternEvents();
        this.bindCompressionEvents();
        this.bindOptimizationEvents();
        this.bindParallelRandomEvents();
        this.bindPerformanceEvents();
        this.fetchSampleDatasets();
        this.fetchComplexityMatrix();
        this.updateCorpusText(this.currentCorpus);
        this.updateLanguageBadges(this.currentLang);
        this.updatePlaceholderFlows(this.currentLang);
    }

    // ==========================================
    // MULTILINGUAL (I18N) SWITCHER & HELPERS
    // ==========================================
    bindLanguageSwitcher() {
        document.querySelectorAll('.lang-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.dataset.lang;
                if (lang && window.setLanguage) {
                    window.setLanguage(lang);
                }
            });
        });

        window.addEventListener('languageChanged', (e) => {
            const lang = e.detail?.lang || 'en';
            this.onLanguageChanged(lang);
        });
    }

    onLanguageChanged(lang) {
        this.currentLang = lang;
        this.updateLanguageBadges(lang);
        this.updatePlaceholderFlows(lang);

        // Instant re-render of active results with zero network roundtrips
        if (this.lastResults.pattern) {
            const { data, text, pattern } = this.lastResults.pattern;
            this.renderPatternResults(data, text, pattern);
        }
        if (this.lastResults.compression) {
            this.renderCompressionStats(this.lastResults.compression);
        }
        if (this.lastResults.compressionComparison) {
            this.renderCompressionComparisonFlow(this.lastResults.compressionComparison);
        }
        if (this.lastResults.ga) {
            this.renderGAResults(this.lastResults.ga);
        }
        if (this.lastResults.knapsack) {
            this.renderKnapsackFlow(this.lastResults.knapsack);
        }
        if (this.lastResults.parallelSearch) {
            this.renderParallelSearchFlow(this.lastResults.parallelSearch);
        }
        if (this.lastResults.randomSort) {
            this.renderRandomSortFlow(this.lastResults.randomSort);
        }
        if (this.lastResults.quickSelect) {
            this.renderQuickSelectFlow(this.lastResults.quickSelect);
        }

        const langName = (window.I18N_LANGUAGES || []).find(l => l.code === lang)?.name || lang;
        window.showToast?.(`Explanations switched to ${langName}.`, 'info');
    }

    updateLanguageBadges(lang) {
        const langObj = (window.I18N_LANGUAGES || []).find(l => l.code === lang) || { flag: '🇺🇸', name: 'English' };
        const badgeText = `${langObj.flag} ${langObj.name}`;
        document.querySelectorAll('.flow-card-lang-indicator').forEach(el => {
            el.textContent = badgeText;
        });

        document.querySelectorAll('.lang-pill').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updatePlaceholderFlows(lang) {
        const placeholders = {
            en: {
                pattern: 'Select any algorithm above and click "Search" to view the complete step-by-step breakdown of how and why the output was produced.',
                compression: 'Click "▶ Compress Text" or "⚡ Compare All 3 Methods" to see why file sizes change, how codebooks/dictionaries are structured, and why decompression is 100% lossless.',
                optimization: 'Click "▶ Run Genetic Algorithm" or "Compare DP vs Greedy" to see how fitness scores evolve across generations and why Dynamic Programming guarantees global optimality.',
                parallel: 'Click "▶ Execute Parallel Search" or "▶ Run Randomized QuickSort" to see how thread chunks handle boundary overlaps and how uniform random pivots prevent O(n²) worst-case slowdowns.'
            },
            tl: {
                pattern: 'Piliin ang alinmang algorithm sa itaas at pindutin ang "Search" upang makita ang buong step-by-step breakdown kung paano at bakit nito nakuha ang nasabing output.',
                compression: 'Pindutin ang "▶ Compress Text" o "⚡ Compare All 3 Methods" upang makita ang buong paliwanag kung bakit lumiliit ang file, paano nabuo ang prefix codebook o diksyunaryo, at bakit 100% lossless ang decompression.',
                optimization: 'Pindutin ang "▶ Run Genetic Algorithm" o "Compare DP vs Greedy" upang makita ang buong paliwanag kung paano nag-evolve ang fitness score bawat henerasyon at bakit guaranteed global optimum ang Dynamic Programming table.',
                parallel: 'Pindutin ang "▶ Execute Parallel Search" o "▶ Run Randomized QuickSort" upang makita kung paano gumana ang boundary overlap margins sa thread chunks at bakit napigilan ng uniform random pivots ang O(n²) worst-case slowdown.'
            },
            ceb: {
                pattern: 'Pilia ang bisan unsa nga algorithm sa ibabaw ug pindota ang "Search" aron makita ang tibuok lakang-sa-lakang nga katin-awan kon giunsa ug ngano nga nakuha ang maong resulta.',
                compression: 'Pindota ang "▶ Compress Text" o "⚡ Compare All 3 Methods" aron makita kon ngano nimenos ang gidak-on sa file, giunsa paghimo ang codebook/diksyunaryo, ug ngano nga 100% lossless ang decompression.',
                optimization: 'Pindota ang "▶ Run Genetic Algorithm" o "Compare DP vs Greedy" aron makita kon giunsa pag-uswag ang fitness score sa matag henerasyon ug ngano nga garantisadong global optimum ang Dynamic Programming.',
                parallel: 'Pindota ang "▶ Execute Parallel Search" o "▶ Run Randomized QuickSort" aron makita kon giunsa paglihok sa boundary overlap margin sa mga tipak ug ngano nga ang random pivots nakapugong sa O(n²) worst-case nga paghinay.'
            }
        };

        const ph = placeholders[lang] || placeholders.en;
        if (!this.lastResults.pattern) {
            const el = document.getElementById('pattern-flow-content');
            if (el) el.innerHTML = `<div class="flow-summary-banner">${ph.pattern}</div>`;
        }
        if (!this.lastResults.compression && !this.lastResults.compressionComparison) {
            const el = document.getElementById('compression-flow-content');
            if (el) el.innerHTML = `<div class="flow-summary-banner">${ph.compression}</div>`;
        }
        if (!this.lastResults.ga && !this.lastResults.knapsack) {
            const el = document.getElementById('optimization-flow-content');
            if (el) el.innerHTML = `<div class="flow-summary-banner">${ph.optimization}</div>`;
        }
        if (!this.lastResults.parallelSearch && !this.lastResults.randomSort && !this.lastResults.quickSelect) {
            const el = document.getElementById('parallel-flow-content');
            if (el) el.innerHTML = `<div class="flow-summary-banner">${ph.parallel}</div>`;
        }
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
        if (window.lucide) lucide.createIcons();

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
        this.lastResults.pattern = { data, text, pattern };

        const summaryBox = document.getElementById('pattern-results-summary');
        const highlightBox = document.getElementById('pattern-highlight-viewer');
        const compTable = document.getElementById('pattern-comparison-table-body');
        const flowContainer = document.getElementById('pattern-flow-content');

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

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
                        <td><span class="badge-code badge-cyan">${r.match_count} ${ui?.matches_found || 'matches'}</span></td>
                        <td><span class="badge-code badge-purple">${r.comparisons.toLocaleString()}</span></td>
                        <td><span class="badge-code badge-green">${r.time_microseconds.toFixed(1)} µs</span></td>
                        <td style="font-size:0.75rem; color:#94A3B8;">${r.details || '-'}</td>
                    </tr>
                `).join('');
            }
            document.getElementById('pattern-comparison-card')?.classList.remove('hidden');

            // Render Comparison Educational Flow
            if (flowContainer && i18n) {
                const kmpRes = data.results.find(r => r.algorithm.includes('KMP'));
                const bmRes = data.results.find(r => r.algorithm.includes('Boyer'));
                const bfRes = data.results.find(r => r.algorithm.includes('Brute'));
                const rkRes = data.results.find(r => r.algorithm.includes('Rabin'));

                const summaryText = window.formatI18nText(i18n.pattern_comparison_summary, {
                    kmp_comps: kmpRes?.comparisons || 0,
                    bm_comps: bmRes?.comparisons || 0,
                    bf_comps: bfRes?.comparisons || 0,
                    rk_comps: rkRes?.comparisons || 0
                });

                flowContainer.innerHTML = `
                    <div class="flow-summary-banner">
                        <strong>${ui?.summary_title || 'Summary'}:</strong> ${summaryText}
                    </div>

                    <div class="flow-step-list">
                        <!-- KMP -->
                        <div class="flow-step-item">
                            <span class="flow-step-num">KMP</span>
                            <div class="flow-step-content">
                                <strong>${i18n.kmp.title}</strong>
                                <p style="margin:4px 0;">${window.formatI18nText(i18n.kmp.why, { match_count: kmpRes?.match_count || 0, comparisons: kmpRes?.comparisons || 0 })}</p>
                                <div style="font-size:0.78rem; color:#94A3B8; margin-top:4px;">
                                    ${i18n.kmp.steps.map(s => `<div>• ${window.formatI18nText(s, { pattern: pattern, lps: (kmpRes?.lps_table || []).join(', ') })}</div>`).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Boyer-Moore -->
                        <div class="flow-step-item">
                            <span class="flow-step-num">BM</span>
                            <div class="flow-step-content">
                                <strong>${i18n.boyer_moore.title}</strong>
                                <p style="margin:4px 0;">${window.formatI18nText(i18n.boyer_moore.why, { match_count: bmRes?.match_count || 0, comparisons: bmRes?.comparisons || 0, pattern_len: pattern.length })}</p>
                                <div style="font-size:0.78rem; color:#94A3B8; margin-top:4px;">
                                    ${i18n.boyer_moore.steps.map(s => `<div>• ${window.formatI18nText(s, { pattern: pattern, pattern_len: pattern.length })}</div>`).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Rabin-Karp -->
                        <div class="flow-step-item">
                            <span class="flow-step-num">RK</span>
                            <div class="flow-step-content">
                                <strong>${i18n.rabin_karp.title}</strong>
                                <p style="margin:4px 0;">${window.formatI18nText(i18n.rabin_karp.why, { match_count: rkRes?.match_count || 0, comparisons: rkRes?.comparisons || 0, spurious_hits: rkRes?.spurious_hits || 0 })}</p>
                                <div style="font-size:0.78rem; color:#94A3B8; margin-top:4px;">
                                    ${i18n.rabin_karp.steps.map(s => `<div>• ${window.formatI18nText(s, { pattern: pattern, pattern_hash: rkRes?.pattern_hash || '-' })}</div>`).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Brute Force -->
                        <div class="flow-step-item">
                            <span class="flow-step-num">BF</span>
                            <div class="flow-step-content">
                                <strong>${i18n.brute_force.title}</strong>
                                <p style="margin:4px 0;">${window.formatI18nText(i18n.brute_force.why, { match_count: bfRes?.match_count || 0, comparisons: bfRes?.comparisons || 0 })}</p>
                                <div style="font-size:0.78rem; color:#94A3B8; margin-top:4px;">
                                    ${i18n.brute_force.steps.map(s => `<div>• ${s}</div>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

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
                        <td><span class="badge-code badge-cyan">${matchCount} ${ui?.matches_found || 'matches'}</span></td>
                        <td><span class="badge-code badge-purple">${comparisons.toLocaleString()}</span></td>
                        <td><span class="badge-code badge-green">${timeUs.toFixed(1)} µs</span></td>
                        <td style="font-size:0.75rem; color:#94A3B8;">${r.details || '-'}</td>
                    </tr>
                `;
            }
            document.getElementById('pattern-comparison-card')?.classList.remove('hidden');

            // Render Single Algorithm Flow
            if (flowContainer && i18n) {
                let algoKey = 'kmp';
                if (r.algorithm.includes('Boyer')) algoKey = 'boyer_moore';
                else if (r.algorithm.includes('Rabin')) algoKey = 'rabin_karp';
                else if (r.algorithm.includes('Brute')) algoKey = 'brute_force';
                else if (r.algorithm.includes('Approximate')) algoKey = 'approximate';

                const entry = i18n[algoKey] || i18n.kmp;
                const whyText = window.formatI18nText(entry.why, {
                    match_count: matchCount,
                    comparisons: comparisons,
                    pattern: pattern,
                    pattern_len: pattern.length,
                    lps: (r.lps_table || []).join(', '),
                    pattern_hash: r.pattern_hash || '-',
                    spurious_hits: r.spurious_hits || 0,
                    max_distance: r.max_distance || 2
                });

                let extraHtml = '';
                if (r.lps_breakdown && r.lps_breakdown.length > 0) {
                    extraHtml = `
                        <div style="margin-top:10px;">
                            <span style="font-size:0.75rem; color:#94A3B8;">LPS Table Breakdown (Prefix = Suffix length):</span>
                            <div class="chips-flex-wrap">
                                ${r.lps_breakdown.map(b => `<span class="chip-item"><span class="chip-key">${b.char}[${b.index}]</span>: <span class="chip-val">${b.lps_val}</span></span>`).join('')}
                            </div>
                        </div>
                    `;
                } else if (r.bad_char_table) {
                    const entries = Object.entries(r.bad_char_table);
                    extraHtml = `
                        <div style="margin-top:10px;">
                            <span style="font-size:0.75rem; color:#94A3B8;">Bad Character Shift Distances:</span>
                            <div class="chips-flex-wrap">
                                ${entries.map(([k, v]) => `<span class="chip-item"><span class="chip-key">'${k}'</span>: <span class="chip-val">+${v} shifts</span></span>`).join('')}
                            </div>
                        </div>
                    `;
                }

                const stepsHtml = entry.steps.map((st, idx) => {
                    const formattedStep = window.formatI18nText(st, {
                        pattern: pattern,
                        pattern_len: pattern.length,
                        lps: (r.lps_table || []).join(', '),
                        pattern_hash: r.pattern_hash || '-',
                        max_distance: r.max_distance || 2
                    });
                    return `
                        <div class="flow-step-item">
                            <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                            <div class="flow-step-content">
                                <p style="margin:0;">${formattedStep}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                flowContainer.innerHTML = `
                    <div class="flow-summary-banner">
                        <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                    </div>
                    <div class="flow-step-list">
                        ${stepsHtml}
                    </div>
                    ${extraHtml}
                `;
            }
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

        if (window.lucide) lucide.createIcons();
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
            html += this.escapeHtml(text.substring(lastIdx, idx));
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
        document.getElementById('select-comp-method')?.addEventListener('change', () => this.executeCompression());
        document.getElementById('nav-compression')?.addEventListener('click', () => {
            if (!this.lastResults.compression && !this.lastResults.compressionComparison) {
                setTimeout(() => this.executeCompression(), 120);
            }
        });
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

            document.getElementById('comp-compare-all-card')?.classList.add('hidden');
            this.renderCompressionStats(data);
            window.showToast(`${data.method || method} compression completed. Lossless: ${data.is_lossless}`, 'success');
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

            this.lastResults.compressionComparison = data;
            this.lastResults.compression = null; // clear single mode
            this.renderCompressionComparisonFlow(data);

            window.showToast('Generated multi-method compression comparison.', 'success');
        } catch (err) {
            window.showToast('Comparison failed.', 'error');
        }
    }

    renderCompressionComparisonFlow(data) {
        const flowContainer = document.getElementById('compression-flow-content');
        if (!flowContainer) return;

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

        if (i18n && i18n.compression_compare_summary) {
            flowContainer.innerHTML = `
                <div class="flow-summary-banner" style="white-space:pre-line; line-height: 1.6;">
                    <strong>${ui?.summary_title || 'Summary'}:</strong>\n${i18n.compression_compare_summary}
                </div>
            `;
        }
    }

    renderCompressionStats(data) {
        this.lastResults.compression = data;
        this.lastResults.compressionComparison = null; // clear comparison mode

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

        document.getElementById('comp-stat-orig-size').textContent = `${data.original_bytes?.toLocaleString()} B`;
        document.getElementById('comp-stat-comp-size').textContent = `${data.compressed_bytes?.toLocaleString()} B`;
        document.getElementById('comp-stat-ratio').textContent = `${data.compression_ratio}%`;
        document.getElementById('comp-stat-savings').textContent = `${data.space_savings}%`;

        const ratioFill = document.getElementById('comp-ratio-progress');
        if (ratioFill) {
            const clamped = Math.min(100, Math.max(0, data.compression_ratio));
            ratioFill.style.width = `${clamped}%`;
        }

        const badge = document.getElementById('comp-lossless-badge');
        if (badge) {
            badge.className = data.is_lossless ? 'badge-code badge-green' : 'badge-code badge-orange';
            badge.textContent = data.is_lossless ? '✓ 100% Lossless Verified' : '✗ Integrity Mismatch';
        }

        // Render Codebook / Dictionary / Encoded stream
        const detailsContainer = document.getElementById('comp-method-details');
        if (detailsContainer) {
            const isHuffman = data.method && (data.method.includes('Huffman') || data.method === 'Huffman');
            const isRLE = data.method && (data.method.includes('Run-Length') || data.method.includes('RLE'));
            const isLZW = data.method && (data.method.includes('LZW'));

            if (isHuffman && data.codebook) {
                detailsContainer.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:0.8rem; font-weight:600; color:#00F0FF;">
                            ${ui?.codebook_lbl || 'Huffman Codebook Table'} (${data.codebook.length} unique symbols):
                        </span>
                        <span class="badge-code badge-cyan">${data.compressed_bytes} bytes (${data.total_bits} bits)</span>
                    </div>

                    <div class="codebook-scroll" style="max-height:170px;">
                        <table class="suite-table">
                            <thead><tr><th>Character</th><th>Frequency</th><th>Prefix Bitcode</th><th>Bits</th><th>Bit Savings</th></tr></thead>
                            <tbody>
                                ${data.codebook.map(c => `
                                    <tr>
                                        <td><code>${c.char === ' ' ? '[space]' : (c.char === '\n' ? '[newline]' : c.char)}</code></td>
                                        <td>${c.freq}</td>
                                        <td><code class="badge-code badge-cyan">${c.code}</code></td>
                                        <td>${c.bits}</td>
                                        <td><span class="badge-code ${c.saved_bits_per_char > 0 ? 'badge-green' : 'badge-purple'}">${c.saved_bits_per_char > 0 ? '+' : ''}${c.saved_bits_per_char} bits</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="form-group mt-3">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <label class="form-label" style="margin:0;">Compressed Binary Bitstream (${data.total_bits} bits):</label>
                            <button id="btn-copy-bitstream" class="btn btn-dark-outline btn-sm" style="font-size:0.72rem; padding:2px 8px;">
                                📋 Copy Bitstream
                            </button>
                        </div>
                        <div class="terminal-preview-box" style="word-break:break-all; font-size:0.78rem; color:#00F0FF; max-height:100px; overflow-y:auto;">${data.encoded_bits}</div>
                    </div>

                    <div class="form-group mt-2">
                        <label class="form-label" style="margin-bottom:4px; font-size:0.75rem; color:#94A3B8;">100% Lossless Round-Trip Decompressed Preview:</label>
                        <div class="terminal-preview-box" style="font-size:0.78rem; color:#00FF9D; max-height:70px; overflow-y:auto;">${this.escapeHtml(data.decompressed_preview || '')}</div>
                    </div>
                `;

                document.getElementById('btn-copy-bitstream')?.addEventListener('click', () => {
                    navigator.clipboard.writeText(data.encoded_bits || '');
                    window.showToast?.('Copied full Huffman bitstream to clipboard!', 'success');
                });

            } else if (isRLE) {
                detailsContainer.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:0.8rem; font-weight:600; color:#00FF9D;">
                            Encoded RLE Stream (${data.runs_count} ${ui?.runs_lbl || 'run segments'} | Longest run: ${data.longest_run}):
                        </span>
                        <span class="badge-code badge-green">${data.compressed_bytes} bytes</span>
                    </div>

                    <div class="form-group mt-2">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <label class="form-label" style="margin:0;">Compressed Output String [Count][Char]:</label>
                            <button id="btn-copy-rle" class="btn btn-dark-outline btn-sm" style="font-size:0.72rem; padding:2px 8px;">
                                📋 Copy Output
                            </button>
                        </div>
                        <div class="terminal-preview-box" style="max-height:170px; overflow-y:auto; word-break:break-all; font-size:0.82rem; color:#00FF9D;">${this.escapeHtml(data.encoded_text || '')}</div>
                    </div>

                    <div class="form-group mt-2">
                        <label class="form-label" style="margin-bottom:4px; font-size:0.75rem; color:#94A3B8;">100% Lossless Round-Trip Decompressed Preview:</label>
                        <div class="terminal-preview-box" style="font-size:0.78rem; color:#00FF9D; max-height:70px; overflow-y:auto;">${this.escapeHtml(data.decompressed_preview || '')}</div>
                    </div>
                `;

                document.getElementById('btn-copy-rle')?.addEventListener('click', () => {
                    navigator.clipboard.writeText(data.encoded_text || '');
                    window.showToast?.('Copied RLE compressed stream to clipboard!', 'success');
                });

            } else if (isLZW) {
                detailsContainer.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:0.8rem; font-weight:600; color:#A78BFA;">
                            LZW ${ui?.dictionary_lbl || 'Dynamic Dictionary'} (${data.dictionary_size} entries | ${data.code_bit_width}-bit codes):
                        </span>
                        <span class="badge-code badge-purple">${data.compressed_bytes} bytes</span>
                    </div>

                    <div class="codebook-scroll" style="max-height:160px;">
                        <table class="suite-table">
                            <thead><tr><th>Step</th><th>Current (W)</th><th>Next (K)</th><th>New Entry (W+K)</th><th>Assigned Code</th><th>Emitted</th></tr></thead>
                            <tbody>
                                ${(data.sample_dictionary_entries || []).map(e => `
                                    <tr>
                                        <td>${e.step}</td>
                                        <td><code>${this.escapeHtml(e.current_str)}</code></td>
                                        <td><code>${this.escapeHtml(e.next_char)}</code></td>
                                        <td><strong style="color:#00F0FF;">${this.escapeHtml(e.new_entry)}</strong></td>
                                        <td><span class="badge-code badge-purple">${e.new_code}</span></td>
                                        <td><span class="badge-code badge-cyan">${e.emitted_code}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="form-group mt-3">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <label class="form-label" style="margin:0;">Emitted LZW Integer Token Codes (${(data.codes || []).length} total codes):</label>
                            <button id="btn-copy-lzw" class="btn btn-dark-outline btn-sm" style="font-size:0.72rem; padding:2px 8px;">
                                📋 Copy Codes
                            </button>
                        </div>
                        <div class="terminal-preview-box" style="font-size:0.8rem; color:#A78BFA; max-height:85px; overflow-y:auto; word-break:break-all;">${(data.codes || []).join(', ')}</div>
                    </div>

                    <div class="form-group mt-2">
                        <label class="form-label" style="margin-bottom:4px; font-size:0.75rem; color:#94A3B8;">100% Lossless Round-Trip Decompressed Preview:</label>
                        <div class="terminal-preview-box" style="font-size:0.78rem; color:#00FF9D; max-height:70px; overflow-y:auto;">${this.escapeHtml(data.decompressed_preview || '')}</div>
                    </div>
                `;

                document.getElementById('btn-copy-lzw')?.addEventListener('click', () => {
                    navigator.clipboard.writeText((data.codes || []).join(', '));
                    window.showToast?.('Copied LZW codes to clipboard!', 'success');
                });
            }
        }

        // Render Educational Flow Breakdown
        const flowContainer = document.getElementById('compression-flow-content');
        if (flowContainer && i18n) {
            let compKey = 'huffman';
            if (data.method.includes('Run-Length')) compKey = 'rle';
            else if (data.method.includes('LZW')) compKey = 'lzw';

            const cEntry = i18n[compKey] || i18n.huffman;
            const whyText = window.formatI18nText(cEntry.why, {
                orig_bytes: data.original_bytes?.toLocaleString(),
                comp_bytes: data.compressed_bytes?.toLocaleString(),
                compression_ratio: data.compression_ratio,
                space_savings: data.space_savings,
                symbol_count: data.codebook ? data.codebook.length : 0,
                runs_count: data.runs_count || 0,
                longest_run: data.longest_run || 0,
                dictionary_size: data.dictionary_size || 0,
                codes_count: data.codes ? data.codes.length : 0,
                bit_width: data.code_bit_width || 12
            });

            const stepsHtml = cEntry.steps.map((st, idx) => {
                return `
                    <div class="flow-step-item">
                        <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                        <div class="flow-step-content">
                            <p style="margin:0;">${st}</p>
                        </div>
                    </div>
                `;
            }).join('');

            flowContainer.innerHTML = `
                <div class="flow-summary-banner">
                    <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                </div>
                <div class="flow-step-list">
                    ${stepsHtml}
                    <div class="flow-step-item">
                        <span class="flow-step-num">${ui?.lossless_title || 'Lossless Verification'}</span>
                        <div class="flow-step-content">
                            <p style="margin:0;"><strong>${data.is_lossless ? '✓ Verified 100% Exact Match' : '✗ Integrity Mismatch'}</strong></p>
                            <p style="margin:4px 0; font-size:0.75rem; color:#94A3B8;">Decompressed Preview: <code>"${this.escapeHtml(data.decompressed_preview || '')}"</code></p>
                        </div>
                    </div>
                </div>
            `;
        }

        if (window.lucide) lucide.createIcons();
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
        this.lastResults.ga = data;
        this.lastResults.knapsack = null;

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

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

        // Render Educational Flow Breakdown
        const flowContainer = document.getElementById('optimization-flow-content');
        if (flowContainer && i18n) {
            const gEntry = i18n.genetic_algorithm;
            const whyText = window.formatI18nText(gEntry.why, {
                generations: data.generations,
                population_size: data.population_size,
                initial_fitness: data.initial_fitness,
                final_fitness: data.final_fitness,
                optimality_ratio: data.comparison?.optimality_ratio || 100,
                capacity: data.capacity,
                cx_rate: data.crossover_rate,
                mut_rate: data.mutation_rate
            });

            const stepsHtml = gEntry.steps.map((st, idx) => {
                const formatted = window.formatI18nText(st, {
                    population_size: data.population_size,
                    capacity: data.capacity,
                    cx_rate: data.crossover_rate,
                    mut_rate: data.mutation_rate
                });
                return `
                    <div class="flow-step-item">
                        <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                        <div class="flow-step-content">
                            <p style="margin:0;">${formatted}</p>
                        </div>
                    </div>
                `;
            }).join('');

            flowContainer.innerHTML = `
                <div class="flow-summary-banner">
                    <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                </div>
                <div class="flow-step-list">
                    ${stepsHtml}
                </div>
            `;
        }

        if (window.lucide) lucide.createIcons();
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

            this.lastResults.knapsack = data;
            this.lastResults.ga = null;
            this.renderKnapsackFlow(data);

            window.showToast('Computed DP and Greedy knapsack solutions.', 'success');
        } catch (err) {
            window.showToast('Error running Knapsack optimization.', 'error');
        }
    }

    renderKnapsackFlow(data) {
        const flowContainer = document.getElementById('optimization-flow-content');
        if (!flowContainer) return;

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

        if (i18n && i18n.knapsack_dp_greedy) {
            const kEntry = i18n.knapsack_dp_greedy;
            const whyText = window.formatI18nText(kEntry.why, {
                dp_val: data.dp.total_value,
                greedy_val: data.greedy.total_value,
                optimality_ratio: ((data.greedy.total_value / Math.max(1, data.dp.total_value)) * 100).toFixed(1)
            });

            const stepsHtml = kEntry.steps.map((st, idx) => `
                <div class="flow-step-item">
                    <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                    <div class="flow-step-content">
                        <p style="margin:0;">${st}</p>
                    </div>
                </div>
            `).join('');

            flowContainer.innerHTML = `
                <div class="flow-summary-banner">
                    <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                </div>
                <div class="flow-step-list">
                    ${stepsHtml}
                </div>
            `;
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
                        <td><code>${p.chunk_range}</code></td>
                    </tr>
                `).join('');
            }

            this.lastResults.parallelSearch = data;
            this.lastResults.randomSort = null;
            this.lastResults.quickSelect = null;
            this.renderParallelSearchFlow(data);

            window.showToast(`Parallel search complete with ${data.speedup}x speedup.`, 'success');
        } catch (err) {
            window.showToast('Error during parallel search.', 'error');
        }
    }

    renderParallelSearchFlow(data) {
        const flowContainer = document.getElementById('parallel-flow-content');
        if (!flowContainer) return;

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

        if (i18n && i18n.parallel_search) {
            const pEntry = i18n.parallel_search;
            const whyText = window.formatI18nText(pEntry.why, {
                workers: data.workers,
                speedup: data.speedup,
                parallel_time: data.parallel_time_us,
                seq_time: data.sequential_time_us
            });

            const stepsHtml = pEntry.steps.map((st, idx) => {
                const formatted = window.formatI18nText(st, {
                    char_count: data.text_length,
                    workers: data.workers,
                    overlap: data.overlap_margin
                });
                return `
                    <div class="flow-step-item">
                        <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                        <div class="flow-step-content">
                            <p style="margin:0;">${formatted}</p>
                        </div>
                    </div>
                `;
            }).join('');

            flowContainer.innerHTML = `
                <div class="flow-summary-banner">
                    <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                </div>
                <div class="flow-step-list">
                    ${stepsHtml}
                </div>
                <div class="chunk-overlap-bar" style="margin-top:12px;">
                    ${(data.partitions || []).map(p => `
                        <div class="chunk-segment">
                            <span>Worker #${p.worker_id}</span>
                            <div style="font-size:0.68rem; color:#94A3B8;">${p.char_length} chars</div>
                            <span class="overlap-badge">+${data.overlap_margin} overlap</span>
                        </div>
                    `).join('')}
                </div>
            `;
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

            this.lastResults.randomSort = data;
            this.lastResults.parallelSearch = null;
            this.lastResults.quickSelect = null;
            this.renderRandomSortFlow(data);

            window.showToast(`Randomized Quicksort sorted ${data.original_count} tokens.`, 'success');
        } catch (err) {
            window.showToast('Error running Randomized Quicksort.', 'error');
        }
    }

    renderRandomSortFlow(data) {
        const flowContainer = document.getElementById('parallel-flow-content');
        if (!flowContainer) return;

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

        if (i18n && i18n.randomized_quicksort) {
            const qsEntry = i18n.randomized_quicksort;
            const whyText = window.formatI18nText(qsEntry.why, {
                count: data.original_count,
                time_us: data.time_microseconds,
                comparisons: data.comparisons?.toLocaleString(),
                depth: data.recursion_depth
            });

            const stepsHtml = qsEntry.steps.map((st, idx) => `
                <div class="flow-step-item">
                    <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                    <div class="flow-step-content">
                        <p style="margin:0;">${st}</p>
                    </div>
                </div>
            `).join('');

            flowContainer.innerHTML = `
                <div class="flow-summary-banner">
                    <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                </div>
                <div class="flow-step-list">
                    ${stepsHtml}
                </div>
                <div style="margin-top:12px;">
                    <span style="font-size:0.75rem; color:#94A3B8;">Sample Random Pivot Choices:</span>
                    <div class="chips-flex-wrap">
                        ${(data.pivot_samples || []).map(ps => `<span class="chip-item">Pivot: <span class="chip-key">"${ps.pivot_value}"</span> (idx: ${ps.chosen_index})</span>`).join('')}
                    </div>
                </div>
            `;
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
                
                this.lastResults.quickSelect = data;
                this.lastResults.parallelSearch = null;
                this.lastResults.randomSort = null;
                this.renderQuickSelectFlow(data);

                window.showToast(`QuickSelect resolved rank ${data.k} in O(n) expected time.`, 'success');
            }
        } catch (err) {
            window.showToast('Quickselect error.', 'error');
        }
    }

    renderQuickSelectFlow(data) {
        const flowContainer = document.getElementById('parallel-flow-content');
        if (!flowContainer) return;

        const lang = this.currentLang || 'en';
        const i18n = window.I18N_EXPLANATIONS ? (window.I18N_EXPLANATIONS[lang] || window.I18N_EXPLANATIONS.en) : null;
        const ui = window.I18N_UI ? (window.I18N_UI[lang] || window.I18N_UI.en) : null;

        if (i18n && i18n.randomized_quickselect) {
            const qselEntry = i18n.randomized_quickselect;
            const whyText = window.formatI18nText(qselEntry.why, {
                k: data.k,
                element: data.element,
                time_us: data.time_microseconds
            });

            const stepsHtml = qselEntry.steps.map((st, idx) => `
                <div class="flow-step-item">
                    <span class="flow-step-num">${ui?.step_lbl || 'Step'} ${idx + 1}</span>
                    <div class="flow-step-content">
                        <p style="margin:0;">${st}</p>
                    </div>
                </div>
            `).join('');

            flowContainer.innerHTML = `
                <div class="flow-summary-banner">
                    <strong>${ui?.why_result_title || 'Why this Result?'}:</strong> ${whyText}
                </div>
                <div class="flow-step-list">
                    ${stepsHtml}
                </div>
            `;
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
                            <div class="card-header-small"><span class="stats-card-title">BENCHMARK EXECUTION TELEMETRY & FLOW SUMMARY</span></div>
                            <div style="font-size:0.85rem; color:#E2E8F0; line-height:1.7;">
                                <p><strong>Corpus Length:</strong> ${data.text_length.toLocaleString()} characters | <strong>Target Pattern:</strong> "${data.pattern}"</p>
                                <p><strong>Pattern Matchers:</strong> KMP executed in ${data.pattern_matching?.results?.find(r => r.algorithm.includes('KMP'))?.time_microseconds} µs vs Brute Force in ${data.pattern_matching?.results?.find(r => r.algorithm.includes('Brute'))?.time_microseconds} µs.</p>
                                <p><strong>Parallel Search Speedup:</strong> ${data.parallel_speedup?.speedup}x faster across 4 thread workers.</p>
                                <p><strong>Compression:</strong> Huffman (${data.compression?.find(c => c.method?.includes('Huffman'))?.space_savings}% space savings), LZW (${data.compression?.find(c => c.method?.includes('LZW'))?.space_savings}% space savings).</p>
                                <p style="color:#00FF9D; font-size:0.8rem; margin-top:8px;">✓ Lahat ng mga algoritmo ay gumana nang lokal at 100% matagumpay.</p>
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
