# Tabu Search Core – Ad-to-Campaign Optimization

This document explains the structure, logic, and flow of the **Tabu Search** implementation used to optimize the allocation of ads to marketing campaigns.

The goal of the algorithm is to **maximize overall fitness** (e.g. ROI under budget and risk constraints) while avoiding cycling and local optima.

---

## 1. Overview

**Tabu Search** is a metaheuristic optimization algorithm that:
- Starts from an initial solution
- Iteratively explores neighboring solutions
- Uses a *tabu list* to avoid revisiting recent moves or solutions
- Applies **intensification** and **diversification** strategies to escape stagnation

In this project, a solution represents an **allocation of ads to campaigns**.

---

## 2. Core Dependencies

The Tabu Search reuses components from the Genetic Algorithm module:

- `Individual` → represents a solution (ad allocation)
- `DataManager` → manages campaigns, ads, and IDs
- `FitnessEvaluator` → evaluates solutions
- `print_solution_details` → reporting utility

This ensures **consistent fitness logic** across optimization techniques.

---

## 3. Tabu List (`TabuList`)

The `TabuList` prevents cycling by remembering:
1. **Recent moves**
2. **Recently visited solutions**

### Key Concepts

- **Move-based tabu**  
  Prevents repeating the same ad transfer or swap.
  
- **Solution-based tabu**  
  Prevents revisiting the same full allocation.

### Data Structures

- `deque` → FIFO queue for tabu moves
- `set` → hash-based storage for solution signatures

### Solution Signature

A solution is uniquely represented by:
```text
(campaign_id, sorted_ad_ids)
