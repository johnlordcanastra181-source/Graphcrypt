"""
GraphCrypt v1.0 - Exporter Module
Generates dynamic TXT report files and in-memory streams for downloading.
"""

import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from graph import Graph
from cipher import get_edge_transformations


def generate_concise_txt(
    graph: Graph,
    path_nodes: List[str],
    shift: int = 3,
    heuristic_name: str = "Euclidean Distance"
) -> str:
    """
    Generates concise TXT content formatted exactly as shown in the screenshot preview:
    
    --- ENCRYPTED EDGE WEIGHTS ---
    A -> B : 8
    A -> C : 6
    B -> D : 7
    C -> D : 5
    D -> E : 9

    --- Metadata ---
    Cipher: Caesar Cipher
    Shift: +3
    Algorithm: A*
    Heuristic: Euclidean Distance
    """
    transforms = get_edge_transformations(graph, path_nodes, shift)
    
    lines = []
    lines.append("--- ENCRYPTED EDGE WEIGHTS ---")
    
    for t in transforms["all_transformations"]:
        lines.append(f"{t['source']} -> {t['target']} : {t['encrypted_weight']}")
        
    lines.append("")
    lines.append("--- Metadata ---")
    lines.append(f"Cipher: Caesar Cipher")
    shift_str = f"+{shift}" if shift >= 0 else str(shift)
    lines.append(f"Shift: {shift_str}")
    lines.append("Algorithm: A*")
    lines.append(f"Heuristic: {heuristic_name}")
    
    if path_nodes:
        lines.append(f"Path: {' -> '.join(path_nodes)}")
        lines.append(f"Total Original Cost: {transforms['original_path_cost']}")
        lines.append(f"Encrypted Path Cost: {transforms['encrypted_path_cost']}")

    return "\n".join(lines)


def generate_full_report_txt(
    graph: Graph,
    astar_result: Dict[str, Any],
    shift: int = 3
) -> str:
    """
    Generates a full detailed analytical text report including execution stats,
    step breakdowns, original vs encrypted mappings, and cryptographic details.
    """
    path_nodes = astar_result.get("path", [])
    heuristic_name = astar_result.get("heuristic_used", "Euclidean Distance")
    transforms = get_edge_transformations(graph, path_nodes, shift)
    
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    lines = [
        "==================================================================",
        "          GRAPHCRYPT v1.0 - PRECISION ALGORITHM ENGINE            ",
        "          A* Shortest Path & Modulo-10 Caesar Cipher Report       ",
        "==================================================================",
        f"Generated At      : {now_str}",
        f"Graph Nodes Count : {len(graph.nodes)}",
        f"Graph Edges Count : {len(graph.edges)}",
        "------------------------------------------------------------------",
        "",
        "--- A* PATHFINDING EXECUTION SUMMARY ---",
        f"Status            : {'SUCCESS' if astar_result.get('success') else 'FAILED'}",
        f"Start Node        : {astar_result.get('start_node', 'N/A')}",
        f"Destination Node  : {astar_result.get('goal_node', 'N/A')}",
        f"Heuristic Function: {heuristic_name}",
        f"Optimal Path      : {' -> '.join(path_nodes) if path_nodes else 'No Path Found'}",
        f"Original Cost     : {astar_result.get('total_cost', 0.0)}",
        f"Nodes Visited     : {len(astar_result.get('visited_nodes', []))}",
        f"Edges Evaluated   : {len(astar_result.get('evaluated_edges', []))}",
        f"Execution Time    : {astar_result.get('execution_time_ms', 0.0)} ms",
        "",
        "--- ENCRYPTED EDGE WEIGHTS ---"
    ]

    for t in transforms["all_transformations"]:
        path_tag = " [SHORTEST PATH]" if t["is_on_path"] else ""
        lines.append(f"{t['source']} -> {t['target']} : {t['encrypted_weight']} (Original: {t['original_weight']}){path_tag}")

    lines.append("")
    lines.append("--- PATH VISUAL TRANSFORMATIONS ---")
    if transforms["path_transformations"]:
        for pt in transforms["path_transformations"]:
            lines.append(f"  {pt['source']} -> {pt['target']} | Original: {pt['original_weight']} | Shift: {pt['shift']:+d} | Encrypted: {pt['encrypted_weight']}")
        lines.append(f"Total Original Path Weight : {transforms['original_path_cost']}")
        lines.append(f"Total Encrypted Path Weight: {transforms['encrypted_path_cost']}")
    else:
        lines.append("  No active path selected or path unavailable.")

    lines.append("")
    lines.append("--- CRYPTOGRAPHY & METADATA ---")
    lines.append("Cipher Method    : Caesar Cipher (Numeric Modulo 10)")
    lines.append(f"Shift / Key Value: {shift:+d}")
    lines.append("Formula          : encrypted_digit = (original_digit + shift) mod 10")
    lines.append("Pathfinding Alg  : A* (A-Star)")
    lines.append(f"Heuristic        : {heuristic_name}")
    lines.append("Engine           : GraphCrypt v1.0 Core Engine")
    lines.append("==================================================================")

    return "\n".join(lines)


def get_txt_bytes_stream(text_content: str) -> io.BytesIO:
    """
    Wraps plain text string into an in-memory BytesIO binary stream for Flask send_file.
    """
    byte_data = text_content.encode("utf-8")
    stream = io.BytesIO(byte_data)
    stream.seek(0)
    return stream
