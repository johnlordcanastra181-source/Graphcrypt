"""
Unit and integration tests for GraphCrypt v1.0 (Guam Map A to T Ordered Engine)
"""

import unittest
import json
from graph import Graph
from astar import run_astar, calculate_heuristic
from cipher import encrypt_weight_value, get_edge_transformations
from exporter import generate_concise_txt, generate_full_report_txt
from app import app, graph_instance


class TestGraphCore(unittest.TestCase):
    def setUp(self):
        self.g = Graph()

    def test_default_sample_graph(self):
        self.assertEqual(len(self.g.nodes), 20)
        self.assertEqual(len(self.g.edges), 27)
        self.assertIn("A", self.g.nodes)
        self.assertIn("T", self.g.nodes)

    def test_add_and_delete_node(self):
        self.g.add_node("Z1", "Z1 Node", 100, 200)
        self.assertIn("Z1", self.g.nodes)
        self.g.delete_node("Z1")
        self.assertNotIn("Z1", self.g.nodes)

    def test_add_and_update_edge(self):
        self.g.add_node("N_X", "N_X", 10, 10)
        self.g.add_node("N_Y", "N_Y", 20, 20)
        edge = self.g.add_edge("N_X", "N_Y", 7.5, "e_NXY")
        self.assertEqual(edge.weight, 7.5)
        
        self.g.update_edge_weight("e_NXY", 12.0)
        self.assertEqual(self.g.edges["e_NXY"].weight, 12.0)

    def test_negative_weight_rejected(self):
        self.g.add_node("N1", "N1", 0, 0)
        self.g.add_node("N2", "N2", 1, 1)
        with self.assertRaises(ValueError):
            self.g.add_edge("N1", "N2", -5.0)


class TestAStar(unittest.TestCase):
    def setUp(self):
        self.g = Graph()

    def test_astar_sample_shortest_path_a_to_t(self):
        # Shortest path from A to T (farthest node):
        # A -> C -> F -> J -> P -> R -> S -> T with total cost 1382.6
        res = run_astar(self.g, "A", "T", "Euclidean Distance")
        self.assertTrue(res["success"])
        self.assertEqual(res["path"], ["A", "C", "F", "J", "P", "R", "S", "T"])
        self.assertAlmostEqual(res["total_cost"], 1382.6, places=1)

    def test_astar_weight_change_recalculation(self):
        # If we drastically increase edge weight A -> C:
        e_ac = self.g.get_edge_between("A", "C")
        self.assertIsNotNone(e_ac)
        self.g.update_edge_weight(e_ac.id, 5000.0)
        res = run_astar(self.g, "A", "T", "Euclidean Distance")
        self.assertTrue(res["success"])
        # Path should switch from C to B
        self.assertEqual(res["path"][1], "B")

    def test_custom_graph_nodes(self):
        g_custom = Graph()
        g_custom.clear()
        g_custom.add_node("X", "X", 100, 100)
        g_custom.add_node("Y", "Y", 200, 150)
        g_custom.add_node("Z", "Z", 300, 200)
        g_custom.add_edge("X", "Y", 5.0)
        g_custom.add_edge("Y", "Z", 3.0)

        res = run_astar(g_custom, "X", "Z", "Euclidean Distance")
        self.assertTrue(res["success"])
        self.assertEqual(res["path"], ["X", "Y", "Z"])
        self.assertEqual(res["total_cost"], 8.0)


class TestCipher(unittest.TestCase):
    def test_numeric_caesar_shift(self):
        # Shift +3
        self.assertEqual(encrypt_weight_value(5, 3), 8)
        self.assertEqual(encrypt_weight_value(3, 3), 6)
        self.assertEqual(encrypt_weight_value(7, 3), 0)
        self.assertEqual(encrypt_weight_value(14, 3), 47)
        self.assertEqual(encrypt_weight_value(0, 3), 3)
        self.assertEqual(encrypt_weight_value(9, 3), 2)
        self.assertEqual(encrypt_weight_value(106.9, 3), 439.2)

    def test_negative_shift(self):
        # Shift -3
        self.assertEqual(encrypt_weight_value(8, -3), 5)
        self.assertEqual(encrypt_weight_value(0, -3), 7)


class TestFlaskAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        graph_instance.load_sample_graph()

    def test_get_graph(self):
        res = self.client.get("/api/graph")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data["nodes"]), 20)
        self.assertEqual(len(data["edges"]), 27)

    def test_run_astar_api(self):
        res = self.client.post("/api/astar/run", json={
            "start_node": "A",
            "goal_node": "T",
            "heuristic": "Euclidean Distance"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["path"], ["A", "C", "F", "J", "P", "R", "S", "T"])
        self.assertAlmostEqual(data["total_cost"], 1382.6, places=1)

    def test_cipher_encrypt_api(self):
        res = self.client.post("/api/cipher/encrypt", json={
            "shift": 3,
            "path_nodes": ["A", "C", "F", "J", "P", "R", "S", "T"]
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["shift"], 3)
        self.assertEqual(len(data["path_transformations"]), 7)

    def test_download_export(self):
        res = self.client.get("/api/export/download?shift=3")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"--- ENCRYPTED EDGE WEIGHTS ---", res.data)


if __name__ == "__main__":
    unittest.main()
