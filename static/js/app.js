/**
 * GraphCrypt v1.0 - Main Application Controller
 * Orchestrates navigation, modals, toolbar actions, API synchronizations,
 * and global toast notifications.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Components
    const editor = new GraphEditor('graph-svg', 'graph-canvas-container');
    const astarUI = new AStarUIController(editor);
    const cryptoUI = new CryptoUIController();

    window.editor = editor;
    window.astarUI = astarUI;
    window.cryptoUI = cryptoUI;

    // 2. Global Toast Notification System
    window.showToast = function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';

        toast.innerHTML = `
            <i data-lucide="${iconName}" style="width:16px; height:16px; flex-shrink:0;"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    };

    // 3. Workflow Breadcrumbs Tracker
    window.updateWorkflowStep = function(stepNum) {
        for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById(`wf-step-${i}`);
            if (!stepEl) continue;

            if (i < stepNum) {
                stepEl.className = 'wf-step completed';
                stepEl.querySelector('.wf-dot').innerHTML = '<i data-lucide="check" class="wf-check-icon"></i>';
            } else if (i === stepNum) {
                stepEl.className = 'wf-step active';
                stepEl.querySelector('.wf-dot').innerHTML = '<span class="wf-dot-inner"></span>';
            } else {
                stepEl.className = 'wf-step';
                stepEl.querySelector('.wf-dot').innerHTML = '<span class="wf-dot-inner"></span>';
            }
        }
        lucide.createIcons();
    };

    // 4. Tab Navigation & Views
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const viewAstar = document.getElementById('view-astar');
    const viewEncryption = document.getElementById('view-encryption');

    function switchView(targetTab) {
        const allNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
        allNavItems.forEach(btn => btn.classList.remove('active'));
        
        // Hide all views first
        document.querySelectorAll('.app-view, .text-suite-view').forEach(v => v.classList.remove('active-view'));

        if (targetTab === 'tab-editor' || targetTab === 'tab-astar') {
            document.getElementById(targetTab === 'tab-editor' ? 'nav-graph-editor' : 'nav-astar')?.classList.add('active');
            viewAstar.classList.add('active-view');
            editor.setMode('select');
            updateWorkflowStep(targetTab === 'tab-editor' ? 1 : 2);
        } else if (targetTab === 'tab-encryption' || targetTab === 'tab-export') {
            document.getElementById(targetTab === 'tab-encryption' ? 'nav-encryption' : 'nav-export')?.classList.add('active');
            viewEncryption.classList.add('active-view');
            updateWorkflowStep(targetTab === 'tab-encryption' ? 4 : 6);
            cryptoUI.fetchTransformations();
            cryptoUI.fetchTxtPreview();
        } else {
            // Text Suite Views
            const viewMap = {
                'tab-datasets': { nav: 'nav-datasets', view: 'view-datasets' },
                'tab-pattern': { nav: 'nav-pattern', view: 'view-pattern' },
                'tab-compression': { nav: 'nav-compression', view: 'view-compression' },
                'tab-optimization': { nav: 'nav-optimization', view: 'view-optimization' },
                'tab-parallel': { nav: 'nav-parallel', view: 'view-parallel' },
                'tab-performance': { nav: 'nav-performance', view: 'view-performance' }
            };

            const cfg = viewMap[targetTab];
            if (cfg) {
                document.getElementById(cfg.nav)?.classList.add('active');
                document.getElementById(cfg.view)?.classList.add('active-view');
            }
        }
    }
    window.switchView = switchView;

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchView(tab);
        });
    });

    // Workflow breadcrumbs click handlers
    document.querySelectorAll('.wf-step').forEach(wf => {
        wf.addEventListener('click', () => {
            const step = parseInt(wf.dataset.step, 10);
            if (step <= 3) {
                switchView('tab-astar');
            } else {
                switchView('tab-encryption');
            }
        });
    });

    // 5. Canvas Toolbar Handlers
    const toolBtns = document.querySelectorAll('.canvas-toolbar .tool-btn');
    function setToolbarActive(activeBtn) {
        toolBtns.forEach(b => b.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    }

    document.getElementById('tool-select').addEventListener('click', function() {
        setToolbarActive(this);
        editor.setMode('select');
    });

    document.getElementById('tool-add-node').addEventListener('click', function() {
        setToolbarActive(this);
        editor.setMode('add_node');
        window.showToast?.('Click anywhere on the canvas to place a new node', 'info');
    });

    document.getElementById('tool-add-edge').addEventListener('click', function() {
        setToolbarActive(this);
        editor.setMode('add_edge');
        window.showToast?.('Click the first node, then click the second node to create an edge', 'info');
    });

    document.getElementById('tool-delete').addEventListener('click', function() {
        setToolbarActive(this);
        editor.setMode('delete');
        window.showToast?.('Click any node or edge to delete it', 'info');
    });

    // Zoom Buttons
    document.getElementById('btn-zoom-in').addEventListener('click', () => editor.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => editor.zoomOut());
    document.getElementById('btn-zoom-fit').addEventListener('click', () => editor.zoomFit());

    // 6. Reset & New Project Confirmations
    let confirmCallback = null;

    function openConfirm(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        confirmCallback = callback;
        document.getElementById('modal-confirm').classList.remove('hidden');
    }

    document.getElementById('btn-confirm-action').addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        document.getElementById('modal-confirm').classList.add('hidden');
    });

    document.getElementById('btn-new-project').addEventListener('click', () => {
        openConfirm(
            'Start New Project',
            'Do you want to reset the canvas to the default sample graph or start with a clean empty canvas?',
            async () => {
                await fetchGraphData('/api/reset', 'POST', { mode: 'sample' });
                switchView('tab-astar');
                window.showToast?.('New project started with default graph', 'success');
            }
        );
    });

    document.getElementById('tool-clear-canvas').addEventListener('click', () => {
        openConfirm(
            'Clear Graph Canvas',
            'Are you sure you want to delete all nodes and edges from the canvas?',
            async () => {
                await fetchGraphData('/api/reset', 'POST', { mode: 'empty' });
                window.showToast?.('Graph cleared', 'info');
            }
        );
    });

    document.getElementById('tool-load-sample').addEventListener('click', async () => {
        await fetchGraphData('/api/reset', 'POST', { mode: 'sample' });
        window.showToast?.('Default sample graph restored', 'success');
    });

    document.getElementById('btn-quick-sample').addEventListener('click', async () => {
        await fetchGraphData('/api/reset', 'POST', { mode: 'sample' });
        window.showToast?.('Default sample graph restored', 'success');
    });

    // 7. Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.closeModal;
            document.getElementById(modalId)?.classList.add('hidden');
        });
    });

    document.getElementById('btn-about').addEventListener('click', () => {
        document.getElementById('modal-about').classList.remove('hidden');
    });

    document.getElementById('btn-help-dialog').addEventListener('click', () => {
        document.getElementById('modal-about').classList.remove('hidden');
    });

    // 8. Node Creation Form Handler
    document.getElementById('btn-save-node').addEventListener('click', async () => {
        const nameInput = document.getElementById('input-node-name');
        const xInput = document.getElementById('input-node-x');
        const yInput = document.getElementById('input-node-y');
        
        const name = nameInput.value.trim();
        if (!name) {
            window.showToast?.('Please enter a node identifier/name', 'error');
            return;
        }

        try {
            const res = await fetch('/api/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: name,
                    name: name,
                    x: parseFloat(xInput.value) || 200,
                    y: parseFloat(yInput.value) || 200
                })
            });

            const data = await res.json();
            if (res.ok) {
                document.getElementById('modal-node').classList.add('hidden');
                await loadGraphFromAPI();
                window.showToast?.(`Node '${name}' created successfully`, 'success');
                // Switch back to select mode
                document.getElementById('tool-select').click();
            } else {
                window.showToast?.(data.error || 'Failed to create node', 'error');
            }
        } catch (err) {
            console.error(err);
            window.showToast?.('Network error creating node', 'error');
        }
    });

    // 9. Edge Creation & Edit Form Handler
    document.getElementById('btn-save-edge').addEventListener('click', async () => {
        const selSource = document.getElementById('select-edge-source');
        const selTarget = document.getElementById('select-edge-target');
        const inputWeight = document.getElementById('input-edge-weight');
        const editIdInput = document.getElementById('input-edit-edge-id');

        const source = selSource.value;
        const target = selTarget.value;
        const weight = parseFloat(inputWeight.value);
        const editId = editIdInput.value;

        if (isNaN(weight) || weight < 0) {
            window.showToast?.('Please enter a valid non-negative numerical weight', 'error');
            return;
        }

        try {
            let res;
            if (editId) {
                // Update existing weight
                res = await fetch(`/api/edges/${encodeURIComponent(editId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weight: weight })
                });
            } else {
                // Create new edge
                res = await fetch('/api/edges', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source, target, weight })
                });
            }

            const data = await res.json();
            if (res.ok) {
                document.getElementById('modal-edge').classList.add('hidden');
                await loadGraphFromAPI();
                window.showToast?.(editId ? 'Edge weight updated!' : 'Edge connected successfully!', 'success');
                document.getElementById('tool-select').click();
            } else {
                window.showToast?.(data.error || 'Failed to save edge', 'error');
            }
        } catch (err) {
            console.error(err);
            window.showToast?.('Network error saving edge', 'error');
        }
    });

    // Delete edge from modal button
    document.getElementById('btn-delete-edge-modal').addEventListener('click', async () => {
        const editId = document.getElementById('input-edit-edge-id').value;
        if (editId) {
            document.getElementById('modal-edge').classList.add('hidden');
            await editor.deleteEdge(editId);
        }
    });

    // 10. Data Synchronization Helpers
    async function loadGraphFromAPI() {
        try {
            const res = await fetch('/api/graph');
            const data = await res.json();
            await editor.loadGraph(data);
            astarUI.updateNodeDropdowns(data);
            cryptoUI.fetchTransformations();
            cryptoUI.fetchTxtPreview();
        } catch (err) {
            console.error('Failed to load graph from API:', err);
        }
    }

    async function fetchGraphData(url, method = 'GET', body = null) {
        try {
            const options = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const res = await fetch(url, options);
            const data = await res.json();
            if (data.graph) {
                await editor.loadGraph(data.graph);
                astarUI.updateNodeDropdowns(data.graph);
            }
            cryptoUI.fetchTransformations();
            cryptoUI.fetchTxtPreview();
            return data;
        } catch (err) {
            console.error('Fetch graph error:', err);
        }
    }

    // Graph change hook
    editor.onGraphChanged = (graphData) => {
        astarUI.updateNodeDropdowns(graphData);
        cryptoUI.fetchTransformations();
        cryptoUI.fetchTxtPreview();
    };

    // Initial Load
    await loadGraphFromAPI();
    // Initial A* run to populate initial state matching screenshot
    astarUI.runFullAStar();
});
