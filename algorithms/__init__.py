"""
Algorithms Package for Intelligent Text Search, Compression, and Optimization System
Bohol Island State University (BISU) Final Project
"""

from .pattern_matching import (
    brute_force_search,
    kmp_search,
    boyer_moore_search,
    rabin_karp_search,
    approximate_search,
    compare_all_matchers,
)
from .compression import (
    huffman_compress,
    huffman_decompress,
    rle_compress,
    rle_decompress,
    lzw_compress,
    lzw_decompress,
    get_compression_stats,
)
from .optimization import (
    run_genetic_algorithm,
    knapsack_dynamic_programming,
    knapsack_greedy,
)
from .parallel_random import (
    parallel_search_text,
    randomized_quicksort,
    randomized_quickselect,
    monte_carlo_sample,
)
from .complexity_data import (
    get_algorithm_complexity_matrix,
)

__all__ = [
    "brute_force_search",
    "kmp_search",
    "boyer_moore_search",
    "rabin_karp_search",
    "approximate_search",
    "compare_all_matchers",
    "huffman_compress",
    "huffman_decompress",
    "rle_compress",
    "rle_decompress",
    "lzw_compress",
    "lzw_decompress",
    "get_compression_stats",
    "run_genetic_algorithm",
    "knapsack_dynamic_programming",
    "knapsack_greedy",
    "parallel_search_text",
    "randomized_quicksort",
    "randomized_quickselect",
    "monte_carlo_sample",
    "get_algorithm_complexity_matrix",
]

