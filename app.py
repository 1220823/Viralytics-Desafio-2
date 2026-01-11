import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import random
import os

# ==========================================
# 1. CONFIGURATION (CRITICAL: CHECK PATHS)
# ==========================================
# Path to the file created by Limpeza_Advertising.ipynb
FILE_ADS = 'Cleaned_Datasets/Advertising/advertising_v6_full_time_features.csv' 

# Path to the file created by Limpeza_Marketing.ipynb
FILE_CAMP = 'Cleaned_Datasets/Marketing/marketing_cleaned_prepared.csv'

BUDGET = 5000          # Your Total Budget
REVENUE_PER_CONV = 50  # Estimated Revenue per 'Click' (Assumed)

# ==========================================
# 2. LOAD & PREPARE DATA
# ==========================================
def load_and_validate(path, name):
    if not os.path.exists(path):
        # Try looking in current directory if path fails
        filename = os.path.basename(path)
        if os.path.exists(filename):
            print(f"⚠️ Found {name} in current folder instead of {path}. Using {filename}...")
            return pd.read_csv(filename)
        else:
            raise FileNotFoundError(f"❌ Could not find {name} at {path}. Please check the file path.")
    print(f"✅ Loaded {name} from {path}")
    return pd.read_csv(path)

df_ads = load_and_validate(FILE_ADS, "Ads Data")
df_camp = load_and_validate(FILE_CAMP, "Campaign Data")

# ==========================================
# 3. DETECT TARGET COLUMNS AUTOMATICALLY
# ==========================================
# For ADS (Conversion): Look for Click/Response
possible_targets_ads = ['click', 'clicked', 'response', 'converted', 'target', 'class']
target_ads = next((c for c in df_ads.columns if c.lower() in possible_targets_ads), None)

if not target_ads:
    # Fallback: Assume the last column is the target if not named explicitly
    target_ads = df_ads.columns[-1]
    print(f"⚠️ Warning: Could not find 'Click' column. Using last column: '{target_ads}'")
else:
    print(f"🎯 Ads Target Detected: '{target_ads}'")

# For CAMPAIGNS (Cost): Look for Cost/Budget
possible_targets_camp = ['acquisition_cost', 'cost', 'budget', 'amount_spent', 'actual_cost']
target_camp = next((c for c in df_camp.columns if c.lower() in possible_targets_camp), None)

if not target_camp:
    target_camp = df_camp.columns[-1]
    print(f"⚠️ Warning: Could not find 'Cost' column. Using last column: '{target_camp}'")
else:
    print(f"🎯 Campaign Target Detected: '{target_camp}'")

# ==========================================
# 4. TRAIN MODEL A: COST PREDICTOR
# ==========================================
print("\n🤖 Training Cost Model (Random Forest)...")
# Drop non-numeric (if any remain) and target
X_cost = df_camp.select_dtypes(include=[np.number]).drop(columns=[target_camp], errors='ignore')
y_cost = df_camp[target_camp]

Xc_train, Xc_test, yc_train, yc_test = train_test_split(X_cost, y_cost, test_size=0.3, random_state=42)
model_cost = RandomForestRegressor(n_estimators=50, random_state=42)
model_cost.fit(Xc_train, yc_train)

# ==========================================
# 5. TRAIN MODEL B: CONVERSION PREDICTOR
# ==========================================
print("🤖 Training Conversion Model (Random Forest)...")
X_rate = df_ads.select_dtypes(include=[np.number]).drop(columns=[target_ads], errors='ignore')
y_rate = df_ads[target_ads]

Xr_train, Xr_test, yr_train, yr_test = train_test_split(X_rate, y_rate, test_size=0.3, random_state=42)
model_rate = RandomForestClassifier(n_estimators=50, random_state=42)
model_rate.fit(Xr_train, yr_train)

# ==========================================
# 6. SIMULATION: THE BLIND ZIPPER
# ==========================================
print("\n🔗 Zipping datasets to create Bidding Opportunities...")

# Predict on the TEST sets (unseen data)
pred_costs = model_cost.predict(Xc_test)
pred_rates = model_rate.predict_proba(Xr_test)[:, 1] # Probability of "1"

# Create the Simulation Table
min_len = min(len(pred_costs), len(pred_rates))
simulation_data = pd.DataFrame({
    'Opportunity_ID': range(min_len),
    'Predicted_Overcost': pred_costs[:min_len],
    'Predicted_Prob': pred_rates[:min_len]
})
print(f"✅ Created {min_len} bidding scenarios.")

# ==========================================
# 7. GENETIC ALGORITHM (ROI OPTIMIZER)
# ==========================================
print("\n🧬 Starting Genetic Algorithm Optimization...")

POP_SIZE = 50
GENERATIONS = 30
costs = simulation_data['Predicted_Overcost'].values
probs = simulation_data['Predicted_Prob'].values
n_items = len(simulation_data)

# ==========================================
# REVISED FITNESS FUNCTION: MAXIMIZE PROFIT
# ==========================================
def fitness(chromosome):
    mask = np.array(chromosome) == 1
    if not any(mask): return 0
    
    total_cost = np.sum(costs[mask])
    
    # 1. Hard Budget Constraint
    if total_cost > BUDGET:
        return -10000 # Heavy penalty to kill this solution immediately
    
    # 2. Calculate Revenue
    expected_revenue = np.sum(probs[mask] * REVENUE_PER_CONV)
    
    # 3. GOAL: Maximize Net Profit (Revenue - Cost)
    # This forces the AI to spend more money as long as it makes a profit.
    net_profit = expected_revenue - total_cost
    
    return net_profit
# Init Population
population = [np.random.randint(0, 2, n_items).tolist() for _ in range(POP_SIZE)]

for gen in range(GENERATIONS):
    scores = [fitness(ind) for ind in population]
    
    # Sort and Print
    sorted_pop = [x for _, x in sorted(zip(scores, population), key=lambda pair: pair[0], reverse=True)]
    best_score = max(scores)
    
    if gen % 10 == 0:
        print(f"   Gen {gen}: Best ROI = {best_score*100:.1f}%")
    
    # Selection (Top 20%)
    top_pop = sorted_pop[:int(POP_SIZE * 0.2)]
    
    # Crossover & Mutation
    while len(top_pop) < POP_SIZE:
        p1, p2 = random.sample(top_pop, 2)
        cut = random.randint(1, n_items-1)
        child = p1[:cut] + p2[cut:]
        if random.random() < 0.1: # Mutation
            m_idx = random.randint(0, n_items-1)
            child[m_idx] = 1 - child[m_idx]
        top_pop.append(child)
    
    population = top_pop

# ==========================================
# 8. RESULTS
# ==========================================
best_strategy = population[0]
final_cost = np.sum(costs[np.array(best_strategy)==1])
final_rev = np.sum(probs[np.array(best_strategy)==1] * REVENUE_PER_CONV)
final_roi = (final_rev - final_cost) / final_cost if final_cost > 0 else 0

print("\n" + "="*40)
print("🚀 OPTIMIZATION COMPLETE")
print("="*40)
print(f"💰 Total Spend:  €{final_cost:.2f} (Limit: €{BUDGET})")
print(f"💵 Exp. Revenue: €{final_rev:.2f}")
print(f"📈 FINAL ROI:    {final_roi*100:.2f}%")
print("="*40)

# Save
simulation_data['Bid_Action'] = best_strategy[:min_len]
simulation_data.to_csv('final_bidding_strategy.csv', index=False)
print("✅ Strategy saved to 'final_bidding_strategy.csv'")