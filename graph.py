"""
GraphCrypt v1.0 - Graph Core Module
Manages the graph data structure, nodes, weighted edges, validations, and state.
"""

from typing import Dict, List, Optional, Tuple, Any
import math
import uuid


class GraphNode:
    def __init__(self, node_id: str, name: str, x: float, y: float):
        self.id = str(node_id).strip()
        self.name = str(name).strip()
        self.x = float(x)
        self.y = float(y)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "x": self.x,
            "y": self.y
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GraphNode":
        return cls(
            node_id=data.get("id", str(uuid.uuid4())[:8]),
            name=data.get("name", "Node"),
            x=data.get("x", 100.0),
            y=data.get("y", 100.0)
        )


class GraphEdge:
    def __init__(self, edge_id: str, source: str, target: str, weight: float):
        self.id = str(edge_id).strip()
        self.source = str(source).strip()
        self.target = str(target).strip()
        self.weight = float(weight)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source": self.source,
            "target": self.target,
            "weight": self.weight
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GraphEdge":
        return cls(
            edge_id=data.get("id", str(uuid.uuid4())[:8]),
            source=data.get("source"),
            target=data.get("target"),
            weight=data.get("weight", 1.0)
        )


class Graph:
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: Dict[str, GraphEdge] = {}
        self.load_sample_graph()

    def clear(self) -> None:
        """Clear all nodes and edges."""
        self.nodes.clear()
        self.edges.clear()

    def load_sample_graph(self) -> None:
        """
        Loads the default sample graph based on the Guam Map coordinates,
        with 20 nodes ordered sequentially from A to T where:
        - Node A is the starting point at (1200.6, 150.1)
        - Node T is the farthest node at (85.0, 539.9) (replaces letter O)
        """
        self.clear()
        
        # 20 Nodes in sequential order from A to T on the map coordinates
        nodes_coords = {
            'A': (1200.6, 150.1), # Starting point (East)
            'B': (1195.6, 513.9), # South-East
            'C': (1094.5, 137.0), # North-East
            'D': (1072.4, 530.8), # South-East mid
            'E': (1071.4, 350.4), # Mid-East
            'F': (1060.5, 173.0), # North-East mid
            'G': (988.1, 532.8),  # South-Central East
            'H': (976.2, 350.4),  # Central East
            'I': (838.6, 536.0),  # South-Central
            'J': (814.6, 174.9),  # North-Central
            'K': (815.8, 82.7),   # Far North
            'L': (804.7, 351.4),  # Central
            'M': (775.0, 535.7),  # South-West mid
            'N': (628.5, 539.8),  # South-West
            'O': (620.3, 356.3),  # Mid-West
            'P': (617.3, 179.9),  # North-West
            'Q': (614.4, 89.6),   # Far North-West
            'R': (450.1, 152.1),  # West mid
            'S': (205.0, 195.7),  # Penultimate West
            'T': (85.0, 539.9)    # Farthest Destination (South-West tip)
        }

        for node_id, (x, y) in nodes_coords.items():
            self.add_node(node_id, node_id, x, y)

        # Graph road network connections
        edges_list = [
            ('A', 'B'), ('A', 'C'),
            ('B', 'D'),
            ('C', 'F'),
            ('D', 'E'), ('D', 'G'),
            ('E', 'F'), ('E', 'H'),
            ('F', 'J'),
            ('G', 'H'), ('G', 'I'),
            ('H', 'L'),
            ('I', 'M'),
            ('J', 'K'), ('J', 'L'), ('J', 'P'),
            ('K', 'Q'),
            ('L', 'O'),
            ('M', 'N'),
            ('N', 'O'), ('N', 'T'),
            ('O', 'P'),
            ('P', 'Q'), ('P', 'R'),
            ('Q', 'R'),
            ('R', 'S'),
            ('S', 'T')
        ]

        def calc_dist(u, v):
            x1, y1 = nodes_coords[u]
            x2, y2 = nodes_coords[v]
            return round(math.hypot(x2 - x1, y2 - y1), 1)

        for u, v in edges_list:
            weight = calc_dist(u, v)
            edge_id = f"e_{u}_{v}"
            self.add_edge(u, v, weight, edge_id)

    def add_node(self, node_id: str, name: str, x: float, y: float) -> GraphNode:
        node_id = str(node_id).strip()
        name = str(name).strip()
        if not node_id:
            raise ValueError("Node ID cannot be empty.")
        if not name:
            name = node_id
        if node_id in self.nodes:
            raise ValueError(f"Node '{node_id}' already exists.")

        node = GraphNode(node_id, name, float(x), float(y))
        self.nodes[node_id] = node
        return node

    def update_node(self, node_id: str, name: Optional[str] = None, x: Optional[float] = None, y: Optional[float] = None) -> GraphNode:
        if node_id not in self.nodes:
            raise KeyError(f"Node '{node_id}' not found.")
        node = self.nodes[node_id]
        if name is not None and name.strip():
            node.name = name.strip()
        if x is not None:
            node.x = float(x)
        if y is not None:
            node.y = float(y)
        return node

    def delete_node(self, node_id: str) -> None:
        if node_id not in self.nodes:
            raise KeyError(f"Node '{node_id}' not found.")
        
        # Delete attached edges
        edges_to_remove = [
            e_id for e_id, edge in self.edges.items()
            if edge.source == node_id or edge.target == node_id
        ]
        for e_id in edges_to_remove:
            del self.edges[e_id]

        del self.nodes[node_id]

    def add_edge(self, source: str, target: str, weight: float, edge_id: Optional[str] = None) -> GraphEdge:
        source = str(source).strip()
        target = str(target).strip()
        
        if source not in self.nodes:
            raise ValueError(f"Source node '{source}' does not exist.")
        if target not in self.nodes:
            raise ValueError(f"Target node '{target}' does not exist.")
        if source == target:
            raise ValueError("Self-loop connections are not supported.")
        
        try:
            num_weight = float(weight)
        except (ValueError, TypeError):
            raise ValueError("Edge weight must be a valid number.")

        if num_weight < 0:
            raise ValueError("Negative edge weights are not allowed in A* pathfinding.")

        # Check for existing duplicate edge between the same pair
        for existing in self.edges.values():
            if (existing.source == source and existing.target == target) or \
               (existing.source == target and existing.target == source):
                raise ValueError(f"An edge between '{source}' and '{target}' already exists. Please edit its weight instead.")

        if not edge_id:
            edge_id = f"e_{source}_{target}"
        
        edge = GraphEdge(edge_id, source, target, num_weight)
        self.edges[edge_id] = edge
        return edge

    def update_edge_weight(self, edge_id: str, weight: float) -> GraphEdge:
        if edge_id not in self.edges:
            raise KeyError(f"Edge '{edge_id}' not found.")
        
        try:
            num_weight = float(weight)
        except (ValueError, TypeError):
            raise ValueError("Edge weight must be a valid number.")

        if num_weight < 0:
            raise ValueError("Negative edge weights are not allowed in A* pathfinding.")

        edge = self.edges[edge_id]
        edge.weight = num_weight
        return edge

    def delete_edge(self, edge_id: str) -> None:
        if edge_id not in self.edges:
            raise KeyError(f"Edge '{edge_id}' not found.")
        del self.edges[edge_id]

    def get_neighbors(self, node_id: str) -> List[Tuple[str, float, str]]:
        """
        Returns list of (neighbor_node_id, edge_weight, edge_id) for a given node.
        Edges are undirected in this graph model so pathfinding can traverse either way.
        """
        neighbors = []
        for edge_id, edge in self.edges.items():
            if edge.source == node_id:
                neighbors.append((edge.target, edge.weight, edge_id))
            elif edge.target == node_id:
                neighbors.append((edge.source, edge.weight, edge_id))
        return neighbors

    def get_edge_between(self, node1: str, node2: str) -> Optional[GraphEdge]:
        """Finds edge between two nodes if it exists."""
        for edge in self.edges.values():
            if (edge.source == node1 and edge.target == node2) or \
               (edge.source == node2 and edge.target == node1):
                return edge
        return None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": [e.to_dict() for e in self.edges.values()]
        }

    def from_dict(self, data: Dict[str, Any]) -> None:
        self.clear()
        for node_data in data.get("nodes", []):
            self.add_node(
                node_data["id"],
                node_data.get("name", node_data["id"]),
                node_data.get("x", 100),
                node_data.get("y", 100)
            )
        for edge_data in data.get("edges", []):
            self.add_edge(
                edge_data["source"],
                edge_data["target"],
                edge_data.get("weight", 1.0),
                edge_data.get("id")
            )
