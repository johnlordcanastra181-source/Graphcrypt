"""
GraphCrypt v1.0 - Flask Web Application Backend
Precision Algorithm Engine: Weighted A* Pathfinding + Caesar Cipher Cryptography
"""

import os
from typing import Any, Dict
from flask import Flask, render_template, request, jsonify, send_file, Response
from werkzeug.exceptions import HTTPException

from graph import Graph
from astar import run_astar
from cipher import get_edge_transformations
from exporter import generate_concise_txt, generate_full_report_txt, get_txt_bytes_stream

app = Flask(__name__)
app.config['SECRET_KEY'] = 'graphcrypt-precision-secret-key-v1'

# Global application graph state
graph_instance = Graph()
last_astar_result: Dict[str, Any] = {}
last_shift_value: int = 3


@app.errorhandler(Exception)
def handle_exception(e):
    """Global JSON error handler for REST API."""
    if isinstance(e, HTTPException):
        return jsonify({"error": e.description, "status_code": e.code}), e.code
    return jsonify({"error": str(e), "status_code": 500}), 500


@app.route("/")
def index():
    """Renders the main single-page application."""
    return render_template("index.html")


# ==========================================
# GRAPH REST API
# ==========================================

@app.route("/api/graph", methods=["GET"])
def get_graph():
    """Returns the full graph state (nodes & edges)."""
    return jsonify(graph_instance.to_dict())


@app.route("/api/nodes", methods=["POST"])
def add_node():
    """Adds a new node to the graph."""
    data = request.get_json() or {}
    node_id = data.get("id") or data.get("name")
    name = data.get("name", node_id)
    x = data.get("x", 200)
    y = data.get("y", 200)

    try:
        node = graph_instance.add_node(node_id, name, x, y)
        return jsonify({"success": True, "node": node.to_dict()}), 201
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@app.route("/api/nodes/<node_id>", methods=["PUT"])
def update_node(node_id):
    """Updates node position or label."""
    data = request.get_json() or {}
    name = data.get("name")
    x = data.get("x")
    y = data.get("y")

    try:
        node = graph_instance.update_node(node_id, name=name, x=x, y=y)
        return jsonify({"success": True, "node": node.to_dict()})
    except KeyError as err:
        return jsonify({"error": str(err)}), 404
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@app.route("/api/nodes/<node_id>", methods=["DELETE"])
def delete_node(node_id):
    """Deletes a node and any attached edges."""
    try:
        graph_instance.delete_node(node_id)
        return jsonify({"success": True, "deleted_node_id": node_id})
    except KeyError as err:
        return jsonify({"error": str(err)}), 404


@app.route("/api/edges", methods=["POST"])
def add_edge():
    """Adds a weighted connection between two nodes."""
    data = request.get_json() or {}
    source = data.get("source")
    target = data.get("target")
    weight = data.get("weight")
    edge_id = data.get("id")

    if not source or not target:
        return jsonify({"error": "Both source and target nodes are required."}), 400
    if weight is None:
        return jsonify({"error": "Edge weight is required."}), 400

    try:
        edge = graph_instance.add_edge(source, target, weight, edge_id)
        return jsonify({"success": True, "edge": edge.to_dict()}), 201
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@app.route("/api/edges/<edge_id>", methods=["PUT"])
def update_edge(edge_id):
    """Updates the numerical weight of an edge."""
    data = request.get_json() or {}
    weight = data.get("weight")

    if weight is None:
        return jsonify({"error": "Weight value is required."}), 400

    try:
        edge = graph_instance.update_edge_weight(edge_id, weight)
        return jsonify({"success": True, "edge": edge.to_dict()})
    except KeyError as err:
        return jsonify({"error": str(err)}), 404
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@app.route("/api/edges/<edge_id>", methods=["DELETE"])
def delete_edge(edge_id):
    """Deletes an edge from the graph."""
    try:
        graph_instance.delete_edge(edge_id)
        return jsonify({"success": True, "deleted_edge_id": edge_id})
    except KeyError as err:
        return jsonify({"error": str(err)}), 404


@app.route("/api/reset", methods=["POST"])
def reset_graph():
    """Resets the graph to default sample or clean empty state."""
    data = request.get_json() or {}
    mode = data.get("mode", "sample")
    
    global last_astar_result
    last_astar_result = {}

    if mode == "empty":
        graph_instance.clear()
    else:
        graph_instance.load_sample_graph()

    return jsonify({"success": True, "graph": graph_instance.to_dict()})


# ==========================================
# A* PATHFINDING ALGORITHM API
# ==========================================

@app.route("/api/astar/run", methods=["POST"])
def astar_run():
    """Runs weighted A* algorithm and caches results."""
    data = request.get_json() or {}
    start_node = data.get("start_node", "A")
    goal_node = data.get("goal_node", "E")
    heuristic = data.get("heuristic", "Euclidean Distance")

    result = run_astar(graph_instance, start_node, goal_node, heuristic)
    
    global last_astar_result
    last_astar_result = result

    if not result.get("success"):
        return jsonify(result), 400

    return jsonify(result)


# ==========================================
# CRYPTOGRAPHY & CIPHER API
# ==========================================

@app.route("/api/cipher/encrypt", methods=["POST"])
def encrypt_weights():
    """Calculates Modulo 10 Caesar cipher transformations."""
    data = request.get_json() or {}
    try:
        shift = int(data.get("shift", 3))
    except (ValueError, TypeError):
        return jsonify({"error": "Shift value must be a valid integer."}), 400

    path_nodes = data.get("path_nodes")
    if path_nodes is None:
        path_nodes = last_astar_result.get("path", [])

    global last_shift_value
    last_shift_value = shift

    transforms = get_edge_transformations(graph_instance, path_nodes, shift)
    return jsonify(transforms)


# ==========================================
# REPORT GENERATION & EXPORT API
# ==========================================

@app.route("/api/export/preview", methods=["POST"])
def export_preview():
    """Generates preview text formatted for UI display."""
    data = request.get_json() or {}
    try:
        shift = int(data.get("shift", last_shift_value))
    except (ValueError, TypeError):
        shift = 3

    path_nodes = data.get("path_nodes")
    if path_nodes is None:
        path_nodes = last_astar_result.get("path", [])

    heuristic = data.get("heuristic", "Euclidean Distance")
    format_type = data.get("format", "concise")

    if format_type == "full":
        content = generate_full_report_txt(graph_instance, last_astar_result, shift)
    else:
        content = generate_concise_txt(graph_instance, path_nodes, shift, heuristic)

    return jsonify({"success": True, "preview_text": content})


@app.route("/api/export/download", methods=["GET", "POST"])
def export_download():
    """Generates and streams an actual encrypted_edge_weights.txt file download."""
    if request.method == "POST":
        data = request.get_json() or {}
        shift = int(data.get("shift", last_shift_value))
        path_nodes = data.get("path_nodes", last_astar_result.get("path", []))
        heuristic = data.get("heuristic", "Euclidean Distance")
        format_type = data.get("format", "concise")
    else:
        shift = request.args.get("shift", default=last_shift_value, type=int)
        path_nodes = last_astar_result.get("path", [])
        heuristic = request.args.get("heuristic", default="Euclidean Distance", type=str)
        format_type = request.args.get("format", default="concise", type=str)

    if format_type == "full":
        txt_content = generate_full_report_txt(graph_instance, last_astar_result, shift)
    else:
        txt_content = generate_concise_txt(graph_instance, path_nodes, shift, heuristic)

    stream = get_txt_bytes_stream(txt_content)

    return send_file(
        stream,
        as_attachment=True,
        download_name="encrypted_edge_weights.txt",
        mimetype="text/plain"
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
