"""
Regression tests for the bugs confirmed in DEBUGGING_MAP.md (Oct 2026).

Every test here corresponds to a numbered bug from the debugging map and fails
against the pre-fix code. Run with:
    PYTHONPATH=. pytest tests/ -q
"""

import os
import re
import unittest

from app import app, graph_instance
from graph import Graph
from algorithms import (
    run_genetic_algorithm,
    knapsack_dynamic_programming,
    knapsack_greedy,
    randomized_quicksort,
    monte_carlo_sample,
)


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _read(path):
    with open(path, "r", encoding="utf-8") as fp:
        return fp.read()


class TestBug1EmptyNodePayload(unittest.TestCase):
    """Bug 1: an empty POST body created a node literally named 'None'."""

    def setUp(self):
        self.client = app.test_client()
        graph_instance.load_sample_graph()

    def test_empty_body_is_rejected(self):
        res = self.client.post("/api/nodes", json={})
        self.assertEqual(res.status_code, 400)
        self.assertIn("error", res.get_json())

    def test_no_node_named_none_is_created(self):
        self.client.post("/api/nodes", json={})
        data = self.client.get("/api/graph").get_json()
        node_ids = [n["id"] for n in data["nodes"]]
        self.assertNotIn("None", node_ids)
        self.assertEqual(len(data["nodes"]), 20)

    def test_whitespace_only_id_is_rejected(self):
        res = self.client.post("/api/nodes", json={"id": "   "})
        self.assertEqual(res.status_code, 400)

    def test_valid_node_still_created(self):
        res = self.client.post("/api/nodes", json={"id": "Z1", "name": "Z1", "x": 10, "y": 20})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.get_json()["node"]["id"], "Z1")


class TestBug2BadNumericInputReturns400(unittest.TestCase):
    """Bug 2: unguarded int(data.get(...)) turned bad input into a 500."""

    def setUp(self):
        self.client = app.test_client()
        graph_instance.load_sample_graph()

    def _assert_400(self, url, payload):
        res = self.client.post(url, json=payload)
        self.assertEqual(res.status_code, 400, f"{url} returned {res.status_code}: {res.data[:200]}")
        self.assertIn("error", res.get_json())

    def test_export_download_bad_shift(self):
        self._assert_400("/api/export/download", {"shift": "abc"})

    def test_search_pattern_bad_max_distance(self):
        self._assert_400("/api/search/pattern", {"text": "abc", "pattern": "a", "max_distance": "abc"})

    def test_optimization_bad_capacity(self):
        self._assert_400("/api/optimization/run", {"technique": "GA", "capacity": "abc"})

    def test_optimization_bad_population_size(self):
        self._assert_400("/api/optimization/run", {"technique": "GA", "population_size": "abc"})

    def test_optimization_bad_generations(self):
        self._assert_400("/api/optimization/run", {"technique": "GA", "generations": "abc"})

    def test_optimization_bad_crossover_rate(self):
        self._assert_400("/api/optimization/run", {"technique": "GA", "crossover_rate": "abc"})

    def test_parallel_search_bad_workers(self):
        self._assert_400("/api/parallel/search", {"text": "abc", "pattern": "a", "workers": "abc"})

    def test_quickselect_bad_k(self):
        self._assert_400("/api/randomized/quickselect", {"items": [1, 2, 3], "k": "abc"})

    def test_monte_carlo_bad_sample_size(self):
        self._assert_400("/api/randomized/monte-carlo", {"text": "abc", "sample_size": "abc"})

    def test_monte_carlo_zero_sample_size(self):
        self._assert_400("/api/randomized/monte-carlo", {"text": "abc", "sample_size": 0})

    def test_cipher_encrypt_bad_shift(self):
        self._assert_400("/api/cipher/encrypt", {"shift": "abc"})

    def test_add_node_bad_coordinates(self):
        res = self.client.post("/api/nodes", json={"id": "Q1", "x": "abc", "y": 10})
        self.assertEqual(res.status_code, 400)

    def test_update_node_bad_coordinates(self):
        res = self.client.put("/api/nodes/A", json={"x": "abc"})
        self.assertEqual(res.status_code, 400)

    def test_valid_requests_still_succeed(self):
        res = self.client.post("/api/parallel/search", json={"text": "abc", "pattern": "a", "workers": 4})
        self.assertEqual(res.status_code, 200)
        res = self.client.post("/api/randomized/monte-carlo", json={"text": "abc", "sample_size": 10})
        self.assertEqual(res.status_code, 200)


class TestBug3QuickSelectOutOfBounds(unittest.TestCase):
    """Bug 3: QuickSelect returned success:true with element:null."""

    def setUp(self):
        self.client = app.test_client()

    def test_out_of_bounds_k_returns_400(self):
        res = self.client.post("/api/randomized/quickselect", json={"items": [1, 2, 3], "k": 99})
        self.assertEqual(res.status_code, 400)
        body = res.get_json()
        self.assertFalse(body["success"])
        self.assertIn("error", body)
        self.assertIsNone(body["element"])

    def test_negative_k_returns_400(self):
        res = self.client.post("/api/randomized/quickselect", json={"items": [1, 2, 3], "k": -1})
        self.assertEqual(res.status_code, 400)

    def test_valid_k_still_succeeds(self):
        res = self.client.post("/api/randomized/quickselect", json={"items": [3, 1, 2], "k": 0})
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["element"], 1)


class TestBug4PatternStatTiles(unittest.TestCase):
    """Bug 4: the stat tiles were gated on a non-existent DOM id."""

    def setUp(self):
        self.client = app.test_client()
        self.js_path = os.path.join(ROOT_DIR, "static", "js", "text_suite_ui.js")
        self.html_path = os.path.join(ROOT_DIR, "templates", "index.html")

    def test_js_does_not_reference_missing_summary_id(self):
        content = _read(self.js_path)
        self.assertNotIn(
            "getElementById('pattern-results-summary')",
            content,
            "text_suite_ui.js still looks up the non-existent 'pattern-results-summary' element.",
        )
        self.assertNotIn(
            'getElementById("pattern-results-summary")',
            content,
            "text_suite_ui.js still looks up the non-existent 'pattern-results-summary' element.",
        )

    def test_js_updates_the_real_stat_tile_ids(self):
        content = _read(self.js_path)
        self.assertIn("stat-pattern-matches", content)
        self.assertIn("stat-pattern-indices", content)

    def test_stat_tile_ids_exist_in_the_template(self):
        html = _read(self.html_path)
        self.assertIn('id="stat-pattern-matches"', html)
        self.assertIn('id="stat-pattern-indices"', html)

    def test_pattern_search_still_returns_matches(self):
        res = self.client.post("/api/search/pattern", json={
            "text": "banana bandana banana",
            "pattern": "banana",
            "algorithm": "All",
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["match_count"], 2)


class TestBug5EdgeModalDropdownsStaysEnabled(unittest.TestCase):
    """Bug 5: editing an edge permanently disabled the Add Edge dropdowns."""

    def setUp(self):
        self.js_path = os.path.join(ROOT_DIR, "static", "js", "graph_editor.js")

    def test_prompt_add_edge_reenables_selectors(self):
        content = _read(self.js_path)
        add_edge = content.split("promptAddEdge(")[1].split("promptEditEdgeWeight(")[0]
        self.assertIn(
            "selSource.disabled = false",
            add_edge,
            "promptAddEdge must re-enable the source selector.",
        )
        self.assertIn(
            "selTarget.disabled = false",
            add_edge,
            "promptAddEdge must re-enable the target selector.",
        )

    def test_prompt_edit_edge_weight_still_disables_selectors(self):
        content = _read(self.js_path)
        edit_edge = content.split("promptEditEdgeWeight(")[1]
        self.assertIn("selSource.disabled = true", edit_edge)
        self.assertIn("selTarget.disabled = true", edit_edge)


class TestBug6EditorAndAStarTabsDiffer(unittest.TestCase):
    """Bug 6: 'Graph Editor' and 'A* Pathfinding' rendered identical views."""

    def setUp(self):
        self.js_path = os.path.join(ROOT_DIR, "static", "js", "app.js")
        self.css_path = os.path.join(ROOT_DIR, "static", "css", "style.css")

    def test_editor_tab_toggles_a_distinct_layout_class(self):
        content = _read(self.js_path)
        self.assertIn("editor-focus-mode", content)

    def test_editor_focus_mode_has_a_style_rule(self):
        css = _read(self.css_path)
        self.assertIn("editor-focus-mode", css)
        self.assertIn(".astar-control-panel", css)

    def test_only_one_active_view_section_defines_the_graph_screen(self):
        html = _read(os.path.join(ROOT_DIR, "templates", "index.html"))
        view_ids = re.findall(r'<section id="(view-[a-z]+)"', html)
        self.assertIn("view-astar", view_ids)


class TestBug7CryptoPanelHasNoStaleHardcodedPath(unittest.TestCase):
    """Bug 7: the crypto panel shipped a hardcoded sample path and cost."""

    def setUp(self):
        self.js_path = os.path.join(ROOT_DIR, "static", "js", "crypto_ui.js")
        self.html_path = os.path.join(ROOT_DIR, "templates", "index.html")

    def test_js_has_no_hardcoded_path_array(self):
        content = _read(self.js_path)
        self.assertNotIn("'A', 'C', 'F', 'J', 'P', 'R', 'S', 'T'", content)
        self.assertNotIn("1382.6", content)

    def test_js_syncs_the_path_from_the_server(self):
        content = _read(self.js_path)
        self.assertIn("syncPathFromServer", content)
        self.assertIn("/api/astar/last", content)

    def test_template_has_no_hardcoded_path_pills(self):
        html = _read(self.html_path)
        summary = html.split('id="summary-path-display"')[1].split("</div>")[0]
        self.assertNotIn("path-node-pill", summary)

    def test_astar_last_endpoint_reflects_the_server_result(self):
        client = app.test_client()
        graph_instance.load_sample_graph()
        client.post("/api/astar/run", json={"start_node": "A", "goal_node": "T"})
        res = client.get("/api/astar/last")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["path"], ["A", "C", "F", "J", "P", "R", "S", "T"])
        self.assertAlmostEqual(data["total_cost"], 1382.6, places=1)


class TestBug8AStarDefaultGoal(unittest.TestCase):
    """Bug 8: the A* API defaulted to goal 'E' while the UI used 'T'."""

    def setUp(self):
        self.client = app.test_client()
        graph_instance.load_sample_graph()

    def test_default_goal_matches_the_ui(self):
        res = self.client.post("/api/astar/run", json={})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["goal_node"], "T")
        self.assertEqual(data["path"], ["A", "C", "F", "J", "P", "R", "S", "T"])


class TestBug9ServerNotExposedToLan(unittest.TestCase):
    """Bug 9: the dev server bound to 0.0.0.0 with the debugger enabled."""

    def setUp(self):
        self.app_path = os.path.join(ROOT_DIR, "app.py")
        self.run_path = os.path.join(ROOT_DIR, "run.py")

    def test_app_does_not_hardcode_all_interfaces(self):
        content = _read(self.app_path)
        self.assertNotIn('host="0.0.0.0"', content)

    def test_run_script_does_not_hardcode_all_interfaces(self):
        content = _read(self.run_path)
        self.assertNotIn('host="0.0.0.0"', content)

    def test_debug_is_opt_in(self):
        content = _read(self.app_path)
        self.assertNotIn("debug=True", content)

    def test_default_host_is_localhost(self):
        from app import DEFAULT_HOST, DEFAULT_DEBUG
        self.assertEqual(DEFAULT_HOST, "127.0.0.1")
        self.assertFalse(DEFAULT_DEBUG)


class TestBug10GlobalRngNotClobbered(unittest.TestCase):
    """Bug 10: the GA called random.seed(42) on the global RNG module."""

    def test_ga_does_not_call_global_random_seed(self):
        path = os.path.join(ROOT_DIR, "algorithms", "optimization.py")
        content = _read(path)
        self.assertNotIn(
            "random.seed(",
            content,
            "optimization.py must not seed the global RNG module.",
        )

    def test_ga_leaves_global_random_state_untouched(self):
        import random as global_random
        global_random.seed(1234)
        expected = [global_random.random() for _ in range(3)]

        global_random.seed(1234)
        run_genetic_algorithm(capacity=30, generations=5, population_size=10)
        actual = [global_random.random() for _ in range(3)]

        self.assertEqual(expected, actual, "A GA run changed the global RNG stream.")

    def test_quicksort_output_is_stable_across_a_ga_run(self):
        data = [5, 3, 9, 1, 7, 2]
        first = randomized_quicksort(data)["sorted_full"]
        run_genetic_algorithm(capacity=30, generations=5, population_size=10)
        second = randomized_quicksort(data)["sorted_full"]
        self.assertEqual(first, second)

    def test_monte_carlo_is_not_disturbed_by_a_ga_run(self):
        import random as global_random
        text = "alpha beta gamma delta epsilon"

        global_random.seed(777)
        first = monte_carlo_sample(text, 20)["frequencies"]

        run_genetic_algorithm(capacity=30, generations=5, population_size=10)

        global_random.seed(777)
        second = monte_carlo_sample(text, 20)["frequencies"]

        self.assertEqual(first, second, "A GA run changed the Monte Carlo sampling stream.")


class TestGraphAdjacencyIndex(unittest.TestCase):
    """The adjacency index must stay consistent with the edge table."""

    def setUp(self):
        self.g = Graph()

    def test_neighbors_match_a_full_scan(self):
        for node_id in self.g.nodes:
            expected = []
            for edge in self.g.edges.values():
                if edge.source == node_id:
                    expected.append(edge.target)
                elif edge.target == node_id:
                    expected.append(edge.source)
            actual = [n[0] for n in self.g.get_neighbors(node_id)]
            self.assertEqual(sorted(expected), sorted(actual))

    def test_delete_edge_removes_it_from_neighbors(self):
        edge = self.g.get_edge_between("A", "B")
        self.g.delete_edge(edge.id)
        neighbors = [n[0] for n in self.g.get_neighbors("A")]
        self.assertNotIn("B", neighbors)

    def test_delete_node_removes_its_edges_from_neighbors(self):
        self.g.delete_node("A")
        for node_id in self.g.nodes:
            for neighbor_id, _, _ in self.g.get_neighbors(node_id):
                self.assertNotEqual(neighbor_id, "A")

    def test_new_edge_is_visible_to_neighbors(self):
        self.g.add_node("X", "X", 10, 10)
        self.g.add_node("Y", "Y", 20, 20)
        self.g.add_edge("X", "Y", 5.0)
        neighbors = [n[0] for n in self.g.get_neighbors("X")]
        self.assertIn("Y", neighbors)

    def test_clear_resets_the_index(self):
        self.g.clear()
        self.assertEqual(self.g.get_neighbors("A"), [])


class TestKnapsackDuplicateItemIndices(unittest.TestCase):
    """items.index(it) resolved duplicated items to the first index."""

    def test_dp_reports_true_indices_for_duplicate_items(self):
        items = [
            {"id": "A", "name": "A", "weight": 2, "value": 4},
            {"id": "A", "name": "A", "weight": 2, "value": 4},
            {"id": "C", "name": "C", "weight": 9, "value": 3},
        ]
        res = knapsack_dynamic_programming(items, 4)
        self.assertEqual(sorted(res["selected_indices"]), [0, 1])
        for idx in res["selected_indices"]:
            self.assertEqual(items[idx]["id"], "A")

    def test_greedy_reports_true_indices_for_duplicate_items(self):
        items = [
            {"id": "A", "name": "A", "weight": 2, "value": 4},
            {"id": "A", "name": "A", "weight": 2, "value": 4},
            {"id": "C", "name": "C", "weight": 9, "value": 3},
        ]
        res = knapsack_greedy(items, 4)
        self.assertEqual(sorted(res["selected_indices"]), [0, 1])


class TestLzwSharedEncoder(unittest.TestCase):
    """The round-trip verifier must reuse the compressor's encoder."""

    def test_lzw_round_trip_is_lossless(self):
        from algorithms.compression import get_compression_stats
        text = "ABRACADABRAABRACADABRA" * 5
        res = get_compression_stats(text, "LZW")
        self.assertTrue(res["is_lossless"])

    def test_lzw_encode_helper_matches_compressor(self):
        from algorithms.compression import _lzw_encode, lzw_compress
        text = "BOHOL ISLAND STATE UNIVERSITY ADVANCED ALGORITHMS"
        codes, _, _ = _lzw_encode(text)
        self.assertEqual(lzw_compress(text)["total_codes"], len(codes))


class TestFaviconRoute(unittest.TestCase):
    """GET /favicon.ico used to 404 on every page load."""

    def test_favicon_returns_200(self):
        client = app.test_client()
        res = client.get("/favicon.ico")
        self.assertEqual(res.status_code, 200)
        self.assertIn("svg", res.headers["Content-Type"])


if __name__ == "__main__":
    unittest.main()
