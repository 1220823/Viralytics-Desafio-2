# 🧬 Genetic Algorithm - Marketing Optimization Explained

## What is a Genetic Algorithm?

Think of it like **evolution in nature**: you start with a population of random solutions, and over many generations, they "evolve" to become better and better solutions.

---

## 📊 The Problem We're Solving

You have:
- **X campaigns** (e.g., 10 campaigns with budgets)
- **Y ads** (e.g., 50 different advertisements)

**Goal:** Assign each ad to a campaign to maximize ROI while staying within budget.

**Rules:**
- Every campaign must have at least 1 ad
- Every ad must be assigned to exactly 1 campaign
- Don't exceed total budget

---

## 🔄 How the Algorithm Works

### **STEP 1: Create Initial Population** 
```python
def initialize_population(self):
```

**What happens:**
- Creates 50 random solutions (population_size=50)
- Each solution = one way to assign all ads to campaigns

**Example of ONE solution:**
```
Campaign 1 → [Ad 5, Ad 12, Ad 33]
Campaign 2 → [Ad 1, Ad 7]
Campaign 3 → [Ad 2, Ad 9, Ad 15, Ad 22]
... (all 50 ads distributed)
```

Each solution is called an **Individual**.

---

### **STEP 2: Evaluate Fitness** 
```python
def evaluate(self, individual: Individual):
```

**What happens:** For each solution, calculate how good it is.

**Calculation process:**

#### 1. For each campaign in the solution:
```
Campaign Cost = Approved Budget + Overcost
Example: $1,000,000 + $5,000 = $1,005,000
```

#### 2. For each ad assigned to that campaign:
```
- Split campaign clicks among its ads equally
  Ad Share = 1 / number_of_ads_in_campaign
  
- Calculate expected clicks for this ad:
  Expected Clicks = Campaign Total Clicks × Ad Share
  
- Calculate conversions:
  Expected Conversions = Expected Clicks × Conversion Rate
  
- Calculate revenue:
  Value per Conversion = CPC × ROI
  Ad Revenue = Expected Conversions × Value per Conversion
```

#### 3. Calculate campaign ROI:
```
Campaign ROI = (Total Revenue - Total Cost) / Total Cost
Example: ($1,200,000 - $1,005,000) / $1,005,000 = 19.4%
```

#### 4. Sum up all campaigns to get total ROI

#### 5. Apply penalties/bonuses:
- ❌ **Budget Penalty:** Big penalty if total cost exceeds budget
  ```
  If cost > budget:
      excess_ratio = (cost - budget) / budget
      penalty = -10.0 × excess_ratio
  ```
  
- ✅ **Budget Bonus:** Small bonus if using 85-100% of budget efficiently
  ```
  If 0.85 ≤ budget_usage ≤ 1.0:
      bonus = 0.5 × budget_usage
  ```

#### 6. Final Fitness Score:
```
Fitness = Total ROI + Budget Penalty + Budget Bonus
```

**Higher fitness = better solution!**

---

### **STEP 3: Selection** 
```python
def selection(self) -> Individual:
```

**What happens:** Pick the best solutions to be "parents" for the next generation.

**Tournament Selection:**
- Randomly pick 5 solutions
- Choose the best one from those 5
- This is like a mini-competition

**Why?** Good solutions get more chances to pass their "genes" (ad assignments) to children.

---

### **STEP 4: Crossover (Breeding)** 
```python
def crossover(self, parent1, parent2):
```

**What happens:** Combine two parent solutions to create two children.

**Example:**

**Parent 1:**
```
Campaign 1 → [Ad 5, Ad 12]
Campaign 2 → [Ad 1, Ad 7]
Campaign 3 → [Ad 2, Ad 9]
```

**Parent 2:**
```
Campaign 1 → [Ad 1, Ad 2]
Campaign 2 → [Ad 5, Ad 9]
Campaign 3 → [Ad 7, Ad 12]
```

**Process:**
1. Choose a random split point (e.g., Campaign 2)
2. Shuffle campaigns randomly
3. **Child 1:** Takes first group from Parent 1, second group from Parent 2
4. **Child 2:** Takes first group from Parent 2, second group from Parent 1
5. **Repair:** Ensure all ads are assigned exactly once (remove duplicates, add missing)

**Result:**
```
Child 1:
Campaign 1 → [Ad 5, Ad 12]     (from Parent 1)
Campaign 2 → [Ad 1, Ad 9]      (from Parent 2, repaired)
Campaign 3 → [Ad 2, Ad 7]      (from Parent 2, repaired)
```

---

### **STEP 5: Mutation** 
```python
def mutate(self, individual):
```

**What happens:** Randomly change the solution a bit to explore new possibilities.

**Process:**
1. For each ad, there's a small chance (mutation_rate = 15%) to move it
2. Pick a random campaign that has more than 1 ad (source)
3. Pick a different campaign (target)
4. Move one ad from source to target

**Example:**
```
Before: 
Campaign 1 → [Ad 5, Ad 12, Ad 33]
Campaign 2 → [Ad 1, Ad 7]

Mutation: Move Ad 12 from Campaign 1 to Campaign 2

After:  
Campaign 1 → [Ad 5, Ad 33]
Campaign 2 → [Ad 1, Ad 7, Ad 12]
```

**Why?** Prevents getting stuck in local optimum. Like random experimentation! Introduces diversity.

---

### **STEP 6: Evolution Loop** 
```python
def evolve(self):
```

**What happens:** Create the next generation.

1. **Keep the elite** (top 10% best solutions)
   - They survive unchanged to the next generation
   - Ensures we never lose the best solutions found so far

2. **Fill the rest** by:
   - Select 2 parents (using tournament selection)
   - Crossover → create 2 children
   - Mutate the children (random changes)
   - Evaluate their fitness (calculate how good they are)
   - Add to new population

3. **Replace old population** with new one

4. **Track the best solution** ever found across all generations

---

### **STEP 7: Repeat** 
```python
def run(self, verbose=True):
```

**What happens:** Run steps 3-6 for many generations (e.g., 100 generations)

**Typical progression:**
```
Gen   0 | ROI:  15.23% | Fitness:   15.730 | Cost: $10,234,567
Gen  10 | ROI:  18.45% | Fitness:   18.950 | Cost: $10,156,234
Gen  20 | ROI:  21.67% | Fitness:   22.170 | Cost: $9,987,432
Gen  30 | ROI:  24.12% | Fitness:   24.620 | Cost: $9,923,145
Gen  40 | ROI:  27.34% | Fitness:   27.840 | Cost: $9,891,234
Gen  50 | ROI:  29.56% | Fitness:   30.060 | Cost: $9,875,000
...
Gen 100 | ROI:  35.89% | Fitness:   36.390 | Cost: $9,950,000
```

Solutions get **better and better** over time! 📈

---

## 🎯 Final Result

After 100 generations, you get the **best solution**:
- Which ads go to which campaigns
- Expected total ROI
- Expected total cost
- Expected total revenue
- ROI for each individual campaign
- Number of ads per campaign

**Example Output:**
```
📊 MÉTRICAS GLOBAIS:
  • ROI Total: 35.89%
  • Fitness: 36.390
  • Custo Total: $9,950,000
  • Revenue Total: $13,520,550
  • Lucro: $3,570,550

📈 DETALHES POR CAMPANHA:

  Campanha #1 (Social - Facebook Ads)
    └─ ROI: 42.30% | Cost: $1,175,447 | Revenue: $1,672,810
    └─ Budget: $1,175,447 | Overcost: $0 | Avg Conversion: 8.23%
    └─ Anúncios alocados: 5
       IDs: [12, 34, 56, 78, 90]

  Campanha #2 (Search - Google Ads)
    └─ ROI: 38.15% | Cost: $283,335 | Revenue: $391,345
    └─ Budget: $283,335 | Overcost: $0 | Avg Conversion: 7.45%
    └─ Anúncios alocados: 3
       IDs: [5, 23, 67]
...
```

---

## 🔑 Key Concepts Summary

| Concept | What It Means | Example |
|---------|---------------|---------|
| **Individual** | One complete solution (ad-to-campaign assignment) | All 50 ads assigned to 10 campaigns |
| **Population** | A group of solutions | 50 different individuals |
| **Fitness** | How good a solution is (higher = better) | ROI + penalties/bonuses |
| **Selection** | Picking good solutions to breed | Tournament of 5 solutions |
| **Crossover** | Mixing two solutions to create new ones | Combine Parent 1 + Parent 2 |
| **Mutation** | Random changes to explore new possibilities | Move Ad 12 to different campaign |
| **Generation** | One cycle of selection → crossover → mutation | Gen 1, Gen 2, Gen 3... |
| **Evolution** | Over many generations, solutions improve | ROI increases over time |
| **Elitism** | Keeping the best solutions unchanged | Top 10% survive |

---

## 📈 Why Does It Work?

1. **Random start** explores the solution space widely
2. **Selection** favors better solutions (survival of the fittest)
3. **Crossover** combines good features from different solutions
4. **Mutation** prevents getting stuck in local optima
5. **Elitism** keeps the best solutions safe from being lost
6. **Iteration** gradually improves quality over generations

It's like **natural selection** but for marketing optimization! 🌱➡️🌳

---

## 🔧 Configuration Parameters

### Population Size (default: 100)
- How many solutions exist in each generation
- **Larger** = more exploration, slower execution
- **Smaller** = faster, but might miss good solutions

### Max Generations (default: 150)
- How many iterations to run
- **More** = better solutions, longer runtime
- **Less** = faster, but might not converge

### Mutation Rate (default: 0.15 = 15%)
- Probability of random changes
- **Higher** = more exploration, more randomness
- **Lower** = more exploitation of known good solutions

### Crossover Rate (default: 0.85 = 85%)
- Probability of combining parent solutions
- **Higher** = more mixing of solutions
- **Lower** = more independent solutions

### Total Budget
- Maximum allowed total cost across all campaigns
- Solutions exceeding this get heavy penalties

### Ideal ROI (default: 0.0)
- Target ROI (currently not used heavily in fitness)
- Could be used for goal-based optimization

---

## 🎓 Technical Details

### Data Structures

#### Individual
```python
@dataclass
class Individual:
    allocation: Dict[int, List[int]]  # campaign_id -> [ad_ids]
    fitness: float
    total_roi: float
    total_cost: float
    total_revenue: float
    campaign_metrics: Dict[int, dict]
```

#### Validation Rules
An individual is valid if:
1. All campaigns are present in allocation
2. Each campaign has at least 1 ad
3. All ads are distributed exactly once
4. No duplicate ads

---

## 🚀 How to Use

```python
from geneticAlgorithm import run_genetic_optimization

# Your campaigns and ads (with predicted overcosts and conversion rates)
campaigns = [...]  # List[Campaign]
ads = [...]        # List[Ad]

# Run optimization
best_solution = run_genetic_optimization(
    campaigns=campaigns,
    ads=ads,
    population_size=100,
    max_generations=150,
    mutation_rate=0.15,
    crossover_rate=0.85,
    total_budget=10_000_000,
    ideal_roi=0.0,
    verbose=True
)

# Access results
print(f"Best ROI: {best_solution.total_roi:.2%}")
print(f"Best Cost: ${best_solution.total_cost:,.2f}")
print(f"Allocation: {best_solution.allocation}")
```

---

## 📊 Performance Tips

1. **Start with smaller populations** to test quickly
2. **Increase generations** if solutions aren't improving enough
3. **Adjust mutation rate** if stuck in local optimum (increase) or too random (decrease)
4. **Monitor fitness over generations** - should show steady improvement
5. **Check budget usage** - solutions should use close to 100% of budget

---

## 🐛 Common Issues

### Problem: Algorithm doesn't improve after early generations
**Solution:** Increase mutation rate or population diversity

### Problem: All solutions exceed budget
**Solution:** Check if total approved budgets exceed available budget, or increase budget penalty weight

### Problem: ROI is negative
**Solution:** Revenue calculation might be incorrect, or overcosts are too high

### Problem: Takes too long to run
**Solution:** Reduce population size or max generations

---

## 📚 Further Reading

- **Genetic Algorithms:** Holland, J. H. (1992). "Adaptation in Natural and Artificial Systems"
- **Optimization:** Deb, K. (2001). "Multi-Objective Optimization using Evolutionary Algorithms"
- **Marketing Attribution:** Various papers on marketing mix modeling

---

**Created:** January 10, 2026  
**Version:** 1.0  
**Author:** Genetic Algorithm for Marketing Optimization
