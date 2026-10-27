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
        if (this.lastPathNodes && this.lastPathNodes.length >= 2 && (this.sparkAnimId || this.dragonAnimId)) {
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
    // RUNNING FIRE DRAGON ROUTE FINDING VISUALIZATION
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
            this.startBlazingFireDragon();
        } else {
            this.stopBlazingFireDragon();
        }
    }

    clearHighlights() {
        this.pathNodeIds.clear();
        this.pathEdgeIds.clear();
        this.visitedNodeIds.clear();
        this.evaluatedEdgeIds.clear();
        this.currentNodeId = null;
        this.lastPathNodes = [];
        this.stopBlazingFireDragon();
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

    startBlazingFireDragon() {
        this.stopBlazingFireDragon();
        this.recalculateSparkSegments();

        if (!this.animationLayer || this.sparkSegments.length === 0 || this.sparkTotalLength <= 0) {
            return;
        }

        // ==========================================
        // 1. ASSEMBLE DRAGON SVG HIERARCHY
        // ==========================================
        const dragonRoot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dragonRoot.setAttribute('class', 'dragon-container');
        this.animationLayer.appendChild(dragonRoot);

        // Destination Supernova / Burst Layer
        const burstLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        burstLayer.setAttribute('class', 'dragon-destination-burst');
        dragonRoot.appendChild(burstLayer);

        // Dragon Trail Embers Layer (behind dragon body)
        const trailLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dragonRoot.appendChild(trailLayer);

        // Running Claws / Legs Layer
        const clawsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dragonRoot.appendChild(clawsLayer);

        // Articulated Body Segments & Spine Fins
        const bodyLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dragonRoot.appendChild(bodyLayer);

        // Dragon Head Group (front layer)
        const headGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        headGroup.setAttribute('class', 'dragon-head-group');
        dragonRoot.appendChild(headGroup);

        // --- Build Dragon Head Features ---
        // Flame breath shooting forward from snout (+X)
        const flameBreath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        flameBreath.setAttribute('points', '18,-5 36,-1 46,0 36,1 18,5 24,0');
        flameBreath.setAttribute('class', 'dragon-flame-breath');
        headGroup.appendChild(flameBreath);

        // Upper & Lower Whisker Filaments
        const whiskerTop = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        whiskerTop.setAttribute('d', 'M 8,-3 Q 0,-12 -16,-10 Q -24,-9 -32,-6');
        whiskerTop.setAttribute('class', 'dragon-whisker');
        headGroup.appendChild(whiskerTop);

        const whiskerBottom = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        whiskerBottom.setAttribute('d', 'M 8,3 Q 0,12 -16,10 Q -24,9 -32,6');
        whiskerBottom.setAttribute('class', 'dragon-whisker');
        headGroup.appendChild(whiskerBottom);

        // Dragon Horns
        const hornUpper = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hornUpper.setAttribute('d', 'M -4,-6 Q -12,-18 -24,-16 Q -15,-11 -4,-4 Z');
        hornUpper.setAttribute('class', 'dragon-horn');
        headGroup.appendChild(hornUpper);

        const hornLower = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hornLower.setAttribute('d', 'M -4,6 Q -12,18 -24,16 Q -15,11 -4,4 Z');
        hornLower.setAttribute('class', 'dragon-horn');
        headGroup.appendChild(hornLower);

        // Brow Crest Spikes
        const browSpikeTop = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        browSpikeTop.setAttribute('points', '-2,-8 -12,-12 -6,-6');
        browSpikeTop.setAttribute('class', 'dragon-spine-fin');
        headGroup.appendChild(browSpikeTop);

        const browSpikeBottom = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        browSpikeBottom.setAttribute('points', '-2,8 -12,12 -6,6');
        browSpikeBottom.setAttribute('class', 'dragon-spine-fin');
        headGroup.appendChild(browSpikeBottom);

        // Main Dragon Skull / Snout Shape
        const skull = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        skull.setAttribute('d', 'M -8,-8 L 6,-7 L 16,-3 L 20,0 L 16,3 L 6,7 L -8,8 L -5,0 Z');
        skull.setAttribute('class', 'dragon-head-skull');
        headGroup.appendChild(skull);

        // Golden Glowing Eyes
        const eyeTop = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eyeTop.setAttribute('cx', '7');
        eyeTop.setAttribute('cy', '-3.8');
        eyeTop.setAttribute('r', '2.2');
        eyeTop.setAttribute('class', 'dragon-eye');
        headGroup.appendChild(eyeTop);

        const eyeBottom = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eyeBottom.setAttribute('cx', '7');
        eyeBottom.setAttribute('cy', '3.8');
        eyeBottom.setAttribute('r', '2.2');
        eyeBottom.setAttribute('class', 'dragon-eye');
        headGroup.appendChild(eyeBottom);

        // --- Build Body Segments (20 articulated segments) ---
        const numSegments = 20;
        const segSpacing = 11;
        const bodySegments = [];

        for (let i = 0; i < numSegments; i++) {
            const segG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            bodyLayer.appendChild(segG);

            const spineFin = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            spineFin.setAttribute('class', 'dragon-spine-fin');
            segG.appendChild(spineFin);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'dragon-body-segment');
            segG.appendChild(circle);

            const r = Math.max(3.2, 12.0 * (1.0 - (i / numSegments) * 0.72));
            circle.setAttribute('r', r.toFixed(1));

            const finHeight = r + 6.5;
            spineFin.setAttribute('points', `-3,-${(r * 0.6).toFixed(1)} 0,-${finHeight.toFixed(1)} 3,-${(r * 0.6).toFixed(1)}`);

            bodySegments.push({
                group: segG,
                circle: circle,
                spineFin: spineFin,
                radius: r,
                index: i
            });
        }

        // --- Build Running Claws (4 legs) ---
        const legDefs = [
            { segIndex: 4, side: -1, phase: 0 },
            { segIndex: 4, side: 1, phase: Math.PI },
            { segIndex: 12, side: -1, phase: Math.PI * 0.75 },
            { segIndex: 12, side: 1, phase: Math.PI * 1.75 }
        ];

        const legElements = [];
        for (const leg of legDefs) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'dragon-claw');
            clawsLayer.appendChild(path);
            legElements.push({ ...leg, el: path });
        }

        // --- Build Wake Trail Embers (36 particles) ---
        const trailSparks = [];
        const sparkColors = ['#FFFFFF', '#FFF7C2', '#FFE033', '#FF9D00', '#FF5500', '#FF1A00'];
        for (let i = 0; i < 36; i++) {
            const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const color = sparkColors[i % sparkColors.length];
            spark.setAttribute('fill', color);
            spark.setAttribute('class', 'blazing-fire-spark');
            spark.style.filter = `drop-shadow(0 0 ${2 + (i % 4)}px ${color})`;
            trailLayer.appendChild(spark);

            trailSparks.push({
                el: spark,
                distOffset: (i / 36) * (numSegments * segSpacing + 80),
                swayAmp: 3.0 + (i % 5) * 2.2,
                swayFreq: 0.005 + (i % 3) * 0.002,
                phase: (i * 1.1) % (Math.PI * 2),
                baseRadius: 1.8 + (i % 4) * 0.8
            });
        }

        // --- Build Destination Supernova Burst Sparks (24 particles) ---
        const burstSparks = [];
        for (let i = 0; i < 24; i++) {
            const sp = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            sp.setAttribute('class', 'dragon-burst-spark');
            sp.setAttribute('fill', i % 2 === 0 ? '#FFE033' : '#FF4500');
            sp.style.filter = 'drop-shadow(0 0 6px #FF8800)';
            sp.setAttribute('opacity', '0');
            burstLayer.appendChild(sp);

            const angle = (i / 24) * Math.PI * 2;
            burstSparks.push({
                el: sp,
                angle: angle,
                speed: 80 + (i % 4) * 40,
                radius: 2.4 + (i % 3) * 0.8
            });
        }

        // ==========================================
        // 2. FIRE DRAGON KINEMATICS & FLIGHT LOOP
        // ==========================================
        let headDist = -60;
        let lastTime = performance.now();
        let burstStartTime = -9999;
        let burstTriggered = false;

        const dragonSpeed = Math.max(260, Math.min(390, this.sparkTotalLength / 2.8));
        const totalLen = this.sparkTotalLength;
        const destNode = this.sparkSegments[this.sparkSegments.length - 1].p2;

        const animate = (timestamp) => {
            const dt = Math.min(0.08, (timestamp - lastTime) / 1000);
            lastTime = timestamp;

            headDist += dragonSpeed * dt;

            // Check destination collision / supernova burst
            if (headDist >= totalLen - 20 && !burstTriggered) {
                burstStartTime = timestamp;
                burstTriggered = true;
            }

            // Loop smoothly back to Start node once full dragon has traversed
            if (headDist > totalLen + 170) {
                headDist = -240;
                burstTriggered = false;
            }

            // --- A. Update Dragon Head ---
            const headPt = this.getPointOnPath(headDist);
            const headSway = Math.sin(timestamp * 0.009) * 4.5;
            const hX = headPt.x + headPt.nx * headSway;
            const hY = headPt.y + headPt.ny * headSway;
            const hAngle = headPt.angle + Math.cos(timestamp * 0.009) * 0.12;
            const hDeg = (hAngle * 180 / Math.PI).toFixed(2);

            let headOpacity = 1.0;
            if (headDist < 0) {
                headOpacity = Math.max(0, 1 + headDist / 60);
            } else if (headDist > totalLen) {
                headOpacity = Math.max(0, 1 - (headDist - totalLen) / 120);
            }

            headGroup.setAttribute('transform', `translate(${hX.toFixed(2)}, ${hY.toFixed(2)}) rotate(${hDeg})`);
            headGroup.setAttribute('opacity', headOpacity.toFixed(2));

            // --- B. Update Body Segments & Fins ---
            for (let i = 0; i < numSegments; i++) {
                const sDist = headDist - (i + 1) * segSpacing;
                const sPt = this.getPointOnPath(sDist);

                const slither = Math.sin(timestamp * 0.009 - (i + 1) * 0.38) * Math.min(1.0, (i + 2) / 5) * 8.0;
                const bx = sPt.x + sPt.nx * slither;
                const by = sPt.y + sPt.ny * slither;
                const bAngle = sPt.angle + Math.cos(timestamp * 0.009 - (i + 1) * 0.38) * 0.25;
                const bDeg = (bAngle * 180 / Math.PI).toFixed(2);

                let bOpacity = 1.0;
                if (sDist < 0) {
                    bOpacity = Math.max(0, 1 + sDist / 60);
                } else if (sDist > totalLen) {
                    bOpacity = Math.max(0, 1 - (sDist - totalLen) / 100);
                }

                bodySegments[i].group.setAttribute('transform', `translate(${bx.toFixed(2)}, ${by.toFixed(2)}) rotate(${bDeg})`);
                bodySegments[i].group.setAttribute('opacity', bOpacity.toFixed(2));
                bodySegments[i].curX = bx;
                bodySegments[i].curY = by;
                bodySegments[i].curNx = sPt.nx;
                bodySegments[i].curNy = sPt.ny;
                bodySegments[i].curOpacity = bOpacity;
            }

            // --- C. Update Running Dragon Claws (4 legs) ---
            for (const leg of legElements) {
                const segData = bodySegments[leg.segIndex];
                if (!segData) continue;

                const legStride = Math.sin(timestamp * 0.016 + leg.phase) * 7.5;
                const clawExt = leg.side * (segData.radius + 7 + Math.abs(legStride * 0.25));

                const kneeX = segData.curNx * (clawExt * 0.55) + segData.curNy * (legStride * 0.4);
                const kneeY = segData.curNy * (clawExt * 0.55) - segData.curNx * (legStride * 0.4);

                const footX = segData.curNx * clawExt + segData.curNy * legStride;
                const footY = segData.curNy * clawExt - segData.curNx * legStride;

                const bx = segData.curX;
                const by = segData.curY;

                leg.el.setAttribute('d', `M ${bx.toFixed(2)},${by.toFixed(2)} Q ${(bx + kneeX).toFixed(2)},${(by + kneeY).toFixed(2)} ${(bx + footX).toFixed(2)},${(by + footY).toFixed(2)}`);
                leg.el.setAttribute('opacity', (segData.curOpacity * 0.9).toFixed(2));
            }

            // --- D. Update Wake Trail Embers ---
            const maxTrailOffset = numSegments * segSpacing + 80;
            for (const spark of trailSparks) {
                const eDist = headDist - spark.distOffset;
                const ePt = this.getPointOnPath(eDist);

                const eSway = Math.sin(timestamp * spark.swayFreq + spark.phase) * spark.swayAmp;
                const ex = ePt.x + ePt.nx * eSway;
                const ey = ePt.y + ePt.ny * eSway;

                const lifeT = spark.distOffset / maxTrailOffset;
                const fade = Math.sin(lifeT * Math.PI);
                let eOpacity = fade * (0.65 + 0.35 * Math.sin(timestamp * 0.03 + spark.phase));

                if (eDist < -30 || eDist > totalLen + 30) {
                    eOpacity = 0;
                }

                spark.el.setAttribute('cx', ex.toFixed(2));
                spark.el.setAttribute('cy', ey.toFixed(2));
                spark.el.setAttribute('r', (spark.baseRadius * (0.8 + 0.4 * Math.sin(timestamp * 0.02 + spark.phase))).toFixed(2));
                spark.el.setAttribute('opacity', Math.max(0, Math.min(1, eOpacity)).toFixed(2));
            }

            // --- E. Update Destination Supernova Burst ---
            const burstElapsed = timestamp - burstStartTime;
            if (burstElapsed >= 0 && burstElapsed < 900) {
                const burstT = burstElapsed / 900;
                for (const sp of burstSparks) {
                    const travel = burstT * sp.speed;
                    const px = destNode.x + Math.cos(sp.angle) * travel;
                    const py = destNode.y + Math.sin(sp.angle) * travel;
                    const op = Math.max(0, 1 - burstT * 1.1);

                    sp.el.setAttribute('cx', px.toFixed(2));
                    sp.el.setAttribute('cy', py.toFixed(2));
                    sp.el.setAttribute('r', (sp.radius * (1 - burstT * 0.4)).toFixed(2));
                    sp.el.setAttribute('opacity', op.toFixed(2));
                }
            } else {
                for (const sp of burstSparks) {
                    sp.el.setAttribute('opacity', '0');
                }
            }

            this.dragonAnimId = requestAnimationFrame(animate);
        };

        this.dragonAnimId = requestAnimationFrame(animate);
    }

    stopBlazingFireDragon() {
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
    startBlazingFireParticles() {
        this.startBlazingFireDragon();
    }

    stopBlazingFireParticles() {
        this.stopBlazingFireDragon();
    }
}