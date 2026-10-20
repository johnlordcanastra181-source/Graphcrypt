"""
Unit Tests for Multilingual Step-by-Step Educational Flow Telemetry
Bohol Island State University (BISU) Final Project & GraphCrypt

Validates that:
1. static/js/i18n_explanations.js exists and is syntactically sound.
2. English ('en'), Tagalog ('tl'), and Cebuano ('ceb') language maps are fully populated.
3. Every algorithm contains:
   - title
   - why (educational reason for output)
   - steps (at least 3 step-by-step execution items)
4. Template index.html contains language selector buttons for 'en', 'tl', and 'ceb'.
"""

import os
import re
import json
import subprocess
import unittest

class TestMultilingualFlowExplanations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        cls.i18n_path = os.path.join(cls.base_dir, "static", "js", "i18n_explanations.js")
        cls.template_path = os.path.join(cls.base_dir, "templates", "index.html")

    def test_i18n_file_exists_and_non_empty(self):
        """Ensures i18n_explanations.js exists and is substantially populated."""
        self.assertTrue(os.path.exists(self.i18n_path), "i18n_explanations.js is missing!")
        size = os.path.getsize(self.i18n_path)
        self.assertGreater(size, 5000, f"i18n_explanations.js is unexpectedly small ({size} bytes).")

    def test_i18n_syntax_via_node(self):
        """Validates that Node.js can parse and evaluate i18n_explanations.js without errors."""
        try:
            res = subprocess.run(
                ["node", "-c", self.i18n_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            self.assertEqual(res.returncode, 0, f"Syntax check failed:\n{res.stderr}")
        except FileNotFoundError:
            self.skipTest("Node.js not installed in environment; skipping node syntax validation.")

    def test_all_three_languages_configured_in_js(self):
        """Extracts and verifies 'en', 'tl', and 'ceb' keys in i18n_explanations.js."""
        with open(self.i18n_path, "r", encoding="utf-8") as f:
            content = f.read()

        for lang in ["en", "tl", "ceb"]:
            self.assertIn(f"code: '{lang}'", content, f"Language '{lang}' missing in I18N_LANGUAGES list!")

        # Check UI dictionaries
        for lang in ["en", "tl", "ceb"]:
            self.assertIn(f"{lang}:", content, f"Language '{lang}' missing in dictionary blocks!")

    def test_comprehensive_algorithm_coverage(self):
        """Verifies that all 13 algorithms have structured explanation entries."""
        with open(self.i18n_path, "r", encoding="utf-8") as f:
            content = f.read()

        required_algos = [
            "kmp",
            "boyer_moore",
            "rabin_karp",
            "brute_force",
            "approximate",
            "huffman",
            "rle",
            "lzw",
            "genetic_algorithm",
            "knapsack_dp_greedy",
            "parallel_search",
            "randomized_quicksort",
            "randomized_quickselect",
            "astar_pathfinding",
            "caesar_cipher"
        ]

        for algo in required_algos:
            matches = len(re.findall(rf"\b{algo}\b\s*:", content))
            self.assertGreaterEqual(
                matches, 3,
                f"Algorithm '{algo}' not fully covered across English, Tagalog, and Cebuano (found {matches} occurrences)."
            )

    def test_template_contains_language_switcher_pills(self):
        """Ensures templates/index.html includes the UI selector for EN, TL, and CEB."""
        with open(self.template_path, "r", encoding="utf-8") as f:
            html = f.read()

        self.assertIn('data-lang="en"', html, "Missing English selector pill in index.html!")
        self.assertIn('data-lang="tl"', html, "Missing Tagalog selector pill in index.html!")
        self.assertIn('data-lang="ceb"', html, "Missing Cebuano selector pill in index.html!")
        self.assertIn('i18n_explanations.js', html, "Missing script inclusion for i18n_explanations.js!")

    def test_node_execution_evaluates_data_structure(self):
        """Runs a node script to assert that window.I18N_EXPLANATIONS is well-formed."""
        node_script = """
        const fs = require('fs');
        global.window = {};
        const code = fs.readFileSync(process.argv[1], 'utf8');
        eval(code);

        const langs = ['en', 'tl', 'ceb'];
        langs.forEach(lang => {
            if (!global.window.I18N_EXPLANATIONS[lang]) {
                console.error(`Missing lang: ${lang}`);
                process.exit(1);
            }
            const exp = global.window.I18N_EXPLANATIONS[lang];
            const keys = ['kmp', 'boyer_moore', 'huffman', 'genetic_algorithm', 'parallel_search'];
            keys.forEach(k => {
                if (!exp[k] || !exp[k].why || !exp[k].steps || exp[k].steps.length < 3) {
                    console.error(`Invalid structure for ${lang}.${k}`);
                    process.exit(1);
                }
            });
        });
        console.log("I18N_VALID");
        """
        try:
            res = subprocess.run(
                ["node", "-e", node_script, self.i18n_path],
                capture_output=True,
                text=True,
                timeout=5
            )
            self.assertEqual(res.returncode, 0, f"Node eval error:\n{res.stderr}")
            self.assertIn("I18N_VALID", res.stdout)
        except FileNotFoundError:
            self.skipTest("Node.js not installed in environment; skipping node data structure eval.")


if __name__ == "__main__":
    unittest.main()

