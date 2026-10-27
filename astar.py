"""
GraphCrypt v1.0 - A* Pathfinding Engine
Implements weighted A* search with multiple heuristic functions, priority queue,
detailed step snapshots for visualization, and telemetry.
"""

import heapq
import math
import time
from typing import Dict, List, Optional, Tuple, Any
from graph import Graph, GraphNode


class Heuristics:
    @staticmethod
    def euclidean(n1: GraphNode, n2: GraphNode, scale: float = 1.0) -> float:
        """Euclidean distance: sqrt((x1-x2)^2 + (y1-y2)^2)"""
        dx = n1.x - n2.x
        dy = n1.y - n2.y
        return math.sqrt(dx * dx + dy * dy) * scale

    @staticmethod
    def manhattan(n1: GraphNode, n2: GraphNode, scale: float = 1.0) -> float:
        """Manhattan distance: |x1-x2| + |y1-y2|"""
        dx = abs(n1.x - n2.x)
        dy = abs(n1.y - n2.y)
        return (dx + dy) * scale

    @staticmethod
    def chebyshev(n1: GraphNode, n2: GraphNode, scale: float = 1.0) -> float:
        """Chebyshev distance: max(|x1-x2|, |y1-y2|)"""
        dx = abs(n1.x - n2.x)
        dy = abs(n1.y - n2.y)
        return max(dx, dy) * scale

    @staticmethod
    def octile(n1: GraphNode, n2: GraphNode, scale: float = 1.0) -> float:
        """Octile / Diagonal distance"""
        dx = abs(n1.x - n2.x)
        dy = abs(n1.y - n2.y)
        d_min = min(dx, dy)
        d_max = max(dx, dy)
        return (d_max + (math.sqrt(2) - 1) * d_min) * scale

    @staticmethod
    def dijkstra(n1: GraphNode, n2: GraphNode, scale: float = 1.0) -> float:
        """Zero heuristic for pure Dijkstra shortest path"""
        return 0.0


def calculate_heuristic(
    graph: Graph,
    node_id: str,
    goal_id: str,
    heuristic_type: str = "euclidean",
    scale: float = 1.0
) -> float:
    if node_id not in graph.nodes or goal_id not in graph.nodes:
        return 0.0
    
    n1 = graph.nodes[node_id]
    n2 = graph.nodes[goal_id]
    
    h_type = heuristic_type.lower().strip()
    if "manhattan" in h_type:
        return round(Heuristics.manhattan(n1, n2, scale), 4)
    elif "chebyshev" in h_type:
        return round(Heuristics.chebyshev(n1, n2, scale), 4)
    elif "octile" in h_type or "diagonal" in h_type:
        return round(Heuristics.octile(n1, n2, scale), 4)
    elif "dijkstra" in h_type or "none" in h_type or "zero" in h_type:
        return 0.0
    else:
        # Default Euclidean
        return round(Heuristics.euclidean(n1, n2, scale), 4)


def run_astar(
    graph: Graph,
    start_id: str,
    goal_id: str,
    heuristic_type: str = "euclidean"
) -> Dict[str, Any]:
    """
    Executes the A* pathfinding algorithm on the given graph using original edge weights.
    Returns optimal path, costs, visited nodes, evaluated edges, and animation steps.
    """
    start_time = time.perf_counter()

    if start_id not in graph.nodes:
        return {
            "success": False,
            "error": f"Start node '{start_id}' does not exist in graph.",
            "path": [],
            "total_cost": 0,
            "visited_nodes": [],
            "evaluated_edges": [],
            "steps": [],
            "execution_time_ms": 0
        }

    if goal_id not in graph.nodes:
        return {
            "success": False,
            "error": f"Destination node '{goal_id}' does not exist in graph.",
            "path": [],
            "total_cost": 0,
            "visited_nodes": [],
            "evaluated_edges": [],
            "steps": [],
            "execution_time_ms": 0
        }

    if start_id == goal_id:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        return {
            "success": True,
            "path": [start_id],
            "path_edges": [],
            "total_cost": 0.0,
            "visited_nodes": [start_id],
            "evaluated_edges": [],
            "steps": [{
                "step_index": 0,
                "current_node": start_id,
                "action": f"Start node is already destination '{goal_id}'",
                "open_set": [start_id],
                "closed_set": [],
                "g_scores": {start_id: 0.0},
                "f_scores": {start_id: 0.0}
            }],
            "execution_time_ms": round(elapsed, 2),
            "heuristic_used": heuristic_type,
            "start_node": start_id,
            "goal_node": goal_id
        }

    # Data structures for A*
    counter = 0
    open_heap = []
    
    g_score: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    g_score[start_id] = 0.0

    f_score: Dict[str, float] = {node_id: float('inf') for node_id in graph.nodes}
    h_start = calculate_heuristic(graph, start_id, goal_id, heuristic_type)
    f_score[start_id] = h_start

    heapq.heappush(open_heap, (f_score[start_id], counter, start_id))
    
    came_from: Dict[str, str] = {}
    came_from_edge: Dict[str, str] = {}
    
    open_set_tracker = {start_id}
    closed_set = set()
    
    visited_nodes_order = []
    evaluated_edges_order = []
    # Membership set mirrors evaluated_edges_order so the per-expansion check is
    # O(1) instead of an O(E) list scan on every neighbour.
    evaluated_edges_seen = set()
    steps = []
    step_count = 0

    steps.append({
        "step_index": step_count,
        "current_node": start_id,
        "action": f"Initialize A* from '{start_id}' targeting '{goal_id}'. h({start_id}) = {h_start:.2f}",
        "open_set": list(open_set_tracker),
        "closed_set": list(closed_set),
        "g_scores": {k: v for k, v in g_score.items() if v != float('inf')},
        "f_scores": {k: v for k, v in f_score.items() if v != float('inf')},
        "highlight_edge": None
    })

    found_goal = False

    while open_heap:
        current_f, _, current_node = heapq.heappop(open_heap)
        
        if current_node in closed_set:
            continue
            
        open_set_tracker.discard(current_node)
        closed_set.add(current_node)
        
        if current_node not in visited_nodes_order:
            visited_nodes_order.append(current_node)

        step_count += 1
        steps.append({
            "step_index": step_count,
            "current_node": current_node,
            "action": f"Expanding node '{current_node}' with g = {g_score[current_node]:.2f}, f = {current_f:.2f}",
            "open_set": list(open_set_tracker),
            "closed_set": list(closed_set),
            "g_scores": {k: v for k, v in g_score.items() if v != float('inf')},
            "f_scores": {k: v for k, v in f_score.items() if v != float('inf')},
            "highlight_edge": came_from_edge.get(current_node)
        })

        if current_node == goal_id:
            found_goal = True
            break

        # Explore neighbors
        for neighbor_id, weight, edge_id in graph.get_neighbors(current_node):
            if edge_id not in evaluated_edges_seen:
                evaluated_edges_seen.add(edge_id)
                evaluated_edges_order.append(edge_id)
                
            if neighbor_id in closed_set:
                continue

            tentative_g = g_score[current_node] + weight
            
            if tentative_g < g_score[neighbor_id]:
                # Found a better path to neighbor
                came_from[neighbor_id] = current_node
                came_from_edge[neighbor_id] = edge_id
                g_score[neighbor_id] = tentative_g
                h_val = calculate_heuristic(graph, neighbor_id, goal_id, heuristic_type)
                f_val = tentative_g + h_val
                f_score[neighbor_id] = f_val
                
                counter += 1
                heapq.heappush(open_heap, (f_val, counter, neighbor_id))
                open_set_tracker.add(neighbor_id)

                step_count += 1
                steps.append({
                    "step_index": step_count,
                    "current_node": current_node,
                    "neighbor_node": neighbor_id,
                    "action": f"Evaluated edge '{current_node}' -> '{neighbor_id}' (weight {weight:.1f}). Updated g({neighbor_id}) = {tentative_g:.1f}, f({neighbor_id}) = {f_val:.1f}",
                    "open_set": list(open_set_tracker),
                    "closed_set": list(closed_set),
                    "g_scores": {k: v for k, v in g_score.items() if v != float('inf')},
                    "f_scores": {k: v for k, v in f_score.items() if v != float('inf')},
                    "highlight_edge": edge_id
                })

    elapsed_ms = max(0.1, (time.perf_counter() - start_time) * 1000.0)

    if not found_goal:
        return {
            "success": False,
            "error": f"No path exists between '{start_id}' and '{goal_id}'. The graph may be disconnected.",
            "path": [],
            "path_edges": [],
            "total_cost": 0.0,
            "visited_nodes": visited_nodes_order,
            "evaluated_edges": evaluated_edges_order,
            "steps": steps,
            "execution_time_ms": round(elapsed_ms, 2),
            "heuristic_used": heuristic_type,
            "start_node": start_id,
            "goal_node": goal_id
        }

    # Reconstruct optimal path
    path = []
    path_edges = []
    curr = goal_id
    while curr in came_from:
        path.append(curr)
        edge_id = came_from_edge[curr]
        path_edges.append(edge_id)
        curr = came_from[curr]
    path.append(start_id)
    path.reverse()
    path_edges.reverse()

    total_cost = g_score[goal_id]

    # Final completion step
    step_count += 1
    steps.append({
        "step_index": step_count,
        "current_node": goal_id,
        "action": f"Destination '{goal_id}' reached! Shortest path: {' -> '.join(path)} with total cost {total_cost:.1f}",
        "open_set": list(open_set_tracker),
        "closed_set": list(closed_set),
        "g_scores": {k: v for k, v in g_score.items() if v != float('inf')},
        "f_scores": {k: v for k, v in f_score.items() if v != float('inf')},
        "final_path": path,
        "final_edges": path_edges
    })

    return {
        "success": True,
        "path": path,
        "path_edges": path_edges,
        "total_cost": round(total_cost, 1),
        "visited_nodes": visited_nodes_order,
        "evaluated_edges": evaluated_edges_order,
        "steps": steps,
        "execution_time_ms": round(elapsed_ms, 2),
        "heuristic_used": heuristic_type,
        "start_node": start_id,
        "goal_node": goal_id
    }
