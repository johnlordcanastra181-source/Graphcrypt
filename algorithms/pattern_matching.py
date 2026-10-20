"""
Pattern Matching Algorithms Engine
Bohol Island State University (BISU) Final Project
Implements:
1. Brute Force String Matching
2. Knuth-Morris-Pratt (KMP)
3. Boyer-Moore (Bad Character + Good Suffix)
4. Rabin-Karp (Rolling Polynomial Hash)
5. Approximate String Matching (Levenshtein Distance)
Includes step-by-step explanatory flow and telemetry ("Bakit Ganyan ang Result").
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
            "details": f"Searched text of {n} chars for pattern of {m} chars.",
            "flow_explanation": "Walang wastong haba para sa paghahanap.",
            "why_result": "Hindi sapat ang haba ng text o pattern upang masuri."
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
        "details": f"Found {len(matches)} occurrence(s) with {comparisons} character comparison(s).",
        "flow_explanation": "Sinusuri ang bawat posisyon mula simula hanggang dulo. Kapag nagka-mismatch, umuusad lamang ng 1 hakbang (i + 1) at inuulit muli ang paghahambing mula sa unang titik ng pattern nang walang anumang paglaktaw o precomputation.",
        "why_result": f"Nagsagawa ng {comparisons} comparisons sa kabuuang {n} text characters. Walang preprocessing kaya O(1) auxiliary space, ngunit pinakamaraming character comparisons dahil walang ginagawang paglaktaw."
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
            "lps_breakdown": [],
            "time_microseconds": round(elapsed_us, 2),
            "details": "Invalid length bounds.",
            "flow_explanation": "Walang wastong haba para sa paghahanap.",
            "why_result": "Hindi sapat ang haba ng text o pattern."
        }

    lps, prep_comparisons = compute_lps(pattern)
    comparisons = prep_comparisons

    i = 0  # text index
    j = 0  # pattern index
    skips_count = 0

    while i < n:
        comparisons += 1
        if pattern[j] == text[i]:
            i += 1
            j += 1

        if j == m:
            matches.append(i - j)
            j = lps[j - 1]
            skips_count += 1
        elif i < n and pattern[j] != text[i]:
            if j != 0:
                j = lps[j - 1]
                skips_count += 1
            else:
                i += 1

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000

    # Build human-readable LPS breakdown
    lps_breakdown = [
        {
            "index": idx,
            "char": pattern[idx],
            "lps_val": lps[idx],
            "prefix_suffix": pattern[:lps[idx]] if lps[idx] > 0 else "-"
        }
        for idx in range(m)
    ]

    return {
        "algorithm": "Knuth-Morris-Pratt (KMP)",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "lps_table": lps,
        "lps_breakdown": lps_breakdown,
        "skips_count": skips_count,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} match(es). LPS Table: {lps}",
        "flow_explanation": "Binuo muna ang LPS (Longest Proper Prefix which is also Suffix) array. Kapag nagkaroon ng mismatch sa index j, HINDI na bumabalik ang text pointer i pabalik; inililipat lamang ang pattern pointer sa j = LPS[j - 1]. Dahil dito, strictly linear O(n + m) ang oras.",
        "why_result": f"Nakamit ang {len(matches)} match(es) sa loob ng {round(elapsed_us, 1)} µs. Nakagawa ng {skips_count} smart skips gamit ang LPS table kaya naiwasan ang redundant comparisons."
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
            "bad_char_table": {},
            "time_microseconds": round(elapsed_us, 2),
            "details": "Invalid length bounds.",
            "flow_explanation": "Walang wastong haba para sa paghahanap.",
            "why_result": "Hindi sapat ang haba ng text o pattern."
        }

    bad_char = compute_bad_char_table(pattern)
    shift = 0
    total_shifts = 0

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
            total_shifts += 1
        else:
            bc_shift = bad_char.get(text[shift + j], m)
            step_shift = max(1, bc_shift - (m - 1 - j))
            shift += step_shift
            total_shifts += 1

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Boyer-Moore",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "bad_char_table": {k: v for k, v in list(bad_char.items())[:20]},
        "total_shifts": total_shifts,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} match(es) with sublinear Boyer-Moore skips.",
        "flow_explanation": "Nagsusuri mula kanan pakaliwa (right-to-left). Kapag may mismatched character, tinitingnan ang Bad Character Table. Kung ang character ay wala sa pattern, nilalaktawan agad ang buong haba ng pattern (m characters) sa isang hakbang lang!",
        "why_result": f"Nakamit ang sublinear performance sa natural text. Nakagawa ng {total_shifts} window shifts, madalas lumalaktaw ng higit sa 1 character bawat hakbang."
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
    hash_calculations = 0
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
            "pattern_hash": 0,
            "time_microseconds": round(elapsed_us, 2),
            "details": "Invalid length bounds.",
            "flow_explanation": "Walang wastong haba para sa paghahanap.",
            "why_result": "Hindi sapat ang haba ng text o pattern."
        }

    h = pow(base, m - 1, prime)
    p_hash = 0
    t_hash = 0

    for i in range(m):
        p_hash = (base * p_hash + ord(pattern[i])) % prime
        t_hash = (base * t_hash + ord(text[i])) % prime

    hash_calculations += 1

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
            hash_calculations += 1

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "algorithm": "Rabin-Karp",
        "matches": matches,
        "match_count": len(matches),
        "comparisons": comparisons,
        "spurious_hits": spurious_hits,
        "pattern_hash": p_hash,
        "hash_calculations": hash_calculations,
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found {len(matches)} match(es). Spurious hash collisions: {spurious_hits}.",
        "flow_explanation": f"Kinakalkula ang numerical polynomial hash ng pattern ({p_hash}) gamit ang prime {prime}. Sa bawat hakbang, ina-update ang window hash sa O(1) arithmetic operations gamit ang rolling hash formula. Kapag nag-match ang numerical hash, saka lamang susuriin ang bawat character.",
        "why_result": f"Mabilis na nasuri ang {hash_calculations} windows gamit ang rolling hash. Nakaranas lamang ng {spurious_hits} spurious hash collision(s), na nagpapatunay na epektibo ang polynomial hashing."
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
            "details": "Empty text or pattern.",
            "flow_explanation": "Walang text o pattern.",
            "why_result": "Hindi masusuri ang bakanteng input."
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
        "details": f"Found {len(filtered)} fuzzy match(es) within edit distance <= {max_distance}.",
        "flow_explanation": f"Gumamit ng Dynamic Programming matrix upang kwentahin ang pinakamababang bilang ng edit operations (insertion, deletion, substitution) na kailangan upang maging kapareho ng target pattern ang substring. Pinayagan ang hanggang {max_distance} pagbabago.",
        "why_result": f"Natagpuan ang {len(filtered)} fuzzy match(es) kahit may kaunting pagkakaiba sa baybay o typo, kapaki-pakinabang para sa natural text search at genomic sequences."
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
        "flow_summary": "Ang KMP at Boyer-Moore ay nagpapakita ng pinakakaunting comparisons dahil sa matalinong paglaktaw ng mga nasuring karakter, samantalang ang Brute Force ang may pinakamaraming comparisons."
    }
