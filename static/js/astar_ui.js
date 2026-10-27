/**
 * GraphCrypt v1.0 - A* Pathfinding Controller & Visualizer
 * Manages algorithm execution, live telemetry stats, step-by-step playback,
 * and automatic transition to Cryptography workflow.
 */

class AStarUIController {
    constructor(graphEditor) {
        this.editor = graphEditor;
        
        // DOM Elements
        this.selectStart = document.getElementById('select-start-node');
        this.selectGoal = document.getElementById('select-goal-node');
        this.selectHeuristic = document.getElementById('select-heuristic');
        this.btnRun = document.getElementById('btn-run-astar');
        this.btnStep = document.getElementById('btn-step-astar');
        this.btnAutoStep = document.getElementById('btn-auto-step');
        this.btnResetSteps = document.getElementById('btn-reset-steps');
        
        // Stat elements
        this.statNodesVisited = document.getElementById('stat-nodes-visited');
        this.statEdgesEval = document.getElementById('stat-edges-eval');
        this.statPathCost = document.getElementById('stat-path-cost');
        this.statExecTime = document.getElementById('stat-exec-time');
        
        // Log telemetry
        this.logBody = document.getElementById('step-log-body');
        this.stepTag = document.getElementById('step-counter-tag');

        // State
        this.lastResult = null;
        this.currentStepIdx = 0;
        this.autoPlayTimer = null;
        this.isAutoPlaying = false;

        this.initEvents();
    }

    initEvents() {
        this.selectStart.addEventListener('change', () => {
            this.editor.startNodeId = this.selectStart.value;
            this.editor.render();
        });

        this.selectGoal.addEventListener('change', () => {
            this.editor.goalNodeId = this.selectGoal.value;
            this.editor.render();
        });

        this.btnRun.addEventListener('click', () => this.runFullAStar());
        this.btnStep.addEventListener('click', () => this.stepNext());
        this.btnAutoStep.addEventListener('click', () => this.toggleAutoStep());
        this.btnResetSteps.addEventListener('click', () => this.resetSteps());
    }

    updateNodeDropdowns(graphData) {
        const nodes = graphData.nodes || [];
        const currentStart = this.selectStart.value;
        const currentGoal = this.selectGoal.value;

        this.selectStart.innerHTML = '';
        this.selectGoal.innerHTML = '';

        if (nodes.length === 0) {
            this.selectStart.innerHTML = '<option value="">No nodes</option>';
            this.selectGoal.innerHTML = '<option value="">No nodes</option>';
            return;
        }

        nodes.forEach(n => {
            const isStart = (currentStart ? n.id === currentStart : n.id === 'A');
            const isGoal = (currentGoal ? n.id === currentGoal : n.id === 'T');
            
            this.selectStart.innerHTML += `<option value="${n.id}" ${isStart ? 'selected' : ''}>${n.name || n.id}</option>`;
            this.selectGoal.innerHTML += `<option value="${n.id}" ${isGoal ? 'selected' : ''}>${n.name || n.id}</option>`;
        });

        // Ensure start & goal are set
        if (!this.selectStart.value && nodes.length > 0) this.selectStart.value = 'A';
        if (!this.selectGoal.value && nodes.length > 1) this.selectGoal.value = 'T';

        this.editor.startNodeId = this.selectStart.value;
        this.editor.goalNodeId = this.selectGoal.value;
    }

    async runFullAStar() {
        const start = this.selectStart.value;
        const goal = this.selectGoal.value;
        const heuristic = this.selectHeuristic.value;

        if (!start || !goal) {
            window.showToast?.('Please select valid Start and Destination nodes', 'error');
            return;
        }

        this.stopAutoPlay();
        this.editor.clearHighlights();
        this.clearLog();
        this.addLog('Initializing weighted A* pathfinding...', 'info');

        try {
            const response = await fetch('/api/astar/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_node: start,
                    goal_node: goal,
                    heuristic: heuristic
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errMsg = data.error || 'Pathfinding failed to reach destination.';
                this.addLog(`Error: ${errMsg}`, 'error');
                window.showToast?.(errMsg, 'error');
                this.updateStats(data.visited_nodes?.length || 0, data.evaluated_edges?.length || 0, 0, data.execution_time_ms || 0);
                return;
            }

            this.lastResult = data;
            this.currentStepIdx = data.steps.length - 1;

            // Animate A* Exploration to Destination
            this.playSearchAnimation(data);

        } catch (err) {
            console.error('A* execution error:', err);
            window.showToast?.(`Pathfinding request failed: ${err.message}`, 'error');
        }
    }

    playSearchAnimation(data) {
        let step = 0;
        const totalSteps = data.steps.length;
        const delay = Math.max(30, Math.min(180, 1200 / totalSteps));

        const visitedAccum = new Set();
        const edgesAccum = new Set();

        const interval = setInterval(() => {
            if (step >= totalSteps - 1) {
                clearInterval(interval);
                // Apply final path highlights
                this.editor.setPathHighlights(
                    data.path,
                    data.path_edges,
                    data.visited_nodes,
                    data.evaluated_edges,
                    null
                );

                this.updateStats(
                    data.visited_nodes.length,
                    data.evaluated_edges.length,
                    data.total_cost,
                    data.execution_time_ms
                );

                this.addLog(`🐉 Blazing Fire Dragon route resolved: ${data.path.join(' → ')} (Total Cost: ${data.total_cost})`, 'success');
                this.stepTag.textContent = `Completed (${totalSteps} steps)`;
                window.showToast?.(`🐉 Blazing Fire Dragon charging to destination: ${data.path.join(' → ')} with cost ${data.total_cost}`, 'success');

                // Notify crypto workflow to auto-update
                if (window.cryptoUI) {
                    window.cryptoUI.onAStarCompleted(data);
                }

                // Update workflow breadcrumb
                window.updateWorkflowStep?.(3);
                return;
            }

            const currentStep = data.steps[step];
            if (currentStep.current_node) visitedAccum.add(currentStep.current_node);
            if (currentStep.highlight_edge) edgesAccum.add(currentStep.highlight_edge);

            this.editor.setPathHighlights(
                [],
                [],
                Array.from(visitedAccum),
                Array.from(edgesAccum),
                currentStep.current_node
            );

            this.addLog(currentStep.action, 'step');
            this.stepTag.textContent = `Step ${step + 1} / ${totalSteps}`;

            // Approximate live path cost
            const liveG = currentStep.g_scores?.[currentStep.current_node] || 0.0;
            this.statPathCost.textContent = Number(liveG).toFixed(2);
            this.statNodesVisited.textContent = visitedAccum.size;
            this.statEdgesEval.textContent = edgesAccum.size;

            step++;
        }, delay);
    }

    async stepNext() {
        if (!this.lastResult || !this.lastResult.steps) {
            // Fetch A* result first
            await this.prepareAStarForStepping();
            if (!this.lastResult) return;
        }

        const steps = this.lastResult.steps;
        if (this.currentStepIdx >= steps.length) {
            this.currentStepIdx = 0;
        }

        const step = steps[this.currentStepIdx];
        this.renderStepState(step, this.currentStepIdx + 1, steps.length);
        this.currentStepIdx++;

        if (this.currentStepIdx >= steps.length) {
            this.stopAutoPlay();
            if (window.cryptoUI) {
                window.cryptoUI.onAStarCompleted(this.lastResult);
            }
        }
    }

    async prepareAStarForStepping() {
        const start = this.selectStart.value;
        const goal = this.selectGoal.value;
        const heuristic = this.selectHeuristic.value;

        try {
            const response = await fetch('/api/astar/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_node: start,
                    goal_node: goal,
                    heuristic: heuristic
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                this.lastResult = data;
                this.currentStepIdx = 0;
                this.editor.clearHighlights();
                this.clearLog();
            } else {
                window.showToast?.(data.error || 'Pathfinding failed', 'error');
            }
        } catch (err) {
            console.error(err);
        }
    }

    renderStepState(step, currentNum, total) {
        const isFinal = currentNum === total;
        
        if (isFinal && this.lastResult.path) {
            this.editor.setPathHighlights(
                this.lastResult.path,
                this.lastResult.path_edges,
                this.lastResult.visited_nodes,
                this.lastResult.evaluated_edges,
                null
            );
            this.updateStats(
                this.lastResult.visited_nodes.length,
                this.lastResult.evaluated_edges.length,
                this.lastResult.total_cost,
                this.lastResult.execution_time_ms
            );
            this.addLog(step.action, 'success');
        } else {
            this.editor.setPathHighlights(
                [],
                [],
                step.closed_set || [],
                step.highlight_edge ? [step.highlight_edge] : [],
                step.current_node
            );
            const liveG = step.g_scores?.[step.current_node] || 0.0;
            this.statPathCost.textContent = Number(liveG).toFixed(2);
            this.statNodesVisited.textContent = step.closed_set?.length || 0;
            this.addLog(step.action, 'step');
        }

        this.stepTag.textContent = `Step ${currentNum} / ${total}`;
    }

    toggleAutoStep() {
        if (this.isAutoPlaying) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.isAutoPlaying = true;
        this.btnAutoStep.innerHTML = '<i data-lucide="pause-circle" class="btn-icon"></i>';
        lucide.createIcons();

        this.autoPlayTimer = setInterval(async () => {
            if (!this.lastResult) {
                await this.prepareAStarForStepping();
            }
            if (this.currentStepIdx >= (this.lastResult?.steps?.length || 0)) {
                this.stopAutoPlay();
                return;
            }
            this.stepNext();
        }, 350);
    }

    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
        this.isAutoPlaying = false;
        this.btnAutoStep.innerHTML = '<i data-lucide="play-circle" class="btn-icon"></i>';
        lucide.createIcons();
    }

    resetSteps() {
        this.stopAutoPlay();
        this.currentStepIdx = 0;
        this.editor.clearHighlights();
        this.clearLog();
        this.updateStats(0, 0, 0, 0);
        this.stepTag.textContent = 'Reset';
        this.addLog('Visualizer reset. Ready.', 'info');
    }

    updateStats(visitedCount, edgesCount, cost, execTime) {
        this.statNodesVisited.textContent = visitedCount;
        this.statEdgesEval.textContent = edgesCount;
        this.statPathCost.textContent = Number(cost).toFixed(2);
        this.statExecTime.textContent = `${execTime}ms`;
    }

    clearLog() {
        this.logBody.innerHTML = '';
    }

    addLog(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = msg;
        this.logBody.appendChild(div);
        this.logBody.scrollTop = this.logBody.scrollHeight;
    }
}
