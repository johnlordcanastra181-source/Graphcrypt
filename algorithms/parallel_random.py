"""
Parallel and Randomized Algorithms Engine
Bohol Island State University (BISU) Final Project
Implements:
1. Parallel Multi-Threaded Pattern Search (ThreadPoolExecutor with overlap boundaries & speedup metrics)
2. Randomized QuickSort (Random pivot vs Deterministic pivot with step telemetry)
3. Randomized QuickSelect (Expected O(n) rank selection)
4. Monte Carlo Text Sampling
"""

import concurrent.futures
import random
import time
from typing import Any, Dict, List, Tuple


# ========================================================
# 1. PARALLEL MULTI-THREADED PATTERN SEARCH
# ========================================================

def _search_chunk(args: Tuple[str, str, int, int]) -> Tuple[List[int], int, int]:
    """Helper worker function to search a specific partition chunk."""
    text, pattern, chunk_start_offset, worker_id = args
    matches: List[int] = []
    comparisons = 0
    m = len(pattern)
    n = len(text)

    for i in range(n - m + 1):
        matched = True
        for j in range(m):
            comparisons += 1
            if text[i + j] != pattern[j]:
                matched = False
                break
        if matched:
            matches.append(chunk_start_offset + i)

    return matches, comparisons, worker_id


def parallel_search_text(
    text: str,
    pattern: str,
    workers: int = 4
) -> Dict[str, Any]:
    """
    Executes parallel pattern matching across text partitions with boundary safety margins.
    Calculates sequential vs parallel runtime and speedup factor.
    """
    n = len(text)
    m = len(pattern)

    if m == 0 or n == 0 or m > n:
        return {
            "method": "Parallel Multi-Threaded Search",
            "matches": [],
            "match_count": 0,
            "workers": workers,
            "sequential_time_us": 0.0,
            "parallel_time_us": 0.0,
            "speedup": 1.0,
            "efficiency": 1.0,
            "partitions": []
        }

    # 1. Baseline Sequential Search
    seq_start = time.perf_counter()
    seq_matches = []
    seq_comps = 0
    for i in range(n - m + 1):
        matched = True
        for j in range(m):
            seq_comps += 1
            if text[i + j] != pattern[j]:
                matched = False
                break
        if matched:
            seq_matches.append(i)
    seq_elapsed_us = (time.perf_counter() - seq_start) * 1_000_000

    # 2. Parallel Search with Chunks & Overlaps
    par_start = time.perf_counter()
    chunk_size = (n + workers - 1) // workers
    chunk_tasks: List[Tuple[str, str, int, int]] = []

    for w in range(workers):
        start_idx = w * chunk_size
        if start_idx >= n:
            break
        # Extend end_idx by (m - 1) to cover matches straddling chunk boundaries
        end_idx = min(n, start_idx + chunk_size + (m - 1))
        chunk_text = text[start_idx:end_idx]
        chunk_tasks.append((chunk_text, pattern, start_idx, w))

    all_matches: List[int] = []
    total_par_comps = 0
    partition_info: List[Dict[str, Any]] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        results = executor.map(_search_chunk, chunk_tasks)
        for matches_sub, comps, worker_id in results:
            total_par_comps += comps
            all_matches.extend(matches_sub)
            partition_info.append({
                "worker_id": worker_id + 1,
                "matches_found": len(matches_sub),
                "comparisons": comps
            })

    par_elapsed_us = (time.perf_counter() - par_start) * 1_000_000

    # Remove duplicates from chunk boundary overlap
    unique_matches = sorted(list(set(all_matches)))
    speedup = round(seq_elapsed_us / max(0.1, par_elapsed_us), 2)
    efficiency = round(speedup / workers, 2)

    return {
        "method": "Parallel Multi-Threaded Search",
        "matches": unique_matches,
        "match_count": len(unique_matches),
        "workers": workers,
        "sequential_time_us": round(seq_elapsed_us, 2),
        "parallel_time_us": round(par_elapsed_us, 2),
        "speedup": speedup,
        "efficiency": efficiency,
        "total_comparisons": total_par_comps,
        "partitions": partition_info,
        "is_consistent": (unique_matches == seq_matches),
        "details": f"Processed {n} characters across {len(partition_info)} parallel threads with {speedup}x speedup."
    }


# ========================================================
# 2. RANDOMIZED QUICKSORT & QUICKSELECT
# ========================================================

def _partition_random(arr: List[Any], low: int, high: int, stats: Dict[str, int]) -> int:
    """Partitions array around a randomly selected pivot."""
    pivot_idx = random.randint(low, high)
    arr[pivot_idx], arr[high] = arr[high], arr[pivot_idx]
    pivot = arr[high]

    i = low - 1
    for j in range(low, high):
        stats["comparisons"] += 1
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


def _quicksort_helper(arr: List[Any], low: int, high: int, stats: Dict[str, int], depth: int = 0) -> None:
    if depth > stats["max_depth"]:
        stats["max_depth"] = depth

    if low < high:
        pi = _partition_random(arr, low, high, stats)
        _quicksort_helper(arr, low, pi - 1, stats, depth + 1)
        _quicksort_helper(arr, pi + 1, high, stats, depth + 1)


def randomized_quicksort(data: List[Any]) -> Dict[str, Any]:
    """
    Sorts elements using Randomized QuickSort.
    Guarantees Expected Time: O(n log n) by eliminating worst-case pivot attacks.
    Auxiliary Space: O(log n) call stack.
    """
    start_time = time.perf_counter()
    arr = list(data)
    stats = {"comparisons": 0, "max_depth": 0}

    if len(arr) > 1:
        _quicksort_helper(arr, 0, len(arr) - 1, stats)

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000

    return {
        "method": "Randomized QuickSort",
        "original_count": len(data),
        "sorted_sample": arr[:50],
        "sorted_full": arr,
        "comparisons": stats["comparisons"],
        "recursion_depth": stats["max_depth"],
        "time_microseconds": round(elapsed_us, 2),
        "is_sorted": all(arr[i] <= arr[i + 1] for i in range(len(arr) - 1)),
        "details": f"Sorted {len(data)} items in {round(elapsed_us, 2)} µs with {stats['comparisons']} comparisons."
    }


def randomized_quickselect(arr: List[Any], k: int) -> Dict[str, Any]:
    """
    Randomized Selection (QuickSelect) to find the k-th smallest element (0-indexed).
    Expected Time Complexity: O(n)
    Worst Time Complexity: O(n^2) (probability exponentially low)
    """
    start_time = time.perf_counter()
    a = list(arr)
    n = len(a)
    stats = {"comparisons": 0}

    if k < 0 or k >= n:
        return {"error": "Index k out of bounds", "element": None}

    low = 0
    high = n - 1

    while low <= high:
        if low == high:
            element = a[low]
            break

        pi = _partition_random(a, low, high, stats)

        if pi == k:
            element = a[pi]
            break
        elif pi > k:
            high = pi - 1
        else:
            low = pi + 1
    else:
        element = a[k]

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "method": "Randomized QuickSelect",
        "k": k,
        "element": element,
        "comparisons": stats["comparisons"],
        "time_microseconds": round(elapsed_us, 2),
        "details": f"Found rank {k} element '{element}' in expected linear O(n) time."
    }


# ========================================================
# 3. MONTE CARLO TEXT SAMPLER
# ========================================================

def monte_carlo_sample(text: str, sample_size: int = 100) -> Dict[str, Any]:
    """
    Randomized Monte Carlo sampling for statistical character/word frequency estimation.
    """
    start_time = time.perf_counter()
    if not text:
        return {"samples": [], "stats": {}}

    n = len(text)
    indices = [random.randint(0, n - 1) for _ in range(min(sample_size, n))]
    sampled_chars = [text[i] for i in indices]

    freq: Dict[str, int] = {}
    for c in sampled_chars:
        freq[c] = freq.get(c, 0) + 1

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "method": "Monte Carlo Sampling",
        "sample_size": len(sampled_chars),
        "frequencies": sorted([{"char": repr(k)[1:-1], "count": v, "pct": round((v / len(sampled_chars)) * 100, 1)}
                              for k, v in freq.items()], key=lambda x: x["count"], reverse=True)[:15],
        "time_microseconds": round(elapsed_us, 2)
    }

