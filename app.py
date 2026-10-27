"""
GraphCrypt v1.0 - Flask Web Application Backend
Precision Algorithm Engine: Weighted A* Pathfinding + Caesar Cipher Cryptography
"""

import os
import secrets
from typing import Any, Dict, Optional
from flask import Flask, render_template, request, jsonify, send_file, Response
from werkzeug.exceptions import HTTPException

from graph import Graph
from astar import run_astar
from cipher import get_edge_transformations
from exporter import generate_concise_txt, generate_full_report_txt, get_txt_bytes_stream

from algorithms import (
    brute_force_search,
    kmp_search,
    boyer_moore_search,
    rabin_karp_search,
    approximate_search,
    compare_all_matchers,
    huffman_compress,
    huffman_decompress,
    rle_compress,
    rle_decompress,
    lzw_compress,
    lzw_decompress,
    get_compression_stats,
    run_genetic_algorithm,
    knapsack_dynamic_programming,
    knapsack_greedy,
    parallel_search_text,
    randomized_quicksort,
    randomized_quickselect,
    monte_carlo_sample,
    get_algorithm_complexity_matrix,
)

app = Flask(__name__)
# Secret key is read from the environment. A random per-process key is generated
# when it is unset, so no hardcoded credential ever ships in the repository.
# (No session is currently used, so this is defensive rather than urgent.)
app.config['SECRET_KEY'] = os.environ.get("GRAPHCrypt_SECRET_KEY") or secrets.token_hex(32)

# Global application graph state
graph_instance = Graph()
last_astar_result: Dict[str, Any] = {}
last_shift_value: int = 3

# Default host/port for the development server. Binding to 0.0.0.0 would expose
# the Werkzeug debugger to every device on the LAN, so localhost is the default.
DEFAULT_HOST = os.environ.get("GRAPHCrypt_HOST", "127.0.0.1")
DEFAULT_DEBUG = os.environ.get("GRAPHCrypt_DEBUG", "").strip().lower() in {"1", "true", "yes", "on"}


def _json_body() -> Dict[str, Any]:
    """Parses the request body as JSON, tolerating empty or malformed payloads."""
    return request.get_json(silent=True) or {}


def _int_field(data: Dict[str, Any], key: str, default: int, minimum: Optional[int] = None,
               maximum: Optional[int] = None) -> int:
    """Reads an integer field from a JSON body, raising ValueError on bad input."""
    raw = data.get(key, default)
    if raw is None:
        raw = default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ValueError(f"'{key}' must be a valid integer.")
    if minimum is not None and value < minimum:
        raise ValueError(f"'{key}' must be greater than or equal to {minimum}.")
    if maximum is not None and value > maximum:
        raise ValueError(f"'{key}' must be less than or equal to {maximum}.")
    return value


def _float_field(data: Dict[str, Any], key: str, default: float) -> float:
    """Reads a float field from a JSON body, raising ValueError on bad input."""
    raw = data.get(key, default)
    if raw is None:
        raw = default
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise ValueError(f"'{key}' must be a valid number.")


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
    data = _json_body()
    node_id = data.get("id") or data.get("name")
    if node_id is None or not str(node_id).strip():
        return jsonify({"error": "Node id or name is required."}), 400
    node_id = str(node_id).strip()

    name = data.get("name") or node_id
    try:
        x = float(data.get("x", 200))
        y = float(data.get("y", 200))
    except (TypeError, ValueError):
        return jsonify({"error": "Node coordinates must be valid numbers."}), 400

    try:
        node = graph_instance.add_node(node_id, name, x, y)
        return jsonify({"success": True, "node": node.to_dict()}), 201
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@app.route("/api/nodes/<node_id>", methods=["PUT"])
def update_node(node_id):
    """Updates node position or label."""
    data = _json_body()
    name = data.get("name")
    x = data.get("x")
    y = data.get("y")

    try:
        x = float(x) if x is not None else None
        y = float(y) if y is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "Node coordinates must be valid numbers."}), 400

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
    data = _json_body()
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
    data = _json_body()
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
    data = _json_body()
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
    data = _json_body()
    start_node = data.get("start_node", "A")
    goal_node = data.get("goal_node", "T")
    heuristic = data.get("heuristic", "Euclidean Distance")

    result = run_astar(graph_instance, start_node, goal_node, heuristic)
    
    global last_astar_result
    last_astar_result = result

    if not result.get("success"):
        return jsonify(result), 400

    return jsonify(result)


@app.route("/api/astar/last", methods=["GET"])
def astar_last():
    """Returns the most recent A* result so the UI never shows a stale path."""
    if not last_astar_result:
        return jsonify({"success": False, "error": "No A* result available yet.", "path": [], "total_cost": 0.0})
    return jsonify({
        "success": True,
        "path": last_astar_result.get("path", []),
        "path_edges": last_astar_result.get("path_edges", []),
        "total_cost": last_astar_result.get("total_cost", 0.0),
        "heuristic_used": last_astar_result.get("heuristic_used", "Euclidean Distance"),
        "start_node": last_astar_result.get("start_node"),
        "goal_node": last_astar_result.get("goal_node"),
    })


# ==========================================
# CRYPTOGRAPHY & CIPHER API
# ==========================================

@app.route("/api/cipher/encrypt", methods=["POST"])
def encrypt_weights():
    """Calculates Modulo 10 Caesar cipher transformations."""
    data = _json_body()
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
    data = _json_body()
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
        data = _json_body()
        try:
            shift = int(data.get("shift", last_shift_value))
        except (ValueError, TypeError):
            return jsonify({"error": "Shift value must be a valid integer."}), 400
        path_nodes = data.get("path_nodes", last_astar_result.get("path", []))
        heuristic = data.get("heuristic", "Euclidean Distance")
        format_type = data.get("format", "concise")
    else:
        shift = request.args.get("shift", default=last_shift_value, type=int)
        if shift is None:
            return jsonify({"error": "Shift value must be a valid integer."}), 400
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


# ==========================================
# INTELLIGENT TEXT SEARCH & DATASET API
# ==========================================

DATASETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datasets")

@app.route("/api/text/samples", methods=["GET"])
def get_sample_datasets():
    """Lists available pre-loaded sample datasets."""
    samples = []
    if os.path.exists(DATASETS_DIR):
        for f in os.listdir(DATASETS_DIR):
            if f.endswith(".txt"):
                filepath = os.path.join(DATASETS_DIR, f)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read()
                samples.append({
                    "id": f,
                    "filename": f,
                    "title": f.replace("sample_", "").replace(".txt", "").replace("_", " ").title(),
                    "size_bytes": len(content.encode("utf-8")),
                    "character_count": len(content),
                    "preview": content[:120] + ("..." if len(content) > 120 else "")
                })
    return jsonify({"success": True, "samples": samples})


@app.route("/api/text/load-sample", methods=["POST"])
def load_sample_dataset():
    """Loads full content of a requested sample dataset."""
    data = _json_body()
    sample_id = data.get("sample_id", "sample_literature.txt")
    # Sanitize path to prevent traversal
    safe_name = os.path.basename(sample_id)
    filepath = os.path.join(DATASETS_DIR, safe_name)

    if not os.path.exists(filepath):
        return jsonify({"error": f"Sample dataset '{safe_name}' not found."}), 404

    with open(filepath, "r", encoding="utf-8", errors="ignore") as fp:
        content = fp.read()

    return jsonify({
        "success": True,
        "sample_id": safe_name,
        "content": content,
        "size_bytes": len(content.encode("utf-8")),
        "character_count": len(content)
    })


@app.route("/api/search/pattern", methods=["POST"])
def search_pattern():
    """Executes selected string pattern matching algorithm or comparative evaluation."""
    data = _json_body()
    text = data.get("text", "")
    pattern = data.get("pattern", "")
    algo = data.get("algorithm", "All")
    try:
        max_distance = _int_field(data, "max_distance", 1, minimum=1)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if not text or not pattern:
        return jsonify({"error": "Both text and pattern are required."}), 400

    if algo == "All":
        result = compare_all_matchers(text, pattern)
        return jsonify({"success": True, "mode": "comparison", **result})
    elif algo == "Brute Force":
        res = brute_force_search(text, pattern)
    elif algo == "Knuth-Morris-Pratt (KMP)":
        res = kmp_search(text, pattern)
    elif algo == "Boyer-Moore":
        res = boyer_moore_search(text, pattern)
    elif algo == "Rabin-Karp":
        res = rabin_karp_search(text, pattern)
    elif algo == "Approximate Matching":
        res = approximate_search(text, pattern, max_distance=max_distance)
    else:
        return jsonify({"error": f"Unknown algorithm '{algo}'"}), 400

    return jsonify({"success": True, "mode": "single", "result": res})


# ==========================================
# TEXT COMPRESSION API
# ==========================================

@app.route("/api/compression/compress", methods=["POST"])
def compress_text():
    """Compresses text via Huffman, RLE, or LZW with full telemetry."""
    data = _json_body()
    text = data.get("text", "")
    method = data.get("method", "Huffman")

    if not text:
        return jsonify({"error": "Input text cannot be empty."}), 400

    try:
        stats = get_compression_stats(text, method)
        return jsonify({"success": True, **stats})
    except Exception as err:
        return jsonify({"error": str(err)}), 400


@app.route("/api/compression/compare-all", methods=["POST"])
def compress_compare_all():
    """Runs Huffman, RLE, and LZW side-by-side on the provided text."""
    data = _json_body()
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "Input text cannot be empty."}), 400

    results = []
    for method in ["Huffman", "RLE", "LZW"]:
        try:
            stats = get_compression_stats(text, method)
            results.append(stats)
        except Exception as err:
            results.append({"method": method, "error": str(err)})

    return jsonify({"success": True, "comparisons": results})


# ==========================================
# OPTIMIZATION API (GA & KNAPSACK)
# ==========================================

@app.route("/api/optimization/run", methods=["POST"])
def run_optimization():
    """Runs Genetic Algorithm or 0/1 Knapsack optimization."""
    data = _json_body()
    technique = data.get("technique", "GA")
    items = data.get("items")

    try:
        capacity = _int_field(data, "capacity", 50, minimum=1)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if technique == "GA":
        try:
            pop_size = _int_field(data, "population_size", 40, minimum=2)
            generations = _int_field(data, "generations", 50, minimum=1)
            crossover = _float_field(data, "crossover_rate", 0.8)
            mutation = _float_field(data, "mutation_rate", 0.05)
        except ValueError as err:
            return jsonify({"error": str(err)}), 400

        res = run_genetic_algorithm(
            items=items,
            capacity=capacity,
            population_size=pop_size,
            generations=generations,
            crossover_rate=crossover,
            mutation_rate=mutation
        )
        return jsonify({"success": True, **res})

    elif technique == "Knapsack_DP":
        if items is None:
            # Default sample
            items = [
                {"id": "DOC-1", "name": "Executive Summary", "weight": 12, "value": 24},
                {"id": "DOC-2", "name": "System Architecture", "weight": 15, "value": 30},
                {"id": "DOC-3", "name": "Algorithm Benchmarks", "weight": 8, "value": 18},
                {"id": "DOC-4", "name": "Security Protocols", "weight": 20, "value": 35},
                {"id": "DOC-5", "name": "API Documentation", "weight": 10, "value": 22},
                {"id": "DOC-6", "name": "Error Telemetry", "weight": 6, "value": 14},
                {"id": "DOC-7", "name": "User Guide Handbook", "weight": 18, "value": 28},
                {"id": "DOC-8", "name": "Database Schema", "weight": 14, "value": 26},
            ]
        dp_res = knapsack_dynamic_programming(items, capacity)
        greedy_res = knapsack_greedy(items, capacity)
        return jsonify({
            "success": True,
            "dp": dp_res,
            "greedy": greedy_res
        })

    return jsonify({"error": f"Unknown optimization technique '{technique}'"}), 400


# ==========================================
# PARALLEL & RANDOMIZED ALGORITHMS API
# ==========================================

@app.route("/api/parallel/search", methods=["POST"])
def parallel_search_api():
    """Runs parallel pattern search across configurable thread workers."""
    data = _json_body()
    text = data.get("text", "")
    pattern = data.get("pattern", "")
    try:
        workers = _int_field(data, "workers", 4, minimum=1, maximum=16)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if not text or not pattern:
        return jsonify({"error": "Both text and pattern are required."}), 400

    workers = max(1, min(16, workers))
    result = parallel_search_text(text, pattern, workers=workers)
    return jsonify({"success": True, **result})


@app.route("/api/randomized/quicksort", methods=["POST"])
def randomized_quicksort_api():
    """Sorts input list or text lines/tokens using Randomized QuickSort."""
    data = _json_body()
    text = data.get("text", "")
    items = data.get("items")

    if items is None:
        if not text:
            return jsonify({"error": "Either text or items list is required."}), 400
        # Split text into lines or tokens
        mode = data.get("split_mode", "words")
        if mode == "lines":
            items = [line.strip() for line in text.splitlines() if line.strip()]
        else:
            items = [word.strip(".,;:!?()[]\"'") for word in text.split() if word.strip()]

    result = randomized_quicksort(items)
    return jsonify({"success": True, **result})


@app.route("/api/randomized/quickselect", methods=["POST"])
def randomized_quickselect_api():
    """Finds k-th smallest element using Randomized QuickSelect."""
    data = _json_body()
    items = data.get("items", [])
    try:
        k = _int_field(data, "k", 0, minimum=0)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if not items:
        return jsonify({"error": "Items list is required."}), 400

    result = randomized_quickselect(items, k)
    if "error" in result:
        return jsonify({"success": False, **result}), 400
    return jsonify({"success": True, **result})


@app.route("/api/randomized/monte-carlo", methods=["POST"])
def monte_carlo_api():
    """Performs Monte Carlo text sampling."""
    data = _json_body()
    text = data.get("text", "")
    try:
        sample_size = _int_field(data, "sample_size", 100, minimum=1)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400

    if not text:
        return jsonify({"error": "Input text is required."}), 400

    result = monte_carlo_sample(text, sample_size)
    return jsonify({"success": True, **result})


# ==========================================
# PERFORMANCE ANALYSIS & COMPLEXITY API
# ==========================================

@app.route("/api/complexity/matrix", methods=["GET"])
def complexity_matrix_api():
    """Returns the comprehensive Time & Space Complexity matrix."""
    return jsonify(get_algorithm_complexity_matrix())


@app.route("/api/benchmark/full", methods=["POST"])
def full_benchmark_api():
    """Executes an end-to-end multi-algorithm benchmark on the provided text."""
    data = _json_body()
    text = data.get("text", "")
    pattern = data.get("pattern", "algorithm")

    if not text:
        # Load sample literature as benchmark corpus
        filepath = os.path.join(DATASETS_DIR, "sample_literature.txt")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as fp:
                text = fp.read()
        else:
            text = "Bohol Island State University Advanced Algorithms Final Project"

    pattern_comp = compare_all_matchers(text, pattern)
    
    comp_results = []
    for m in ["Huffman", "RLE", "LZW"]:
        try:
            comp_results.append(get_compression_stats(text, m))
        except Exception:
            pass

    par_res = parallel_search_text(text, pattern, workers=4)

    return jsonify({
        "success": True,
        "text_length": len(text),
        "pattern": pattern,
        "pattern_matching": pattern_comp,
        "compression": comp_results,
        "parallel_speedup": par_res
    })


@app.route("/favicon.ico")
def favicon():
    """Serves an inline SVG favicon so the browser stops requesting a missing file."""
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        '<rect width="32" height="32" rx="6" fill="#070B14"/>'
        '<circle cx="9" cy="10" r="3.5" fill="#00F0FF"/>'
        '<circle cx="23" cy="9" r="3.5" fill="#A855F7"/>'
        '<circle cx="16" cy="24" r="3.5" fill="#00FF9D"/>'
        '<path d="M9 10 L23 9 M9 10 L16 24 M23 9 L16 24" stroke="#5B7FA6" stroke-width="1.6"/>'
        "</svg>"
    )
    return Response(svg, mimetype="image/svg+xml")


if __name__ == "__main__":
    app.run(host=DEFAULT_HOST, port=5000, debug=DEFAULT_DEBUG)

