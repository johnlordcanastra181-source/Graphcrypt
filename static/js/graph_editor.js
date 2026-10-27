/**
 * GraphCrypt v1.0 - Interactive SVG Graph Editor
 * Handles SVG canvas rendering, drag-and-drop, node creation, edge creation,
 * weight editing, intelligent auto-fit zoom/pan, and visual highlighting for A* pathfinding.
 */

class GraphEditor {
    constructor(svgElementId, containerId) {
        this.svg = document.getElementById(svgElementId);
        this.container = document.getElementById(containerId);
        this.transformGroup = document.getElementById('canvas-transform-group');
        this.edgesLayer = document.getElementById('edges-layer');
        this.edgeLabelsLayer = document.getElementById('edge-labels-layer');
        this.nodesLayer = document.getElementById('nodes-layer');
        this.animationLayer = document.getElementById('animation-layer');

        // State
        this.nodes = new Map();
        this.edges = new Map();
        this.mode = 'select'; // 'select', 'add_node', 'add_edge', 'delete'
        this.selectedNodeId = null;
        this.selectedEdgeId = null;
        this.edgeCreationSource = null;

        // Path / Animation state
        this.startNodeId = 'A';
        this.goalNodeId = 'T';
        this.pathNodeIds = new Set();
        this.pathEdgeIds = new Set();
        this.visitedNodeIds = new Set();
        this.evaluatedEdgeIds = new Set();
        this.currentNodeId = null;
        this.lastPathNodes = [];
        this.sparks = [];
        this.sparkAnimId = null;
        this.dragonAnimId = null;
        this.phoenixAnimId = null;
        this.sparkSegments = [];
        this.sparkTotalLength = 0;

        // Pan & Zoom
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;

        // Node Dragging
        this.draggedNode = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.hasDragged = false;

        // Event callbacks
        this.onGraphChanged = null;
        this.onNodeSelected = null;

        this.initEvents();
    }

    initEvents() {
        // SVG Canvas Mouse Events
        this.svg.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.svg.addEventListener('wheel', (e) => this.handleCanvasWheel(e), { passive: false });

        // Double click canvas to add node
        this.svg.addEventListener('dblclick', (e) => {
            if (this.mode === 'select') {
                const pt = this.getCanvasCoords(e);
                this.promptAddNode(pt.x, pt.y);
            }
        });

        // Window resize auto-recenter
        window.addEventListener('resize', () => {
            if (this.nodes.size > 0 && Math.abs(this.panX) < 10 && Math.abs(this.panY) < 10) {
                this.zoomFit();
            }
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.edgeCreationSource = null;
        this.selectedNodeId = null;
        this.selectedEdgeId = null;
        
        // Update mode hint
        const hintEl = document.getElementById('canvas-mode-hint');
        if (hintEl) {
            const labels = {
                'select': 'Select / Move',
                'add_node': 'Click canvas to place Node',
                'add_edge': 'Click source node, then target node',
                'delete': 'Click any node or edge to delete'
            };
            hintEl.innerHTML = `Mode: <strong>${labels[mode] || mode}</strong>`;
        }

        this.render();
    }

    getCanvasCoords(e) {
        const rect = this.svg.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const x = (screenX - this.panX) / this.zoom;
        const y = (screenY - this.panY) / this.zoom;
        return { x: Math.round(x), y: Math.round(y) };
    }

    updateTransform() {
        this.transformGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }

    zoomIn() {
        this.zoom = Math.min(2.5, this.zoom * 1.2);
        this.updateTransform();
    }

    zoomOut() {
        this.zoom = Math.max(0.2, this.zoom / 1.2);
        this.updateTransform();
    }

    zoomFit() {
        if (this.nodes.size === 0) {
            this.zoom = 1.0;
            this.panX = 0;
            this.panY = 0;
            this.updateTransform();
            return;
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of this.nodes.values()) {
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.y > maxY) maxY = n.y;
        }

        const rect = this.svg.getBoundingClientRect();
        const svgW = rect.width || 850;
        const svgH = rect.height || 600;

        const graphW = Math.max(100, maxX - minX + 100);
        const graphH = Math.max(100, maxY - minY + 100);

        const zoomX = svgW / graphW;
        const zoomY = svgH / graphH;
        this.zoom = Math.max(0.3, Math.min(1.2, Math.min(zoomX, zoomY)));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        this.panX = (svgW / 2) - (centerX * this.zoom);
        this.panY = (svgH / 2) - (centerY * this.zoom);

        this.updateTransform();
    }

    handleCanvasWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const rect = this.svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newZoom = Math.max(0.2, Math.min(3.0, this.zoom * factor));
        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
        this.updateTransform();
    }

    handleCanvasMouseDown(e) {
        if (e.target === this.svg || e.target.classList.contains('grid-layer')) {
            if (this.mode === 'add_node') {
                const pt = this.getCanvasCoords(e);
                this.promptAddNode(pt.x, pt.y);
                return;
            }

            // Start Canvas Panning
            this.isPanning = true;
            this.panStartX = e.clientX - this.panX;
            this.panStartY = e.clientY - this.panY;
            this.selectedNodeId = null;
            this.selectedEdgeId = null;
            this.render();
        }
    }

    handleCanvasMouseMove(e) {
        if (this.isPanning) {
            this.panX = e.clientX - this.panStartX;
            this.panY = e.clientY - this.panStartY;
            this.updateTransform();
            return;
        }

        if (this.draggedNode) {
            this.hasDragged = true;
            const pt = this.getCanvasCoords(e);
            this.draggedNode.x = Math.max(20, pt.x - this.dragOffsetX);
            this.draggedNode.y = Math.max(20, pt.y - this.dragOffsetY);
            this.scheduleRender();
        }
    }

    /**
     * Coalesces render() calls into one per animation frame. Dragging fires
     * mousemove at ~60Hz; rebuilding the entire SVG on every event was the
     * main source of canvas lag on larger graphs.
     */
    scheduleRender() {
        if (this._renderScheduled) return;
        this._renderScheduled = true;
        requestAnimationFrame(() => {
            this._renderScheduled = false;
            this.render();
        });
    }

    handleCanvasMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
        }

        if (this.draggedNode) {
            if (this.hasDragged) {
                // Sync updated position to backend
                this.saveNodePosition(this.draggedNode);
            }
            this.draggedNode = null;
            this.hasDragged = false;
        }
    }

    // ==========================================
    // API SYNC & GRAPH MANIPULATION
    // ==========================================

    async loadGraph(graphData, autoFit = false) {
        this.nodes.clear();
        this.edges.clear();

        if (graphData && graphData.nodes) {
            for (const n of graphData.nodes) {
                this.nodes.set(n.id, { ...n });
            }
        }

        if (graphData && graphData.edges) {
            for (const e of graphData.edges) {
                this.edges.set(e.id, { ...e });
            }
        }

        if (autoFit || this.panX === 0) {
            this.zoomFit();
        }

        this.render();
        if (this.onGraphChanged) {
            this.onGraphChanged(this.getGraphData());
        }
    }

    getGraphData() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values())
        };
    }

    async saveNodePosition(node) {
        try {
            await fetch(`/api/nodes/${encodeURIComponent(node.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: node.x, y: node.y, name: node.name })
            });
            if (this.onGraphChanged) {
                this.onGraphChanged(this.getGraphData());
            }
        } catch (err) {
            console.error('Failed to sync node position:', err);
        }
    }

    promptAddNode(x, y) {
        const inputName = document.getElementById('input-node-name');
        const inputX = document.getElementById('input-node-x');
        const inputY = document.getElementById('input-node-y');
        
        // Auto-generate next available letter
        const existingIds = new Set(this.nodes.keys());
        let defaultName = 'Node';
        for (let code = 65; code <= 90; code++) {
            const letter = String.fromCharCode(code);
            if (!existingIds.has(letter)) {
                defaultName = letter;
                break;
            }
        }

        inputName.value = defaultName;
        inputX.value = x;
        inputY.value = y;
        
        document.getElementById('modal-node').classList.remove('hidden');
        inputName.focus();
        inputName.select();
    }

    promptAddEdge(sourceId, targetId) {
        const modal = document.getElementById('modal-edge');
        const selSource = document.getElementById('select-edge-source');
        const selTarget = document.getElementById('select-edge-target');
        const inputWeight = document.getElementById('input-edge-weight');
        const editIdInput = document.getElementById('input-edit-edge-id');
        const btnDelete = document.getElementById('btn-delete-edge-modal');

        // Populate node selectors
        selSource.innerHTML = '';
        selTarget.innerHTML = '';
        for (const node of this.nodes.values()) {
            selSource.innerHTML += `<option value="${node.id}">${node.name}</option>`;
            selTarget.innerHTML += `<option value="${node.id}">${node.name}</option>`;
        }

        // Re-enable the selectors: promptEditEdgeWeight disables them, and
        // without this reset every later Add Edge modal opens with frozen
        // source/target dropdowns.
        selSource.disabled = false;
        selTarget.disabled = false;

        selSource.value = sourceId;
        selTarget.value = targetId;
        
        // Auto-compute Euclidean distance as default weight
        const n1 = this.nodes.get(sourceId);
        const n2 = this.nodes.get(targetId);
        let defaultWeight = 50.0;
        if (n1 && n2) {
            defaultWeight = Math.round(Math.hypot(n2.x - n1.x, n2.y - n1.y) * 10) / 10;
        }

        inputWeight.value = defaultWeight;
        editIdInput.value = '';
        btnDelete.classList.add('hidden');

        document.getElementById('modal-edge-title').textContent = 'Connect Nodes with Weighted Edge';
        modal.classList.remove('hidden');
        inputWeight.focus();
    }

    promptEditEdgeWeight(edge) {
        const modal = document.getElementById('modal-edge');
        const selSource = document.getElementById('select-edge-source');
        const selTarget = document.getElementById('select-edge-target');
        const inputWeight = document.getElementById('input-edge-weight');
        const editIdInput = document.getElementById('input-edit-edge-id');
        const btnDelete = document.getElementById('btn-delete-edge-modal');

        selSource.innerHTML = `<option value="${edge.source}">${edge.source}</option>`;
        selTarget.innerHTML = `<option value="${edge.target}">${edge.target}</option>`;
        selSource.disabled = true;
        selTarget.disabled = true;

        inputWeight.value = edge.weight;
        editIdInput.value = edge.id;
        btnDelete.classList.remove('hidden');

        document.getElementById('modal-edge-title').textContent = `Edit Edge Weight: ${edge.source} → ${edge.target}`;
        modal.classList.remove('hidden');
        inputWeight.focus();
        inputWeight.select();
    }

    // ==========================================
    // RENDERING
    // ==========================================

    render() {
        this.renderEdges();
        this.renderNodes();
        if (this.lastPathNodes && this.lastPathNodes.length >= 2 && (this.sparkAnimId || this.dragonAnimId || this.phoenixAnimId)) {
            this.recalculateSparkSegments();
        }
    }

    renderEdges() {
        this.edgesLayer.innerHTML = '';
        this.edgeLabelsLayer.innerHTML = '';

        for (const edge of this.edges.values()) {
            const sourceNode = this.nodes.get(edge.source);
            const targetNode = this.nodes.get(edge.target);

            if (!sourceNode || !targetNode) continue;

            const isPath = this.pathEdgeIds.has(edge.id);
            const isEvaluated = this.evaluatedEdgeIds.has(edge.id);
            const isSelected = this.selectedEdgeId === edge.id;

            // 1. Blazing Fire Outer Heat Aura (behind main edge)
            if (isPath) {
                const auraLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                auraLine.setAttribute('x1', sourceNode.x);
                auraLine.setAttribute('y1', sourceNode.y);
                auraLine.setAttribute('x2', targetNode.x);
                auraLine.setAttribute('y2', targetNode.y);
                auraLine.setAttribute('class', 'graph-edge-fire-aura');
                this.edgesLayer.appendChild(auraLine);
            }

            // 2. Draw Main Edge Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sourceNode.x);
            line.setAttribute('y1', sourceNode.y);
            line.setAttribute('x2', targetNode.x);
            line.setAttribute('y2', targetNode.y);
            
            let classes = 'graph-edge-line';
            if (isPath) classes += ' path-active';
            else if (isEvaluated) classes += ' evaluated';
            if (isSelected) classes += ' selected';
            line.setAttribute('class', classes);
            line.dataset.edgeId = edge.id;

            line.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.mode === 'delete') {
                    this.deleteEdge(edge.id);
                } else {
                    this.selectedEdgeId = edge.id;
                    this.promptEditEdgeWeight(edge);
                }
            });

            this.edgesLayer.appendChild(line);

            // 3. Blazing Fire White-Hot Molten Core (on top of main edge)
            if (isPath) {
                const coreLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                coreLine.setAttribute('x1', sourceNode.x);
                coreLine.setAttribute('y1', sourceNode.y);
                coreLine.setAttribute('x2', targetNode.x);
                coreLine.setAttribute('y2', targetNode.y);
                coreLine.setAttribute('class', 'graph-edge-fire-core');
                this.edgesLayer.appendChild(coreLine);
            }

            // 4. Literal Fire Flames Licking Along the Path ("leteral na may apoy")
            if (isPath) {
                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const len = Math.hypot(dx, dy) || 1;
                const baseAngle = Math.atan2(dy, dx) * 180 / Math.PI;

                const flameG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                flameG.setAttribute('class', 'edge-literal-flames');

                const flameStep = 20;
                const count = Math.floor(len / flameStep);
                for (let i = 1; i <= count; i++) {
                    const t = (i * flameStep) / len;
                    const fx = sourceNode.x + dx * t;
                    const fy = sourceNode.y + dy * t;
                    const side = (i % 2 === 0) ? 1 : -1;
                    const rot = baseAngle + (side * 90);
                    const fH = 14 + (i % 4) * 4;

                    const tongue = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    tongue.setAttribute('d', `M 0,0 C -4,-6 -8,-${(fH * 0.6).toFixed(1)} 0,-${fH} C 8,-${(fH * 0.6).toFixed(1)} 4,-6 0,0 Z`);
                    tongue.setAttribute('class', 'literal-flame-tongue');
                    tongue.setAttribute('transform', `translate(${fx.toFixed(1)}, ${fy.toFixed(1)}) rotate(${rot.toFixed(1)})`);
                    flameG.appendChild(tongue);

                    const tongueCore = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    tongueCore.setAttribute('d', `M 0,0 C -2,-4 -4,-${(fH * 0.35).toFixed(1)} 0,-${(fH * 0.6).toFixed(1)} C 4,-${(fH * 0.35).toFixed(1)} 2,-4 0,0 Z`);
                    tongueCore.setAttribute('class', 'literal-flame-tongue-core');
                    tongueCore.setAttribute('transform', `translate(${fx.toFixed(1)}, ${fy.toFixed(1)}) rotate(${rot.toFixed(1)})`);
                    flameG.appendChild(tongueCore);
                }
                this.edgesLayer.appendChild(flameG);
            }

            // Draw Weight Pill Badge at Center of Edge
            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            const gWeight = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            let weightClasses = 'edge-weight-group';
            if (isPath) weightClasses += ' path-active';
            gWeight.setAttribute('class', weightClasses);
            gWeight.setAttribute('transform', `translate(${midX}, ${midY})`);
            gWeight.dataset.edgeId = edge.id;

            const weightText = Number.isInteger(edge.weight) ? edge.weight.toString() : edge.weight.toFixed(1);
            const textWidth = Math.max(26, weightText.length * 8 + 12);
            const textHeight = 18;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', -textWidth / 2);
            rect.setAttribute('y', -textHeight / 2);
            rect.setAttribute('width', textWidth);
            rect.setAttribute('height', textHeight);
            rect.setAttribute('class', 'edge-weight-bg');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'edge-weight-text');
            text.textContent = weightText;

            gWeight.appendChild(rect);
            gWeight.appendChild(text);

            gWeight.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.mode === 'delete') {
                    this.deleteEdge(edge.id);
                } else {
                    this.promptEditEdgeWeight(edge);
                }
            });

            this.edgeLabelsLayer.appendChild(gWeight);
        }
    }

    renderNodes() {
        this.nodesLayer.innerHTML = '';

        for (const node of this.nodes.values()) {
            const isStart = node.id === this.startNodeId;
            const isGoal = node.id === this.goalNodeId;
            const isPath = this.pathNodeIds.has(node.id);
            const isVisited = this.visitedNodeIds.has(node.id);
            const isCurrent = node.id === this.currentNodeId;
            const isSelected = node.id === this.selectedNodeId;
            const isEdgeSource = node.id === this.edgeCreationSource;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            g.dataset.nodeId = node.id;

            let classes = 'graph-node-group';
            if (isStart) classes += ' start-node';
            if (isGoal) classes += ' target-node';
            if (isPath) classes += ' path-node';
            else if (isVisited) classes += ' visited';
            if (isCurrent) classes += ' current-active';
            if (isSelected) classes += ' selected';
            g.setAttribute('class', classes);

            const size = 36;
            const halfSize = size / 2;

            // Halo for special states
            const halo = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            halo.setAttribute('x', -halfSize - 5);
            halo.setAttribute('y', -halfSize - 5);
            halo.setAttribute('width', size + 10);
            halo.setAttribute('height', size + 10);
            halo.setAttribute('rx', 12);
            halo.setAttribute('ry', 12);
            halo.setAttribute('class', 'node-halo');
            if (isEdgeSource) {
                halo.style.stroke = '#F59E0B';
                halo.style.strokeWidth = '3';
                halo.style.strokeDasharray = '4 4';
            }
            g.appendChild(halo);

            // Node Body (Rounded Rectangle matching screenshot)
            const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            body.setAttribute('x', -halfSize);
            body.setAttribute('y', -halfSize);
            body.setAttribute('width', size);
            body.setAttribute('height', size);
            body.setAttribute('class', 'node-body');
            g.appendChild(body);

            // Node Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'node-label');
            text.textContent = node.name || node.id;
            g.appendChild(text);

            // Node Interaction Listeners
            g.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return; // Left click only
                e.stopPropagation();

                if (this.mode === 'delete') {
                    this.deleteNode(node.id);
                    return;
                }

                if (this.mode === 'add_edge') {
                    if (!this.edgeCreationSource) {
                        this.edgeCreationSource = node.id;
                        this.render();
                    } else if (this.edgeCreationSource !== node.id) {
                        const src = this.edgeCreationSource;
                        this.edgeCreationSource = null;
                        this.promptAddEdge(src, node.id);
                    }
                    return;
                }

                // Select & Drag
                this.selectedNodeId = node.id;
                this.draggedNode = node;
                const pt = this.getCanvasCoords(e);
                this.dragOffsetX = pt.x - node.x;
                this.dragOffsetY = pt.y - node.y;
                this.hasDragged = false;
                this.render();

                if (this.onNodeSelected) {
                    this.onNodeSelected(node);
                }
            });

            this.nodesLayer.appendChild(g);
        }
    }

    async deleteNode(nodeId) {
        try {
            await fetch(`/api/nodes/${encodeURIComponent(nodeId)}`, { method: 'DELETE' });
            this.nodes.delete(nodeId);
            // Remove attached edges
            for (const [eId, edge] of this.edges.entries()) {
                if (edge.source === nodeId || edge.target === nodeId) {
                    this.edges.delete(eId);
                }
            }
            this.render();
            if (this.onGraphChanged) {
                this.onGraphChanged(this.getGraphData());
            }
            window.showToast?.(`Node '${nodeId}' deleted`, 'info');
        } catch (err) {
            console.error('Delete node error:', err);
            window.showToast?.(`Failed to delete node: ${err.message}`, 'error');
        }
    }

    async deleteEdge(edgeId) {
        try {
            await fetch(`/api/edges/${encodeURIComponent(edgeId)}`, { method: 'DELETE' });
            this.edges.delete(edgeId);
            this.render();
            if (this.onGraphChanged) {
                this.onGraphChanged(this.getGraphData());
            }
            window.showToast?.(`Edge deleted`, 'info');
        } catch (err) {
            console.error('Delete edge error:', err);
            window.showToast?.(`Failed to delete edge: ${err.message}`, 'error');
        }
    }

    // =========================================================================
    // FLAMING FLYING PHOENIX ROUTE FINDING WITH SWINGING WINGS EFFECT
    // =========================================================================

    setPathHighlights(pathNodes = [], pathEdges = [], visitedNodes = [], evaluatedEdges = [], currentNode = null) {
        this.pathNodeIds = new Set(pathNodes);
        this.pathEdgeIds = new Set(pathEdges);
        this.visitedNodeIds = new Set(visitedNodes);
        this.evaluatedEdgeIds = new Set(evaluatedEdges);
        this.currentNodeId = currentNode;
        this.lastPathNodes = Array.isArray(pathNodes) ? [...pathNodes] : [];
        this.render();

        if (this.lastPathNodes.length >= 2) {
            this.startFlamingPhoenix();
        } else {
            this.stopFlamingPhoenix();
        }
    }

    clearHighlights() {
        this.pathNodeIds.clear();
        this.pathEdgeIds.clear();
        this.visitedNodeIds.clear();
        this.evaluatedEdgeIds.clear();
        this.currentNodeId = null;
        this.lastPathNodes = [];
        this.stopFlamingPhoenix();
        this.render();
    }

    recalculateSparkSegments() {
        if (!this.lastPathNodes || this.lastPathNodes.length < 2) {
            this.sparkSegments = [];
            this.sparkTotalLength = 0;
            return;
        }

        const pts = [];
        for (const nodeId of this.lastPathNodes) {
            const n = this.nodes.get(nodeId);
            if (n) pts.push({ x: n.x, y: n.y });
        }

        if (pts.length < 2) {
            this.sparkSegments = [];
            this.sparkTotalLength = 0;
            return;
        }

        const segments = [];
        let totalLen = 0;
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i + 1].x - pts[i].x;
            const dy = pts[i + 1].y - pts[i].y;
            const len = Math.hypot(dx, dy) || 0.001;
            segments.push({
                p1: pts[i],
                p2: pts[i + 1],
                dx,
                dy,
                len,
                nx: -dy / len,
                ny: dx / len,
                angle: Math.atan2(dy, dx),
                startDist: totalLen,
                endDist: totalLen + len
            });
            totalLen += len;
        }

        this.sparkSegments = segments;
        this.sparkTotalLength = totalLen;
    }

    getPointOnPath(dist) {
        const segs = this.sparkSegments;
        if (!segs || segs.length === 0) {
            return { x: 0, y: 0, angle: 0, nx: 0, ny: 1 };
        }

        const total = this.sparkTotalLength;
        if (dist <= 0) {
            const seg = segs[0];
            const t = dist / seg.len;
            return {
                x: seg.p1.x + seg.dx * t,
                y: seg.p1.y + seg.dy * t,
                angle: seg.angle,
                nx: seg.nx,
                ny: seg.ny
            };
        }

        if (dist >= total) {
            const seg = segs[segs.length - 1];
            const over = dist - total;
            const dirX = seg.dx / seg.len;
            const dirY = seg.dy / seg.len;
            return {
                x: seg.p2.x + dirX * over,
                y: seg.p2.y + dirY * over,
                angle: seg.angle,
                nx: seg.nx,
                ny: seg.ny
            };
        }

        let seg = segs.find(s => dist >= s.startDist && dist <= s.endDist);
        if (!seg) seg = segs[segs.length - 1];

        const t = Math.max(0, Math.min(1, (dist - seg.startDist) / seg.len));
        return {
            x: seg.p1.x + seg.dx * t,
            y: seg.p1.y + seg.dy * t,
            angle: seg.angle,
            nx: seg.nx,
            ny: seg.ny
        };
    }

    startFlamingPhoenix() {
        this.stopFlamingPhoenix();
        this.recalculateSparkSegments();

        if (!this.animationLayer || this.sparkSegments.length === 0 || this.sparkTotalLength <= 0) {
            return;
        }

        // ==========================================
        // 1. ASSEMBLE PHOENIX SVG HIERARCHY
        // ==========================================
        const phoenixRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        phoenixRoot.setAttribute('class', 'phoenix-container');
        this.animationLayer.appendChild(phoenixRoot);

        // Destination Rebirth Supernova Layer
        const burstLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        burstLayer.setAttribute('class', 'phoenix-destination-burst');
        phoenixRoot.appendChild(burstLayer);

        // Trailing Embers & Wingtip Vortex Layer
        const trailLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        phoenixRoot.appendChild(trailLayer);

        // Flowing Phoenix Tail Streamers Layer
        const tailLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        phoenixRoot.appendChild(tailLayer);

        // Swinging Wings Layer
        const wingsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        phoenixRoot.appendChild(wingsLayer);

        // Phoenix Avian Body & Head Group
        const bodyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bodyGroup.setAttribute('class', 'phoenix-body-group');
        phoenixRoot.appendChild(bodyGroup);

        // --- A. Build Phoenix Avian Body & Head ---
        // Avian Torso
        const torso = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        torso.setAttribute('d', 'M -16,0 C -12,-8 4,-10 16,-6 C 24,-2 28,0 28,0 C 28,0 24,2 16,6 C 4,10 -12,8 -16,0 Z');
        torso.setAttribute('class', 'phoenix-body-feather');
        bodyGroup.appendChild(torso);

        // Glowing Golden Hearth / Breast Shield
        const breast = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        breast.setAttribute('d', 'M -4,0 C 2,-5 12,-4 18,0 C 12,4 2,5 -4,0 Z');
        breast.setAttribute('fill', '#FFE033');
        breast.setAttribute('filter', 'drop-shadow(0 0 6px #FFFFFF)');
        bodyGroup.appendChild(breast);

        // Curved Golden Raptor Beak
        const beak = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        beak.setAttribute('d', 'M 24,-3 L 36,0 L 24,3 Q 26,0 24,-3 Z');
        beak.setAttribute('class', 'phoenix-beak');
        bodyGroup.appendChild(beak);

        // Piercing Glowing Eyes
        const eyeTop = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eyeTop.setAttribute('cx', '20');
        eyeTop.setAttribute('cy', '-3.2');
        eyeTop.setAttribute('r', '2.2');
        eyeTop.setAttribute('class', 'phoenix-eye');
        bodyGroup.appendChild(eyeTop);

        const eyeBottom = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eyeBottom.setAttribute('cx', '20');
        eyeBottom.setAttribute('cy', '3.2');
        eyeBottom.setAttribute('r', '2.2');
        eyeBottom.setAttribute('class', 'phoenix-eye');
        bodyGroup.appendChild(eyeBottom);

        // Regal Crown Crest Feathers (3 plumes swept backward)
        const crestCenter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crestCenter.setAttribute('d', 'M 14,0 Q 2,-18 -22,-14 Q -4,-8 14,0 Z');
        crestCenter.setAttribute('class', 'phoenix-crest-feather');
        bodyGroup.appendChild(crestCenter);

        const crestTop = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crestTop.setAttribute('d', 'M 16,-3 Q 4,-14 -16,-12 Q -2,-6 16,-2 Z');
        crestTop.setAttribute('class', 'phoenix-crest-feather');
        bodyGroup.appendChild(crestTop);

        const crestBottom = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        crestBottom.setAttribute('d', 'M 16,3 Q 4,14 -16,12 Q -2,6 16,2 Z');
        crestBottom.setAttribute('class', 'phoenix-crest-feather');
        bodyGroup.appendChild(crestBottom);

        // --- B. Build Swinging Phoenix Wings ---
        function createPhoenixWing(side) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'phoenix-wing-group');

            // 4 Layered Sweeping Flame Feathers
            // Feather 1 (Leading primary soaring feather - sweeps out to 56px)
            const f1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            f1.setAttribute('d', `M 0,0 C 8,${side * 18} 12,${side * 36} -14,${side * 56} C -8,${side * 40} 0,${side * 20} 0,0 Z`);
            f1.setAttribute('class', 'phoenix-wing-feather');
            g.appendChild(f1);

            // Feather 2 (Middle primary feather)
            const f2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            f2.setAttribute('d', `M 0,0 C 6,${side * 14} 8,${side * 28} -22,${side * 46} C -14,${side * 32} -4,${side * 16} 0,0 Z`);
            f2.setAttribute('class', 'phoenix-wing-feather');
            g.appendChild(f2);

            // Feather 3 (Secondary flight feather)
            const f3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            f3.setAttribute('d', `M 0,0 C 4,${side * 10} 4,${side * 22} -26,${side * 34} C -16,${side * 24} -6,${side * 10} 0,0 Z`);
            f3.setAttribute('class', 'phoenix-wing-feather');
            g.appendChild(f3);

            // Feather 4 (Inner coverts)
            const f4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            f4.setAttribute('d', `M 0,0 C 2,${side * 6} 2,${side * 14} -26,${side * 20} C -16,${side * 14} -6,${side * 6} 0,0 Z`);
            f4.setAttribute('class', 'phoenix-wing-feather');
            g.appendChild(f4);

            // Radiating Golden Wing Struts
            const strut1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            strut1.setAttribute('d', `M 0,0 C 8,${side * 18} 12,${side * 36} -14,${side * 56}`);
            strut1.setAttribute('class', 'phoenix-wing-strut');
            g.appendChild(strut1);

            const strut2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            strut2.setAttribute('d', `M 0,0 C 6,${side * 14} 8,${side * 28} -22,${side * 46}`);
            strut2.setAttribute('class', 'phoenix-wing-strut');
            g.appendChild(strut2);

            return { group: g, side: side };
        }

        const leftWing = createPhoenixWing(-1);
        const rightWing = createPhoenixWing(1);
        wingsLayer.appendChild(leftWing.group);
        wingsLayer.appendChild(rightWing.group);

        // --- C. Build 4 Flowing Phoenix Tail Streamers ---
        const tailStreamers = [];
        const streamerConfigs = [
            { len: 105, yOffset: -7, swayFreq: 0.007, swayAmp: 16, lag: 0.0, strokeWidth: 2.8 },
            { len: 130, yOffset: -2, swayFreq: 0.006, swayAmp: 20, lag: 0.35, strokeWidth: 3.2 },
            { len: 130, yOffset: 2,  swayFreq: 0.006, swayAmp: 20, lag: 0.70, strokeWidth: 3.2 },
            { len: 105, yOffset: 7,  swayFreq: 0.007, swayAmp: 16, lag: 1.05, strokeWidth: 2.8 }
        ];

        for (const cfg of streamerConfigs) {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('class', 'phoenix-tail-streamer');
            p.style.strokeWidth = `${cfg.strokeWidth}px`;
            tailLayer.appendChild(p);

            const gem = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            gem.setAttribute('class', 'phoenix-tail-gem');
            gem.setAttribute('points', '0,-4 6,0 0,4 -6,0');
            tailLayer.appendChild(gem);

            tailStreamers.push({ ...cfg, pathEl: p, gemEl: gem });
        }

        // --- D. Build 16 Wingtip Vortex Fire Sparks ---
        const wingSparks = [];
        for (let i = 0; i < 16; i++) {
            const wsp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const isLeft = i < 8;
            const wcolor = i % 2 === 0 ? '#FFE033' : '#FF4500';
            wsp.setAttribute('fill', wcolor);
            wsp.setAttribute('class', 'phoenix-vortex-spark');
            wsp.style.filter = `drop-shadow(0 0 5px ${wcolor})`;
            trailLayer.appendChild(wsp);

            wingSparks.push({
                el: wsp,
                isLeft: isLeft,
                lifeOffset: (i % 8) / 8,
                radius: 1.8 + (i % 3) * 0.7
            });
        }

        // --- E. Build 36 Rising Campfire Embers Along Path ---
        const pathEmbers = [];
        const emberColors = ['#FFFFFF', '#FFF7C2', '#FFE033', '#FF9D00', '#FF5500', '#FF1A00'];
        for (let i = 0; i < 36; i++) {
            const esp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const color = emberColors[i % emberColors.length];
            esp.setAttribute('fill', color);
            esp.setAttribute('class', 'blazing-fire-spark');
            esp.style.filter = `drop-shadow(0 0 4px ${color})`;
            trailLayer.appendChild(esp);

            pathEmbers.push({
                el: esp,
                distOffset: (i / 36) * Math.min(260, this.sparkTotalLength),
                swayAmp: 4.0 + (i % 4) * 2.5,
                swayFreq: 0.005 + (i % 3) * 0.002,
                riseSpeed: 18 + (i % 4) * 12,
                phase: (i * 1.3) % (Math.PI * 2),
                baseRadius: 1.6 + (i % 3) * 0.8
            });
        }

        // --- F. Build 32 Rebirth Supernova Burst Sparks ---
        const burstSparks = [];
        for (let i = 0; i < 32; i++) {
            const sp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            sp.setAttribute('class', 'phoenix-rebirth-spark');
            sp.setAttribute('fill', i % 2 === 0 ? '#FFE033' : '#FF4500');
            sp.style.filter = 'drop-shadow(0 0 6px #FF8800)';
            sp.setAttribute('opacity', '0');
            burstLayer.appendChild(sp);

            const angle = (i / 32) * Math.PI * 2;
            burstSparks.push({
                el: sp,
                angle: angle,
                speed: 85 + (i % 4) * 45,
                radius: 2.5 + (i % 3) * 0.8
            });
        }

        // ==========================================
        // 2. SOARING PHOENIX KINEMATICS & FLIGHT LOOP
        // ==========================================
        let headDist = -60;
        let lastTime = performance.now();
        let burstStartTime = -9999;
        let burstTriggered = false;

        const flightSpeed = Math.max(260, Math.min(390, this.sparkTotalLength / 2.8));
        const totalLen = this.sparkTotalLength;
        const destNode = this.sparkSegments[this.sparkSegments.length - 1].p2;

        const animate = (timestamp) => {
            const dt = Math.min(0.08, (timestamp - lastTime) / 1000);
            lastTime = timestamp;

            headDist += flightSpeed * dt;

            // Destination supernova rebirth check
            if (headDist >= totalLen - 20 && !burstTriggered) {
                burstStartTime = timestamp;
                burstTriggered = true;
            }

            // Loop smoothly back to Start node once phoenix completes pass
            if (headDist > totalLen + 170) {
                headDist = -240;
                burstTriggered = false;
            }

            // --- A. Update Phoenix Avian Head & Torso ---
            const pPt = this.getPointOnPath(headDist);
            const heave = Math.sin(timestamp * 0.006) * 4.0;
            const px = pPt.x + pPt.nx * heave;
            const py = pPt.y + pPt.ny * heave;
            const pAngle = pPt.angle + Math.cos(timestamp * 0.006) * 0.08;
            const pDeg = (pAngle * 180 / Math.PI).toFixed(2);

            let opacity = 1.0;
            if (headDist < 0) {
                opacity = Math.max(0, 1 + headDist / 60);
            } else if (headDist > totalLen) {
                opacity = Math.max(0, 1 - (headDist - totalLen) / 120);
            }

            bodyGroup.setAttribute('transform', `translate(${px.toFixed(2)}, ${py.toFixed(2)}) rotate(${pDeg})`);
            bodyGroup.setAttribute('opacity', opacity.toFixed(2));

            // --- B. Update Swinging Wings (Swinging Flight Strokes) ---
            const swingPhase = timestamp * 0.0075;
            const swingAngle = Math.sin(swingPhase) * 34; // forward-backward sweeping
            const flapElevation = Math.cos(swingPhase) * 22; // up-down wing dihedral
            const wingScale = 0.65 + 0.35 * Math.sin(swingPhase + Math.PI / 2); // 3D foreshortening

            leftWing.group.setAttribute('transform', `translate(${px.toFixed(2)}, ${py.toFixed(2)}) rotate(${pDeg}) rotate(${(swingAngle + flapElevation).toFixed(2)}) scale(1, ${wingScale.toFixed(2)})`);
            leftWing.group.setAttribute('opacity', opacity.toFixed(2));

            rightWing.group.setAttribute('transform', `translate(${px.toFixed(2)}, ${py.toFixed(2)}) rotate(${pDeg}) rotate(${(-(swingAngle + flapElevation)).toFixed(2)}) scale(1, ${(-wingScale).toFixed(2)})`);
            rightWing.group.setAttribute('opacity', opacity.toFixed(2));

            // --- C. Update Flowing Phoenix Tail Streamers ---
            const cosA = Math.cos(pAngle);
            const sinA = Math.sin(pAngle);
            const rootX = px - cosA * 16;
            const rootY = py - sinA * 16;

            for (const st of tailStreamers) {
                const sLag1 = timestamp * st.swayFreq - st.lag;
                const sLag2 = timestamp * st.swayFreq - st.lag * 2;
                const sLag3 = timestamp * st.swayFreq - st.lag * 3;

                const sway1 = Math.sin(sLag1) * st.swayAmp + st.yOffset;
                const sway2 = Math.sin(sLag2) * (st.swayAmp * 1.3) + st.yOffset * 1.2;
                const sway3 = Math.sin(sLag3) * (st.swayAmp * 1.6) + st.yOffset * 1.4;

                const c1X = rootX - cosA * (st.len * 0.35) - sinA * sway1;
                const c1Y = rootY - sinA * (st.len * 0.35) + cosA * sway1;

                const c2X = rootX - cosA * (st.len * 0.70) - sinA * sway2;
                const c2Y = rootY - sinA * (st.len * 0.70) + cosA * sway2;

                const tipX = rootX - cosA * st.len - sinA * sway3;
                const tipY = rootY - sinA * st.len + cosA * sway3;

                st.pathEl.setAttribute('d', `M ${rootX.toFixed(2)},${rootY.toFixed(2)} C ${c1X.toFixed(2)},${c1Y.toFixed(2)} ${c2X.toFixed(2)},${c2Y.toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)}`);
                st.pathEl.setAttribute('opacity', opacity.toFixed(2));

                st.gemEl.setAttribute('transform', `translate(${tipX.toFixed(2)}, ${tipY.toFixed(2)}) rotate(${pDeg})`);
                st.gemEl.setAttribute('opacity', opacity.toFixed(2));
            }

            // --- D. Update Wingtip Vortex Sparks ---
            const tipLX = px + cosA * (-14) - sinA * (-56 * wingScale);
            const tipLY = py + sinA * (-14) + cosA * (-56 * wingScale);
            const tipRX = px + cosA * (-14) - sinA * (56 * wingScale);
            const tipRY = py + sinA * (-14) + cosA * (56 * wingScale);

            for (const wsp of wingSparks) {
                const tipX = wsp.isLeft ? tipLX : tipRX;
                const tipY = wsp.isLeft ? tipLY : tipRY;
                const tNorm = ((timestamp * 0.002 + wsp.lifeOffset) % 1);
                const lagDist = tNorm * 40;
                const wx = tipX - cosA * lagDist + Math.sin(timestamp * 0.015 + wsp.lifeOffset * 6) * 3;
                const wy = tipY - sinA * lagDist + Math.cos(timestamp * 0.015 + wsp.lifeOffset * 6) * 3;
                const wop = Math.max(0, (1 - tNorm) * opacity);

                wsp.el.setAttribute('cx', wx.toFixed(2));
                wsp.el.setAttribute('cy', wy.toFixed(2));
                wsp.el.setAttribute('r', (wsp.radius * (1 - tNorm * 0.4)).toFixed(2));
                wsp.el.setAttribute('opacity', wop.toFixed(2));
            }

            // --- E. Update Rising Path Embers ---
            const maxOffset = Math.min(260, totalLen);
            for (const esp of pathEmbers) {
                const eDist = headDist - esp.distOffset;
                const ePt = this.getPointOnPath(eDist);

                const eSway = Math.sin(timestamp * esp.swayFreq + esp.phase) * esp.swayAmp;
                const rise = (timestamp * 0.02 * esp.riseSpeed + esp.phase * 20) % 28;
                const ex = ePt.x + ePt.nx * eSway - sinA * rise;
                const ey = ePt.y + ePt.ny * eSway - Math.abs(cosA) * rise;

                const lifeT = esp.distOffset / maxOffset;
                const fade = Math.sin(lifeT * Math.PI);
                let eOp = fade * (0.65 + 0.35 * Math.sin(timestamp * 0.03 + esp.phase));

                if (eDist < -30 || eDist > totalLen + 30) eOp = 0;

                esp.el.setAttribute('cx', ex.toFixed(2));
                esp.el.setAttribute('cy', ey.toFixed(2));
                esp.el.setAttribute('r', (esp.baseRadius * (0.8 + 0.4 * Math.sin(timestamp * 0.02 + esp.phase))).toFixed(2));
                esp.el.setAttribute('opacity', Math.max(0, Math.min(1, eOp)).toFixed(2));
            }

            // --- F. Update Rebirth Supernova Burst ---
            const burstElapsed = timestamp - burstStartTime;
            if (burstElapsed >= 0 && burstElapsed < 900) {
                const burstT = burstElapsed / 900;
                for (const sp of burstSparks) {
                    const travel = burstT * sp.speed;
                    const bx = destNode.x + Math.cos(sp.angle) * travel;
                    const by = destNode.y + Math.sin(sp.angle) * travel;
                    const bOp = Math.max(0, 1 - burstT * 1.1);

                    sp.el.setAttribute('cx', bx.toFixed(2));
                    sp.el.setAttribute('cy', by.toFixed(2));
                    sp.el.setAttribute('r', (sp.radius * (1 - burstT * 0.4)).toFixed(2));
                    sp.el.setAttribute('opacity', bOp.toFixed(2));
                }
            } else {
                for (const sp of burstSparks) {
                    sp.el.setAttribute('opacity', '0');
                }
            }

            this.phoenixAnimId = requestAnimationFrame(animate);
        };

        this.phoenixAnimId = requestAnimationFrame(animate);
    }

    stopFlamingPhoenix() {
        if (this.phoenixAnimId) {
            cancelAnimationFrame(this.phoenixAnimId);
            this.phoenixAnimId = null;
        }
        if (this.dragonAnimId) {
            cancelAnimationFrame(this.dragonAnimId);
            this.dragonAnimId = null;
        }
        if (this.sparkAnimId) {
            cancelAnimationFrame(this.sparkAnimId);
            this.sparkAnimId = null;
        }
        if (this.animationLayer) {
            this.animationLayer.innerHTML = '';
        }
        this.sparks = [];
        this.sparkSegments = [];
        this.sparkTotalLength = 0;
    }

    // Aliases for backwards compatibility
    startBlazingFireDragon() {
        this.startFlamingPhoenix();
    }

    stopBlazingFireDragon() {
        this.stopFlamingPhoenix();
    }

    startBlazingFireParticles() {
        this.startFlamingPhoenix();
    }

    stopBlazingFireParticles() {
        this.stopFlamingPhoenix();
    }
}