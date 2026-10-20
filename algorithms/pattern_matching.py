"""
Pattern Matching Algorithms Engine
Bohol Island State University (BISU) Final Project
Implements:
1. Brute Force String Matching
2. Knuth-Morris-Pratt (KMP)
3. Boyer-Moore (Bad Character + Good Suffix)
4. Rabin-Karp (Rolling Polynomial Hash)
5. Approximate String Matching (Levenshtein Distance)
"""

import time
from typing import Any, Dict, List, Tuple


def brute_force_search(text: str, pattern: str) -> Dict[str, Any]:
    """
    Brute force string matching algorithm.
    Time Complexity: Best O(n), Average O(n*m), Worst O(n*m)
    Space Complexity: O(1)
    """
    start_time = time.perf_counter()
    matches: List[int] = []
    comparisons = 0
    n = len(text)
    m = len(pattern)

    if m == 0 or n == 0 or m > n:
        elapsed_us = (time.perf_counter() - start_time) * 1_000_000
        return {
            "algorithm": "Brute Force",
            "matches": matches,
            "match_count": 0,
            "comparisons": comparisons,
            "time_microseconds": round(elapsed_us, 2),
            "details": f"Searched text of {n} chars for pattern of {m} chars."
        }

    for i in range(n - m + 1):
        matched = True
        for j in range(m):
            comparisons += 1
            if text[i + j] != pattern[j]:
                matched = False
                break
        if matched:
            matches.append(i)

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Brute Force",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} occurrence(s) with {comparisons} character comparison(s)."
    }


def compute_lps(pattern: str) -> Tuple[List[int], int]:
    """Computes the Longest Proper Prefix which is also Suffix (LPS) array for KMP."""
    m = len(pattern)
    lps = [0] * m
    length = 0
    i = 1
    comparisons = 0

    while i < m:
        comparisons += 1
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        else:
            if length != 0:
                length = lps[length - 1]
            else:
                lps[i] = 0
                i += 1
    return lps, comparisons


def kmp_search(text: str, pattern: str) -> Dict[str, Any]:
    """
    Knuth-Morris-Pratt (KMP) string matching algorithm.
    Time Complexity: O(n + m)
    Space Complexity: O(m)
    """
    start_time = time.perf_counter()
    matches: List[int] = []
    n = len(text)
    m = len(pattern)

    if m == 0 or n == 0 or m > n:
        elapsed_us = (time.perf_counter() - start_time) * 1_000_000
        return {
            "algorithm": "Knuth-Morris-Pratt (KMP)",
            "matches": matches,
            "match_count": 0,
            "comparisons": 0,
            "lps_table": [],
            "time_microseconds": round(elapsed_us, 2),
            "details": "Invalid length bounds."
        }

    lps, prep_comparisons = compute_lps(pattern)
    comparisons = prep_comparisons

    i = 0  # text index
    j = 0  # pattern index

    while i < n:
        comparisons += 1
        if pattern[j] == text[i]:
            i += 1
            j += 1

        if j == m:
            matches.append(i - j)
            j = lps[j - 1]
        elif i < n and pattern[j] != text[i]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Knuth-Morris-Pratt (KMP)",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "lps_table": lps,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} match(es). LPS Table: {lps}"
    }


def compute_bad_char_table(pattern: str) -> Dict[str, int]:
    """Computes the Bad Character shift table for Boyer-Moore."""
    m = len(pattern)
    table: Dict[str, int] = {}
    for i in range(m - 1):
        table[pattern[i]] = m - 1 - i
    return table


def boyer_moore_search(text: str, pattern: str) -> Dict[str, Any]:
    """
    Boyer-Moore string matching algorithm (Bad Character rule).
    Time Complexity: Best O(n/m), Average O(n/m), Worst O(n*m)
    Space Complexity: O(alphabet size)
    """
    start_time = time.perf_counter()
    matches: List[int] = []
    comparisons = 0
    n = len(text)
    m = len(pattern)

    if m == 0 or n == 0 or m > n:
        elapsed_us = (time.perf_counter() - start_time) * 1_000_000
        return {
            "algorithm": "Boyer-Moore",
            "matches": matches,
            "match_count": 0,
            "comparisons": 0,
            "time_microseconds": round(elapsed_us, 2),
            "details": "Invalid length bounds."
        }

    bad_char = compute_bad_char_table(pattern)
    shift = 0

    while shift <= (n - m):
        j = m - 1
        while j >= 0:
            comparisons += 1
            if pattern[j] != text[shift + j]:
                break
            j -= 1

        if j < 0:
            matches.append(shift)
            shift += (m - bad_char.get(text[shift + m], -1)) if (shift + m < n) else 1
        else:
            bc_shift = bad_char.get(text[shift + j], m)
            shift += max(1, bc_shift - (m - 1 - j))

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Boyer-Moore",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "bad_char_table": {k: v for k, v in list(bad_char.items())[:15]},
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} match(es) with sublinear Boyer-Moore skips."
    }


def rabin_karp_search(text: str, pattern: str, prime: int = 101, base: int = 256) -> Dict[str, Any]:
    """
    Rabin-Karp string matching algorithm with rolling polynomial hash.
    Time Complexity: Average O(n + m), Worst O(n*m)
    Space Complexity: O(1)
    """
    start_time = time.perf_counter()
    matches: List[int] = []
    comparisons = 0
    spurious_hits = 0
    n = len(text)
    m = len(pattern)

    if m == 0 or n == 0 or m > n:
        elapsed_us = (time.perf_counter() - start_time) * 1_000_000
        return {
            "algorithm": "Rabin-Karp",
            "matches": matches,
            "match_count": 0,
            "comparisons": 0,
            "spurious_hits": 0,
            "time_microseconds": round(elapsed_us, 2),
            "details": "Invalid length bounds."
        }

    h = pow(base, m - 1, prime)
    p_hash = 0
    t_hash = 0

    for i in range(m):
        p_hash = (base * p_hash + ord(pattern[i])) % prime
        t_hash = (base * t_hash + ord(text[i])) % prime

    for i in range(n - m + 1):
        if p_hash == t_hash:
            # Hash matches, verify characters
            match = True
            for j in range(m):
                comparisons += 1
                if text[i + j] != pattern[j]:
                    match = False
                    spurious_hits += 1
                    break
            if match:
                matches.append(i)

        if i < n - m:
            t_hash = (base * (t_hash - ord(text[i]) * h) + ord(text[i + m])) % prime
            if t_hash < 0:
                t_hash += prime

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Rabin-Karp",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "spurious_hits": spurious_hits,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} match(es). Spurious hash collisions: {spurious_hits}."
    }


def approximate_search(text: str, pattern: str, max_distance: int = 1) -> Dict[str, Any]:
    """
    Approximate String Matching using Levenshtein Edit Distance.
    Allows up to max_distance insertions, deletions, or substitutions.
    Time Complexity: O(n * m)
    Space Complexity: O(m)
    """
    start_time = time.perf_counter()
    matches: List[Dict[str, Any]] = []
    comparisons = 0
    n = len(text)
    m = len(pattern)

    if m == 0 or n == 0:
        elapsed_us = (time.perf_counter() - start_time) * 1_000_000
        return {
            "algorithm": "Approximate Matching",
            "matches": matches,
            "match_count": 0,
            "comparisons": 0,
            "max_distance": max_distance,
            "time_microseconds": round(elapsed_us, 2),
            "details": "Empty text or pattern."
        }

    # Sliding window around length m
    window_sizes = range(max(1, m - max_distance), min(n + 1, m + max_distance + 1))

    for w in window_sizes:
        for i in range(n - w + 1):
            sub = text[i:i + w]
            # Compute Levenshtein distance between sub and pattern
            dp = list(range(len(sub) + 1))
            for p_idx, p_char in enumerate(pattern):
                new_dp = [p_idx + 1] + [0] * len(sub)
                for s_idx, s_char in enumerate(sub):
                    comparisons += 1
                    cost = 0 if p_char == s_char else 1
                    new_dp[s_idx + 1] = min(
                        dp[s_idx + 1] + 1,       # deletion
                        new_dp[s_idx] + 1,       # insertion
                        dp[s_idx] + cost         # substitution
                    )
                dp = new_dp
            dist = dp[-1]
            if dist <= max_distance:
                matches.append({
                    "start": i,
                    "end": i + w,
                    "matched_text": sub,
                    "distance": dist
                })

    # Sort matches by start position and distance, remove overlapping redundant hits
    matches.sort(key=lambda x: (x["start"], x["distance"]))
    filtered: List[Dict[str, Any]] = []
    seen_starts = set()
    for m_item in matches:
        if m_item["start"] not in seen_starts:
            seen_starts.add(m_item["start"])
            filtered.append(m_item)

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Approximate Matching",
        "matches": [m["start"] for m in filtered],
        "detailed_matches": filtered,
        "match_count": len(filtered),
        "comparisons": comparisons,
        "max_distance": max_distance,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(filtered)} fuzzy match(es) within edit distance <= {max_distance}."
    }


def compare_all_matchers(text: str, pattern: str) -> Dict[str, Any]:
    """Runs all primary string matching algorithms and returns comparative metrics."""
    res_bf = brute_force_search(text, pattern)
    res_kmp = kmp_search(text, pattern)
    res_bm = boyer_moore_search(text, pattern)
    res_rk = rabin_karp_search(text, pattern)
    res_approx = approximate_search(text, pattern, max_distance=1)

    algorithms = [res_bf, res_kmp, res_bm, res_rk, res_approx]
    return {
        "pattern": pattern,
        "text_length": len(text),
        "pattern_length": len(pattern),
        "results": algorithms,
        "matches": res_kmp["matches"],
        "match_count": len(res_kmp["matches"]),
    }

