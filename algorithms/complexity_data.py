"""
Performance Analysis & Complexity Matrix
Bohol Island State University (BISU) Final Project
Formal Time and Space Complexity Analysis for all implemented algorithms.
"""

from typing import Any, Dict, List


COMPLEXITY_RECORDS: List[Dict[str, Any]] = [
    # 1. Pattern Matching
    {
        "category": "Pattern Matching",
        "name": "Brute Force String Matching",
        "time_best": "Ω(n)",
        "time_avg": "Θ(n · m)",
        "time_worst": "O(n · m)",
        "space_aux": "O(1)",
        "description": "Compares pattern against text at every sliding window index sequentially.",
        "analysis": "Best case occurs when mismatch is found at the first character of each window (Ω(n)). Worst case occurs with repetitive patterns (e.g., text 'AAAAAA', pattern 'AAAB'), requiring m comparisons at each of the (n - m + 1) positions."
    },
    {
        "category": "Pattern Matching",
        "name": "Knuth-Morris-Pratt (KMP)",
        "time_best": "Ω(n + m)",
        "time_avg": "Θ(n + m)",
        "time_worst": "O(n + m)",
        "space_aux": "O(m)",
        "description": "Precomputes Longest Proper Prefix which is Suffix (LPS) array to skip redundant comparisons.",
        "analysis": "Preprocessing takes Θ(m) time and O(m) space. Searching never retreats the text pointer i, bounding text comparisons strictly by 2n. Total time is strictly linear O(n + m)."
    },
    {
        "category": "Pattern Matching",
        "name": "Boyer-Moore",
        "time_best": "Ω(n / m)",
        "time_avg": "Θ(n / m)",
        "time_worst": "O(n · m)",
        "space_aux": "O(m + Σ)",
        "description": "Scans pattern from right to left using Bad Character and Good Suffix heuristics.",
        "analysis": "Achieves sublinear search Ω(n/m) on natural text because a mismatched character allows shifts up to m positions. Worst case O(n · m) without Galil rule on highly periodic patterns."
    },
    {
        "category": "Pattern Matching",
        "name": "Rabin-Karp",
        "time_best": "Ω(n + m)",
        "time_avg": "Θ(n + m)",
        "time_worst": "O(n · m)",
        "space_aux": "O(1)",
        "description": "Uses rolling polynomial hashing to match substrings in constant amortized time.",
        "analysis": "Rolling hash updates in O(1) arithmetic operations per character. When hash collision (spurious hit) occurs, explicit verification takes O(m). Worst case O(n · m) if every hash collides."
    },
    {
        "category": "Pattern Matching",
        "name": "Approximate Matching (Levenshtein)",
        "time_best": "Ω(n · m)",
        "time_avg": "Θ(n · m)",
        "time_worst": "O(n · m)",
        "space_aux": "O(m)",
        "description": "Dynamic Programming matrix over sliding windows computing edit distance within threshold k.",
        "analysis": "For each text window, filling the dynamic programming table row-by-row takes O(m) time. Total execution across the entire text is O(n · m) with O(m) space optimization."
    },

    # 2. Text Compression
    {
        "category": "Text Compression",
        "name": "Huffman Coding",
        "time_best": "Ω(n + k log k)",
        "time_avg": "Θ(n + k log k)",
        "time_worst": "O(n + k log k)",
        "space_aux": "O(k)",
        "description": "Greedy min-heap binary tree generating variable-length optimal prefix codes.",
        "analysis": "Frequency counting takes O(n). Building the binary priority tree with k unique alphabet characters takes O(k log k). Bit encoding takes O(n). Space requires O(k) for the tree and codebook."
    },
    {
        "category": "Text Compression",
        "name": "Run-Length Encoding (RLE)",
        "time_best": "Ω(n)",
        "time_avg": "Θ(n)",
        "time_worst": "O(n)",
        "space_aux": "O(1)",
        "description": "Encodes continuous identical byte sequences into run lengths [count][character].",
        "analysis": "Performs a single linear pass over the input text, running in strict O(n) time with O(1) auxiliary working memory beyond output buffer."
    },
    {
        "category": "Text Compression",
        "name": "LZW Dictionary Compression",
        "time_best": "Ω(n)",
        "time_avg": "Θ(n)",
        "time_worst": "O(n)",
        "space_aux": "O(D)",
        "description": "Dynamic dictionary substitution replacing recurring substrings with incremental integer codes.",
        "analysis": "Hashes string prefix matches in expected O(1) per character, yielding O(n) total compression time. Space complexity is bounded by the maximum dictionary size D (e.g., 2^16 entries)."
    },

    # 3. Optimization
    {
        "category": "Optimization",
        "name": "Genetic Algorithm (GA)",
        "time_best": "Ω(G · P · N)",
        "time_avg": "Θ(G · P · N)",
        "time_worst": "O(G · P · N)",
        "space_aux": "O(P · N)",
        "description": "Population-based evolutionary metaheuristic using selection, crossover, and mutation.",
        "analysis": "G = generations, P = population size, N = chromosome length. Evaluates P chromosomes per generation taking O(P · N) fitness evaluations. Space stores P candidate solutions."
    },
    {
        "category": "Optimization",
        "name": "0/1 Knapsack (Dynamic Programming)",
        "time_best": "Ω(N · W)",
        "time_avg": "Θ(N · W)",
        "time_worst": "O(N · W)",
        "space_aux": "O(N · W)",
        "description": "Exact pseudo-polynomial dynamic programming table for discrete item selection.",
        "analysis": "Fills an (N + 1) × (W + 1) matrix where N is number of items and W is integer capacity. Guarantees global optimum in O(N · W) time and space."
    },
    {
        "category": "Optimization",
        "name": "0/1 Knapsack (Greedy Heuristic)",
        "time_best": "Ω(N log N)",
        "time_avg": "Θ(N log N)",
        "time_worst": "O(N log N)",
        "space_aux": "O(N)",
        "description": "Approximation sorting items by value-to-weight ratio.",
        "analysis": "Sorting dominant step takes O(N log N). Linear scan packs highest ratio items in O(N). Fast heuristic but does not guarantee global optimum for 0/1 integer constraint."
    },

    # 4. Parallel & Randomized
    {
        "category": "Parallel & Randomized",
        "name": "Parallel Multi-Threaded Search",
        "time_best": "Ω(n / p + m)",
        "time_avg": "Θ(n / p + m)",
        "time_worst": "O(n · m / p)",
        "space_aux": "O(p · m)",
        "description": "Partition-based multi-threaded text search across p CPU worker threads with overlap margins.",
        "analysis": "Splits text of length n across p workers into chunks of size n/p. Each worker processes its slice concurrently. Theoretical speedup approaches p (Amdahl's Law applies due to thread spawning overhead)."
    },
    {
        "category": "Parallel & Randomized",
        "name": "Randomized QuickSort",
        "time_best": "Ω(n log n)",
        "time_avg": "Θ(n log n)",
        "time_worst": "O(n²)*",
        "space_aux": "O(log n)",
        "description": "Divide-and-conquer sorting with uniformly random pivot selection.",
        "analysis": "Random pivot selection prevents deterministic worst-case input exploits (e.g. sorted arrays). Expected runtime is strictly Θ(n log n). The probability of worst-case O(n²) is exponentially negligible (2^-n)."
    },
    {
        "category": "Parallel & Randomized",
        "name": "Randomized QuickSelect",
        "time_best": "Ω(n)",
        "time_avg": "Θ(n)",
        "time_worst": "O(n²)*",
        "space_aux": "O(1) / O(log n)",
        "description": "Selection algorithm to find the k-th smallest element using randomized partitioning.",
        "analysis": "Discards one partition partition at each step (T(n) = T(n/2) + O(n)), resulting in a geometric series sum that converges to expected linear time Θ(n)."
    }
]


def get_algorithm_complexity_matrix() -> Dict[str, Any]:
    """Returns the complete structured complexity matrix for the system."""
    return {
        "institution": "Bohol Island State University",
        "college": "Office of the College of Science and Management",
        "syllabus_code": "F-AQA-INS-002",
        "title": "Intelligent Text Search, Compression, and Optimization System",
        "total_algorithms_analyzed": len(COMPLEXITY_RECORDS),
        "records": COMPLEXITY_RECORDS
    }

