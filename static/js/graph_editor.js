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
        if (this.lastPathNodes && this.lastPathNodes.length >= 2 && this.sparkAnimId) {
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

    // ==========================================
    // BLAZING FIRE ROUTE FINDING VISUALIZATION
    // ==========================================

    setPathHighlights(pathNodes = [], pathEdges = [], visitedNodes = [], evaluatedEdges = [], currentNode = null) {
        this.pathNodeIds = new Set(pathNodes);
        this.pathEdgeIds = new Set(pathEdges);
        this.visitedNodeIds = new Set(visitedNodes);
        this.evaluatedEdgeIds = new Set(evaluatedEdges);
        this.currentNodeId = currentNode;
        this.lastPathNodes = Array.isArray(pathNodes) ? [...pathNodes] : [];
        this.render();

        if (this.lastPathNodes.length >= 2) {
            this.startBlazingFireParticles();
        } else {
            this.stopBlazingFireParticles();
        }
    }

    clearHighlights() {
        this.pathNodeIds.clear();
        this.pathEdgeIds.clear();
        this.visitedNodeIds.clear();
        this.evaluatedEdgeIds.clear();
        this.currentNodeId = null;
        this.lastPathNodes = [];
        this.stopBlazingFireParticles();
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
                startDist: totalLen,
                endDist: totalLen + len
            });
            totalLen += len;
        }

        this.sparkSegments = segments;
        this.sparkTotalLength = totalLen;
    }

    startBlazingFireParticles() {
        this.stopBlazingFireParticles();
        this.recalculateSparkSegments();

        if (!this.animationLayer || this.sparkSegments.length === 0 || this.sparkTotalLength <= 0) {
            return;
        }

        const sparkColors = ['#FFFFFF', '#FFF7C2', '#FFE033', '#FF9D00', '#FF5500', '#FF1A00'];
        const sparkCount = Math.min(60, Math.max(28, Math.floor(this.sparkTotalLength / 22)));
        this.sparks = [];

        for (let i = 0; i < sparkCount; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
            const radius = 2.0 + Math.random() * 3.6;
            circle.setAttribute('r', radius.toFixed(1));
            circle.setAttribute('fill', color);
            circle.setAttribute('class', 'blazing-fire-spark');
            circle.style.filter = `drop-shadow(0 0 ${2 + Math.random() * 4}px ${color})`;
            this.animationLayer.appendChild(circle);

            this.sparks.push({
                el: circle,
                dist: (i / sparkCount) * this.sparkTotalLength + (Math.random() * 16 - 8),
                speed: 130 + Math.random() * 140,
                baseRadius: radius,
                swayAmp: 2.5 + Math.random() * 4.5,
                swayFreq: 0.004 + Math.random() * 0.005,
                phase: Math.random() * Math.PI * 2,
                color: color
            });
        }

        let lastTime = performance.now();
        const animate = (timestamp) => {
            const dt = Math.min(0.08, (timestamp - lastTime) / 1000);
            lastTime = timestamp;

            const total = this.sparkTotalLength;
            if (total > 0 && this.sparkSegments.length > 0) {
                for (let i = 0; i < this.sparks.length; i++) {
                    const spark = this.sparks[i];
                    spark.dist += spark.speed * dt;
                    if (spark.dist > total) {
                        spark.dist = spark.dist % total;
                    } else if (spark.dist < 0) {
                        spark.dist = 0;
                    }

                    // Locate active segment
                    let seg = this.sparkSegments.find(s => spark.dist >= s.startDist && spark.dist <= s.endDist);
                    if (!seg) seg = this.sparkSegments[this.sparkSegments.length - 1];

                    const segT = Math.max(0, Math.min(1, (spark.dist - seg.startDist) / seg.len));
                    const baseX = seg.p1.x + seg.dx * segT;
                    const baseY = seg.p1.y + seg.dy * segT;

                    // Lateral flame sway
                    const sway = Math.sin(timestamp * spark.swayFreq + spark.phase) * spark.swayAmp;
                    const posX = baseX + seg.nx * sway;
                    const posY = baseY + seg.ny * sway;

                    // Flame flicker opacity & pulsing radius
                    const lifeT = spark.dist / total;
                    const fade = Math.sin(lifeT * Math.PI);
                    const flicker = 0.75 + 0.25 * Math.sin(timestamp * 0.02 + spark.phase);
                    const opacity = Math.max(0.15, Math.min(1.0, fade * flicker * 1.3));
                    const r = Math.max(1.2, spark.baseRadius * (0.85 + 0.35 * Math.sin(timestamp * 0.015 + spark.phase)));

                    spark.el.setAttribute('cx', posX.toFixed(2));
                    spark.el.setAttribute('cy', posY.toFixed(2));
                    spark.el.setAttribute('r', r.toFixed(2));
                    spark.el.setAttribute('opacity', opacity.toFixed(2));
                }
            }

            this.sparkAnimId = requestAnimationFrame(animate);
        };

        this.sparkAnimId = requestAnimationFrame(animate);
    }

    stopBlazingFireParticles() {
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
}
