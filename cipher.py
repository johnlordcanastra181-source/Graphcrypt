"""
GraphCrypt v1.0 - Cryptography Module
Implements numeric Modulo 10 Caesar Cipher for weighted edges and path encryption.
"""

from typing import Dict, List, Any, Union
from graph import Graph, GraphEdge


def encrypt_numeric_digit(digit_char: str, shift: int) -> str:
    """
    Encrypts a single decimal digit character (0-9) using Modulo 10 Caesar shift.
    Formula: (int(d) + shift) % 10
    """
    if not digit_char.isdigit():
        return digit_char
    val = int(digit_char)
    new_val = (val + shift) % 10
    return str(new_val)


def encrypt_weight_value(weight: Union[int, float, str], shift: int) -> Union[int, float]:
    """
    Encrypts a numerical weight by shifting each of its digits modulo 10.
    Examples:
      shift = +3:
        5 -> 8
        3 -> 6
        7 -> 0
        12 -> 45
        4.5 -> 7.8
    """
    # Clean representation: strip trailing zeros if it was e.g. 5.0 -> 5
    if isinstance(weight, float) and weight.is_integer():
        weight_str = str(int(weight))
    else:
        weight_str = str(weight)

    encrypted_chars = []
    for ch in weight_str:
        if ch.isdigit():
            encrypted_chars.append(encrypt_numeric_digit(ch, shift))
        else:
            encrypted_chars.append(ch)

    result_str = "".join(encrypted_chars)
    
    if "." in result_str:
        try:
            return float(result_str)
        except ValueError:
            return result_str
    else:
        try:
            return int(result_str)
        except ValueError:
            return result_str


def get_edge_transformations(
    graph: Graph,
    path_nodes: List[str],
    shift: int = 3
) -> Dict[str, Any]:
    """
    Calculates encrypted weights for both the shortest path edges and all graph edges.
    Returns structured transformation records for UI visual panels and text export.
    """
    # Process path edges
    path_transformations = []
    encrypted_path_cost = 0.0
    original_path_cost = 0.0

    if path_nodes and len(path_nodes) >= 2:
        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i + 1]
            edge = graph.get_edge_between(u, v)
            if edge:
                orig_w = int(edge.weight) if edge.weight.is_integer() else edge.weight
                enc_w = encrypt_weight_value(orig_w, shift)
                original_path_cost += float(orig_w)
                encrypted_path_cost += float(enc_w)
                path_transformations.append({
                    "edge_id": edge.id,
                    "source": u,
                    "target": v,
                    "original_weight": orig_w,
                    "shift": shift,
                    "encrypted_weight": enc_w,
                    "formatted_text": f"{u} → {v} | Original: {orig_w} | Shift: {shift:+d} | Encrypted: {enc_w}"
                })

    # Process all graph edges
    all_transformations = []
    for edge in graph.edges.values():
        orig_w = int(edge.weight) if edge.weight.is_integer() else edge.weight
        enc_w = encrypt_weight_value(orig_w, shift)
        all_transformations.append({
            "edge_id": edge.id,
            "source": edge.source,
            "target": edge.target,
            "original_weight": orig_w,
            "shift": shift,
            "encrypted_weight": enc_w,
            "is_on_path": any(
                pt["edge_id"] == edge.id for pt in path_transformations
            )
        })

    # Sort all transformations by source then target for consistent presentation
    all_transformations.sort(key=lambda x: (x["source"], x["target"]))

    return {
        "shift": shift,
        "cipher_method": "Caesar Cipher",
        "path_transformations": path_transformations,
        "all_transformations": all_transformations,
        "original_path_cost": round(original_path_cost, 2),
        "encrypted_path_cost": round(encrypted_path_cost, 2)
    }
