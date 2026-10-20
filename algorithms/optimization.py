"""
Optimization Engine: Genetic Algorithm & Combinatorial Knapsack
Bohol Island State University (BISU) Final Project
Implements:
1. Genetic Algorithm (GA) Metaheuristic with population telemetry & fitness curves
2. Combinatorial 0/1 Knapsack Problem (Dynamic Programming exact vs Greedy heuristic)
3. Step-by-step explanatory flow and telemetry ("Bakit Ganyan ang Result")
"""

import random
import time
from typing import Any, Dict, List, Optional, Tuple


# ========================================================
# 1. COMBINATORIAL OPTIMIZATION: 0/1 KNAPSACK (EXACT DP & GREEDY)
# ========================================================

def knapsack_dynamic_programming(
    items: List[Dict[str, Any]],
    capacity: int
) -> Dict[str, Any]:
    """
    Solves the 0/1 Knapsack Problem using Dynamic Programming.
    Guarantees mathematically exact optimal solution.
    Time Complexity: O(N * W)
    Space Complexity: O(N * W)
    """
    start_time = time.perf_counter()
    n = len(items)
    if n == 0 or capacity <= 0:
        return {
            "method": "Dynamic Programming (Exact)",
            "selected_items": [],
            "total_value": 0,
            "total_weight": 0,
            "capacity": capacity,
            "time_microseconds": 0.0,
            "is_optimal": True,
            "flow_explanation": "Walang items o capacity.",
            "why_result": "Walang solusyon sa bakanteng inputs."
        }

    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        wt = int(items[i - 1]["weight"])
        val = int(items[i - 1]["value"])
        for w in range(capacity + 1):
            if wt <= w:
                dp[i][w] = max(val + dp[i - 1][w - wt], dp[i - 1][w])
            else:
                dp[i][w] = dp[i - 1][w]

    total_value = dp[n][capacity]

    selected: List[Dict[str, Any]] = []
    w = capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            item = items[i - 1]
            selected.append(item)
            w -= int(item["weight"])

    selected.reverse()
    total_weight = sum(item["weight"] for item in selected)
    elapsed_us = (time.perf_counter() - start_time) * 1_000_000

    return {
        "method": "Dynamic Programming (Exact)",
        "selected_items": selected,
        "selected_indices": [items.index(it) for it in selected],
        "total_value": total_value,
        "total_weight": total_weight,
        "capacity": capacity,
        "time_microseconds": round(elapsed_us, 2),
        "is_optimal": True,
        "details": f"Optimal value {total_value} achieved with {len(selected)} items.",
        "flow_explanation": "Binuo ang 2D Dynamic Programming table dp[i][w] na may sukat na (N+1) x (W+1). Para sa bawat item, inihahambing kung mas mainam na isama ito (val + dp[i-1][w-wt]) o iwanan (dp[i-1][w]). Dahil sinusuri ang lahat ng subproblem memoization, ginagarantiyahan ang 100% mathematically exact global optimum.",
        "why_result": f"Nakamit ang global optimum value na {total_value} gamit ang timbang na {total_weight}/{capacity}. Walang ibang kombinasyon ng mga item na makakalamang sa solusyong ito sa ibinigay na limitasyon."
    }


def knapsack_greedy(
    items: List[Dict[str, Any]],
    capacity: int
) -> Dict[str, Any]:
    """
    Solves the 0/1 Knapsack Problem using Greedy Value-to-Weight heuristic.
    Time Complexity: O(N log N)
    Space Complexity: O(N)
    """
    start_time = time.perf_counter()
    if not items or capacity <= 0:
        return {
            "method": "Greedy Heuristic",
            "selected_items": [],
            "total_value": 0,
            "total_weight": 0,
            "capacity": capacity,
            "time_microseconds": 0.0,
            "is_optimal": False,
            "flow_explanation": "Walang items o capacity.",
            "why_result": "Walang solusyon sa bakanteng inputs."
        }

    sorted_items = sorted(
        items,
        key=lambda it: it["value"] / max(1, it["weight"]),
        reverse=True
    )

    selected: List[Dict[str, Any]] = []
    current_weight = 0
    total_value = 0

    for item in sorted_items:
        wt = item["weight"]
        if current_weight + wt <= capacity:
            selected.append(item)
            current_weight += wt
            total_value += item["value"]

    elapsed_us = (time.perf_counter() - start_time) * 1_000_000
    return {
        "method": "Greedy Heuristic (Ratio)",
        "selected_items": selected,
        "selected_indices": [items.index(it) for it in selected],
        "total_value": total_value,
        "total_weight": current_weight,
        "capacity": capacity,
        "time_microseconds": round(elapsed_us, 2),
        "is_optimal": False,
        "details": f"Heuristic value {total_value} achieved with {len(selected)} items.",
        "flow_explanation": "Inayos ang lahat ng mga item ayon sa kanilang value-to-weight ratio (value / weight) mula pinakamataas pababa. Sunod-sunod na pinili ang may pinakamagagandang ratio hangga't kasya sa timbang. Mabilis itong matapos O(N log N) ngunit hindi ginagarantiyahan ang ganap na optimum sa 0/1 discrete knapsack.",
        "why_result": f"Nakamit ang value na {total_value}. Bagama't mabilis, maaari itong mag-iwan ng bakanteng espasyo sa knapsack kung hindi saktong magkakasya ang sumunod na pinakamagandang item."
    }


# ========================================================
# 2. GENETIC ALGORITHM (GA) METAHEURISTIC
# ========================================================

def evaluate_fitness(
    chromosome: List[int],
    items: List[Dict[str, Any]],
    capacity: int
) -> Tuple[int, int]:
    """Computes fitness: total value with penalty if capacity is exceeded."""
    tot_val = 0
    tot_wt = 0
    for gene, item in zip(chromosome, items):
        if gene == 1:
            tot_val += item["value"]
            tot_wt += item["weight"]

    if tot_wt > capacity:
        excess = tot_wt - capacity
        fitness = max(0, tot_val - excess * 5)
    else:
        fitness = tot_val

    return fitness, tot_wt


def run_genetic_algorithm(
    items: Optional[List[Dict[str, Any]]] = None,
    capacity: int = 50,
    population_size: int = 40,
    generations: int = 50,
    crossover_rate: float = 0.8,
    mutation_rate: float = 0.05
) -> Dict[str, Any]:
    """
    Executes a Genetic Algorithm for combinatorial optimization.
    Features:
    - Binary chromosome encoding
    - Tournament selection
    - Single-point crossover
    - Bit-flip mutation
    - Elitism
    - Full telemetry per generation and explanatory flow
    """
    start_time = time.perf_counter()

    if items is None or len(items) == 0:
        items = [
            {"id": "DOC-1", "name": "Executive Summary", "weight": 12, "value": 24},
            {"id": "DOC-2", "name": "System Architecture", "weight": 15, "value": 30},
            {"id": "DOC-3", "name": "Algorithm Benchmarks", "weight": 8, "value": 18},
            {"id": "DOC-4", "name": "Security Protocols", "weight": 20, "value": 35},
            {"id": "DOC-5", "name": "API Documentation", "weight": 10, "value": 22},
            {"id": "DOC-6", "name": "Error Telemetry", "weight": 6, "value": 14},
            {"id": "DOC-7", "name": "User Guide Handbook", "weight": 18, "value": 28},
            {"id": "DOC-8", "name": "Database Schema", "weight": 14, "value": 26},
            {"id": "DOC-9", "name": "Research Citations", "weight": 9, "value": 16},
            {"id": "DOC-10", "name": "Source Code Index", "weight": 11, "value": 25},
        ]

    n = len(items)
    random.seed(42)

    population: List[List[int]] = [
        [1 if random.random() < 0.3 else 0 for _ in range(n)]
        for _ in range(population_size)
    ]

    history: List[Dict[str, Any]] = []
    best_chromosome: List[int] = population[0]
    best_fitness = -1

    initial_gen_best = 0

    for gen in range(generations):
        fitness_scores = [evaluate_fitness(ind, items, capacity)[0] for ind in population]
        gen_best_fitness = max(fitness_scores)
        gen_avg_fitness = sum(fitness_scores) / len(fitness_scores)
        best_idx = fitness_scores.index(gen_best_fitness)

        if gen == 0:
            initial_gen_best = gen_best_fitness

        if gen_best_fitness > best_fitness:
            best_fitness = gen_best_fitness
            best_chromosome = list(population[best_idx])

        history.append({
            "generation": gen + 1,
            "best_fitness": gen_best_fitness,
            "avg_fitness": round(gen_avg_fitness, 2),
        })

        new_population: List[List[int]] = [list(population[best_idx])]

        while len(new_population) < population_size:
            def tournament() -> List[int]:
                candidates = random.sample(range(population_size), 3)
                best_cand = max(candidates, key=lambda idx: fitness_scores[idx])
                return population[best_cand]

            parent1 = tournament()
            parent2 = tournament()

            if random.random() < crossover_rate and n > 1:
                cx_point = random.randint(1, n - 1)
                child1 = parent1[:cx_point] + parent2[cx_point:]
                child2 = parent2[:cx_point] + parent1[cx_point:]
            else:
                child1 = list(parent1)
                child2 = list(parent2)

            for child in (child1, child2):
                for gene_idx in range(n):
                    if random.random() < mutation_rate:
                        child[gene_idx] = 1 - child[gene_idx]
                new_population.append(child)
                if len(new_population) >= population_size:
                    break

        population = new_population

    final_fitness, final_weight = evaluate_fitness(best_chromosome, items, capacity)
    selected_items = [items[i] for i, g in enumerate(best_chromosome) if g == 1]
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    dp_solution = knapsack_dynamic_programming(items, capacity)
    optimality_ratio = round((final_fitness / max(1, dp_solution["total_value"])) * 100, 1)

    return {
        "method": "Genetic Algorithm (GA)",
        "selected_items": selected_items,
        "chromosome": best_chromosome,
        "total_value": final_fitness,
        "total_weight": final_weight,
        "capacity": capacity,
        "generations": generations,
        "population_size": population_size,
        "crossover_rate": crossover_rate,
        "mutation_rate": mutation_rate,
        "initial_fitness": initial_gen_best,
        "final_fitness": final_fitness,
        "convergence_history": history,
        "time_ms": round(elapsed_ms, 2),
        "comparison": {
            "ga_value": final_fitness,
            "dp_exact_value": dp_solution["total_value"],
            "optimality_ratio": optimality_ratio,
            "dp_time_us": dp_solution["time_microseconds"],
        },
        "details": f"GA reached fitness {final_fitness} ({optimality_ratio}% of DP theoretical optimum) in {generations} generations.",
        "flow_explanation": f"1. Inisyal na Populasyon: Lumikha ng {population_size} random binary chromosomes.\n2. Fitness Function: Kinwenta ang halaga ng mga kasamang item; pinarusahan ng malaking penalty ang lumagpas sa {capacity} capacity.\n3. Tournament Selection: Pinili ang pinakamagagaling na indibidwal sa bawat pangkat ng 3 kandidato.\n4. Crossover ({int(crossover_rate * 100)}%): Pinagsama ang mga genes ng mga magulang sa isang random split point.\n5. Mutation ({int(mutation_rate * 100)}%): Random na binaligtad ang ilang bits upang mapanatili ang diversity at maiwasan ang local trap.\n6. Elitism: Ang pinakamagandang solusyon ng henerasyon ay direktang ipinasa sa susunod.",
        "why_result": f"Mula sa panimulang best fitness na {initial_gen_best} sa Generation 1, matagumpay na umakyat patungo sa {final_fitness} sa Generation {generations} dahil sa simulated natural selection ({optimality_ratio}% ng mathematically proven DP global optimum)."
    }
