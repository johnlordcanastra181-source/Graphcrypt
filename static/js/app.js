/**
 * GraphCrypt v1.0 - Main Application Controller
 * Orchestrates navigation, modals, toolbar actions, API synchronizations,
 * and global toast notifications.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Safe element binding: a missing id must never abort the whole init
    // block (that used to leave the page silently blank).
    const on = (id, event, handler) => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`[GraphCrypt] Missing element #${id}; listener skipped.`);
            return null;
        }
        el.addEventListener(event, handler);
        return el;
    };

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

    // 3. Running Status Header
    // The old 6-step workflow breadcrumb bar was replaced by a single
    // "Running GraphCrypt" status title, so there is no step tracker to update.
    // The function is kept as a no-op because other modules still call it.
    window.updateWorkflowStep = function() {};

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
            // The Graph Editor and A* tabs share one screen. Give the editor tab
            // its own layout (canvas fills the workspace, execution panel hidden)
            // instead of showing an identical view under two different labels.
            viewAstar.classList.toggle('editor-focus-mode', targetTab === 'tab-editor');
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

    // 5. Canvas Toolbar Handlers
    const toolBtns = document.querySelectorAll('.canvas-toolbar .tool-btn');
    function setToolbarActive(activeBtn) {
        toolBtns.forEach(b => b.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    }

    on('tool-select', 'click', function() {
        setToolbarActive(this);
        editor.setMode('select');
    });

    on('tool-add-node', 'click', function() {
        setToolbarActive(this);
        editor.setMode('add_node');
        window.showToast?.('Click anywhere on the canvas to place a new node', 'info');
    });

    on('tool-add-edge', 'click', function() {
        setToolbarActive(this);
        editor.setMode('add_edge');
        window.showToast?.('Click the first node, then click the second node to create an edge', 'info');
    });

    on('tool-delete', 'click', function() {
        setToolbarActive(this);
        editor.setMode('delete');
        window.showToast?.('Click any node or edge to delete it', 'info');
    });

    // Zoom Buttons
    on('btn-zoom-in', 'click', () => editor.zoomIn());
    on('btn-zoom-out', 'click', () => editor.zoomOut());
    on('btn-zoom-fit', 'click', () => editor.zoomFit());

    // 6. Reset & New Project Confirmations
    let confirmCallback = null;

    function openConfirm(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        confirmCallback = callback;
        document.getElementById('modal-confirm').classList.remove('hidden');
    }

    on('btn-confirm-action', 'click', () => {
        if (confirmCallback) confirmCallback();
        document.getElementById('modal-confirm').classList.add('hidden');
    });

    on('btn-new-project', 'click', () => {
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

    on('tool-clear-canvas', 'click', () => {
        openConfirm(
            'Clear Graph Canvas',
            'Are you sure you want to delete all nodes and edges from the canvas?',
            async () => {
                await fetchGraphData('/api/reset', 'POST', { mode: 'empty' });
                window.showToast?.('Graph cleared', 'info');
            }
        );
    });

    on('tool-load-sample', 'click', async () => {
        await fetchGraphData('/api/reset', 'POST', { mode: 'sample' });
        window.showToast?.('Default sample graph restored', 'success');
    });

    on('btn-quick-sample', 'click', async () => {
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

    // The sidebar "About" button was removed; the Help Guide button in the
    // top bar still opens the same project-info modal.
    on('btn-help-dialog', 'click', () => {
        document.getElementById('modal-about').classList.remove('hidden');
    });

    // 8. Node Creation Form Handler
    on('btn-save-node', 'click', async () => {
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
    on('btn-save-edge', 'click', async () => {
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
    on('btn-delete-edge-modal', 'click', async () => {
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
            cryptoUI.syncPathFromServer();
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
            cryptoUI.syncPathFromServer();
            return data;
        } catch (err) {
            console.error('Fetch graph error:', err);
        }
    }

    // Graph change hook
    editor.onGraphChanged = (graphData) => {
        astarUI.updateNodeDropdowns(graphData);
        cryptoUI.syncPathFromServer();
    };

    // Initial Load
    await loadGraphFromAPI();
    // Initial A* run to populate initial state matching screenshot
    astarUI.runFullAStar();
});
