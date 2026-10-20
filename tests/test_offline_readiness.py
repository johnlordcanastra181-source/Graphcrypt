"""
Unit test for 100% Offline / Localhost Only Readiness and Educational Explanations
Bohol Island State University (BISU) Final Project
"""

import os
import re
import unittest
from app import app
from algorithms import (
    kmp_search,
    boyer_moore_search,
    huffman_compress,
    rle_compress,
    lzw_compress,
    run_genetic_algorithm,
    knapsack_dynamic_programming,
    parallel_search_text,
    randomized_quicksort,
)


class TestOfflineReadiness(unittest.TestCase):
    def setUp(self):
        self.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.templates_dir = os.path.join(self.root_dir, "templates")
        self.static_dir = os.path.join(self.root_dir, "static")

    def test_no_external_cdn_in_html(self):
        """Verifies templates/index.html has no external unpkg or CDN scripts."""
        index_path = os.path.join(self.templates_dir, "index.html")
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Check for unpkg.com, cdnjs, or external script CDNs
        self.assertNotIn("unpkg.com", content, "Found external unpkg CDN reference in index.html!")
        self.assertNotIn("cdnjs.cloudflare.com", content, "Found external cdnjs reference in index.html!")
        self.assertIn("lucide.min.js", content, "Local bundled lucide.min.js not found in index.html!")

    def test_local_lucide_bundle_exists(self):
        """Verifies that static/js/lucide.min.js exists locally and is non-empty."""
        lucide_path = os.path.join(self.static_dir, "js", "lucide.min.js")
        self.assertTrue(os.path.exists(lucide_path), "Local lucide.min.js is missing!")
        file_size = os.path.getsize(lucide_path)
        self.assertGreater(file_size, 100_000, "lucide.min.js file appears corrupted or too small.")

    def test_flask_renders_locally_200(self):
        """Verifies Flask renders index page with HTTP 200 OK locally."""
        client = app.test_client()
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"lucide.min.js", res.data)
        self.assertIn(b"i18n_explanations.js", res.data)
        self.assertIn(b"HOW IT WORKS & WHY THIS RESULT?", res.data)
        self.assertIn(b"lang-selector-group", res.data)


class TestEducationalFlowExplanations(unittest.TestCase):
    def setUp(self):
        self.sample_text = "BOHOL ISLAND STATE UNIVERSITY ADVANCED ALGORITHMS SYSTEM"
        self.pattern = "ALGORITHMS"

    def test_kmp_flow_explanation(self):
        res = kmp_search(self.sample_text, self.pattern)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)
        self.assertIn("lps_table", res)

    def test_boyer_moore_flow_explanation(self):
        res = boyer_moore_search(self.sample_text, self.pattern)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)
        self.assertIn("bad_char_table", res)

    def test_huffman_flow_explanation(self):
        res = huffman_compress(self.sample_text)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)
        self.assertIn("entropy_bits", res)

    def test_rle_flow_explanation(self):
        res = rle_compress("AAAAABBBBB")
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)

    def test_lzw_flow_explanation(self):
        res = lzw_compress(self.sample_text)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)
        self.assertIn("sample_dictionary_entries", res)

    def test_ga_flow_explanation(self):
        res = run_genetic_algorithm(capacity=30, generations=10)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)

    def test_knapsack_flow_explanation(self):
        res = knapsack_dynamic_programming([{"id": "1", "name": "A", "weight": 2, "value": 5}], 5)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)

    def test_parallel_flow_explanation(self):
        res = parallel_search_text(self.sample_text, self.pattern, workers=2)
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)
        self.assertIn("overlap_margin", res)

    def test_randomized_quicksort_flow_explanation(self):
        res = randomized_quicksort(["delta", "alpha", "charlie", "bravo"])
        self.assertIn("flow_explanation", res)
        self.assertIn("why_result", res)


if __name__ == "__main__":
    unittest.main()
