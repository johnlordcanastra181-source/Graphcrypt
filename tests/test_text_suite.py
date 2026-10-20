"""
Unit and integration tests for Intelligent Text Search, Compression, and Optimization System
Bohol Island State University (BISU) Final Project
"""

import unittest
import json
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
from app import app


class TestPatternMatching(unittest.TestCase):
    def setUp(self):
        self.text = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. THE FOX WAS QUICK."
        self.pattern = "FOX"

    def test_exact_matchers_consistency(self):
        """All exact matching algorithms must return identical match indices."""
        bf = brute_force_search(self.text, self.pattern)
        kmp = kmp_search(self.text, self.pattern)
        bm = boyer_moore_search(self.text, self.pattern)
        rk = rabin_karp_search(self.text, self.pattern)

        expected = [16, 49]
        self.assertEqual(bf["matches"], expected)
        self.assertEqual(kmp["matches"], expected)
        self.assertEqual(bm["matches"], expected)
        self.assertEqual(rk["matches"], expected)

    def test_overlapping_matches(self):
        text = "AAAAAAA"
        pattern = "AAA"
        # 0, 1, 2, 3, 4
        bf = brute_force_search(text, pattern)
        kmp = kmp_search(text, pattern)
        rk = rabin_karp_search(text, pattern)
        self.assertEqual(bf["matches"], [0, 1, 2, 3, 4])
        self.assertEqual(kmp["matches"], [0, 1, 2, 3, 4])
        self.assertEqual(rk["matches"], [0, 1, 2, 3, 4])

    def test_no_match_and_bounds(self):
        bf = brute_force_search(self.text, "ZEBRA")
        self.assertEqual(bf["matches"], [])
        self.assertEqual(bf["match_count"], 0)

        # Pattern longer than text
        bf_long = brute_force_search("SHORT", "LONGER_PATTERN")
        self.assertEqual(bf_long["matches"], [])

    def test_approximate_matching(self):
        text = "The algorithm optimizes computational problems."
        pattern = "algorith"
        res = approximate_search(text, pattern, max_distance=1)
        self.assertTrue(len(res["matches"]) >= 1)
        self.assertIn(4, res["matches"])


class TestTextCompression(unittest.TestCase):
    def setUp(self):
        self.sample_text = "BOHOL_ISLAND_STATE_UNIVERSITY_ADVANCED_ALGORITHMS_PROJECT"
        self.repetitive = "AAAAABBBBBCCCCCDDDDD"

    def test_huffman_lossless_roundtrip(self):
        stats = get_compression_stats(self.sample_text, "Huffman")
        self.assertTrue(stats["is_lossless"])
        self.assertGreater(stats["original_bytes"], 0)
        self.assertGreater(stats["compressed_bytes"], 0)
        self.assertLess(stats["compression_ratio"], 100.0)

    def test_rle_lossless_roundtrip(self):
        stats = get_compression_stats(self.repetitive, "RLE")
        self.assertTrue(stats["is_lossless"])
        self.assertEqual(stats["encoded_text"], "5A5B5C5D")
        self.assertLess(stats["compression_ratio"], 100.0)

    def test_lzw_lossless_roundtrip(self):
        stats = get_compression_stats(self.sample_text, "LZW")
        self.assertTrue(stats["is_lossless"])
        self.assertGreater(stats["dictionary_size"], 256)


class TestOptimization(unittest.TestCase):
    def setUp(self):
        self.items = [
            {"id": "1", "name": "A", "weight": 2, "value": 3},
            {"id": "2", "name": "B", "weight": 3, "value": 4},
            {"id": "3", "name": "C", "weight": 4, "value": 5},
            {"id": "4", "name": "D", "weight": 5, "value": 8},
        ]
        self.capacity = 5

    def test_knapsack_dp_exact_optimum(self):
        # Best with capacity 5 is items B (wt 3, val 4) + A (wt 2, val 3) = val 7 OR D alone (wt 5, val 8) -> val 8
        res = knapsack_dynamic_programming(self.items, self.capacity)
        self.assertEqual(res["total_value"], 8)
        self.assertEqual(len(res["selected_items"]), 1)
        self.assertEqual(res["selected_items"][0]["id"], "4")

    def test_knapsack_greedy(self):
        res = knapsack_greedy(self.items, self.capacity)
        self.assertGreater(res["total_value"], 0)
        self.assertLessEqual(res["total_weight"], self.capacity)

    def test_genetic_algorithm_execution(self):
        ga_res = run_genetic_algorithm(
            items=self.items,
            capacity=self.capacity,
            population_size=20,
            generations=25
        )
        self.assertGreater(ga_res["total_value"], 0)
        self.assertLessEqual(ga_res["total_weight"], self.capacity)
        self.assertEqual(len(ga_res["convergence_history"]), 25)


class TestParallelAndRandomized(unittest.TestCase):
    def setUp(self):
        self.text = "ALGORITHM " * 200 + "TARGET_KEY " + "ALGORITHM " * 200
        self.pattern = "TARGET_KEY"

    def test_parallel_search_consistency(self):
        res = parallel_search_text(self.text, self.pattern, workers=4)
        self.assertEqual(len(res["matches"]), 1)
        self.assertTrue(res["is_consistent"])
        self.assertGreater(res["workers"], 1)

    def test_randomized_quicksort(self):
        data = [42, 17, 93, 8, 55, 12, 88, 3, 71, 29]
        res = randomized_quicksort(data)
        self.assertTrue(res["is_sorted"])
        self.assertEqual(res["sorted_full"], sorted(data))

    def test_randomized_quickselect(self):
        data = [50, 20, 10, 40, 30]
        # Sorted: 10, 20, 30, 40, 50. k=2 is 30
        res = randomized_quickselect(data, 2)
        self.assertEqual(res["element"], 30)

    def test_monte_carlo_sampler(self):
        sample = monte_carlo_sample("ABCABCABCABC", sample_size=50)
        self.assertEqual(sample["sample_size"], 12)
        self.assertTrue(len(sample["frequencies"]) > 0)


class TestComplexityMatrix(unittest.TestCase):
    def test_matrix_coverage(self):
        matrix = get_algorithm_complexity_matrix()
        self.assertIn("records", matrix)
        self.assertGreaterEqual(len(matrix["records"]), 10)
        for record in matrix["records"]:
            self.assertIn("name", record)
            self.assertIn("time_avg", record)
            self.assertIn("space_aux", record)


class TestTextSuiteEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_get_samples_api(self):
        res = self.client.get("/api/text/samples")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["samples"]), 4)

    def test_load_sample_api(self):
        res = self.client.post("/api/text/load-sample", json={"sample_id": "sample_literature.txt"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("content", data)

    def test_search_pattern_api(self):
        res = self.client.post("/api/search/pattern", json={
            "text": "Hello Bohol Island State University world",
            "pattern": "Bohol",
            "algorithm": "Knuth-Morris-Pratt (KMP)"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["result"]["matches"], [6])

    def test_compression_api(self):
        res = self.client.post("/api/compression/compress", json={
            "text": "ABCABCABCABCABCABC",
            "method": "Huffman"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertTrue(data["is_lossless"])

    def test_optimization_api(self):
        res = self.client.post("/api/optimization/run", json={
            "technique": "GA",
            "capacity": 30,
            "generations": 10
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

    def test_parallel_search_api(self):
        res = self.client.post("/api/parallel/search", json={
            "text": "Sample text for parallel testing",
            "pattern": "parallel",
            "workers": 2
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

    def test_complexity_matrix_api(self):
        res = self.client.get("/api/complexity/matrix")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["syllabus_code"], "F-AQA-INS-002")

    def test_benchmark_full_api(self):
        res = self.client.post("/api/benchmark/full", json={
            "text": "Short test benchmark string",
            "pattern": "test"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])


if __name__ == "__main__":
    unittest.main()

