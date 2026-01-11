import numpy as np
import pandas as pd
import joblib
import random
import glob
import os

class GeneticOptimizer:
    def __init__(self, user_model_path, market_model_path):
        """
        Initializes the GA with the trained models.
        """
        print("🧬 Initializing Genetic Optimizer...")
        print(f"   Loading User Model: {os.path.basename(user_model_path)}")
        self.user_model = joblib.load(user_model_path)
        
        print(f"   Loading Market Model: {os.path.basename(market_model_path)}")
        self.market_model = joblib.load(market_model_path)
        
        # Extract feature names the models expect
        # This is critical to ensure we feed the model the exact columns it trained on
        self.user_features = self.user_model.feature_names_in_
        self.market_features = self.market_model.feature_names_in_
        
        print("✅ Models Loaded Successfully.")

    def create_genome(self):
        """
        Creates a random 'Bidding Strategy' (Individual).
        """
        return {
            'approved_budget': random.randint(1000, 50000),  # Random budget
            'campaign_duration': random.randint(1, 30),      # Days
            'Platform': random.choice(['Facebook', 'Instagram', 'Pinterest', 'Twitter']),
            'Category': random.choice(['Technology', 'Fashion', 'Fitness', 'Food']),
            # Fixed User Profile assumptions (Target Audience)
            'User_Age': 30, 
            'User_Time_Spent': 15
        }

    def decode_genome_to_dataframe(self, genome, feature_columns):
        """
        Converts the genome dict into a DataFrame that matches the model's expected One-Hot features.
        """
        # 1. Create a zero-filled DF with the exact model columns
        df = pd.DataFrame(0, index=[0], columns=feature_columns)
        
        # 2. Map Numerical & Categorical Values
        for key, value in genome.items():
            # Clean the key name to match training sanitation (removing special chars)
            clean_key = "".join(c if c.isalnum() else "_" for c in str(key))
            
            # If it's a direct match (like 'approved_budget'), set it
            if clean_key in df.columns:
                df[clean_key] = value
                
            # If it's categorical, we need to find the One-Hot column (e.g., Platform_Facebook)
            else:
                # Construct the potential One-Hot name
                one_hot_col = f"{clean_key}_{value}"
                # Sanitize that too
                one_hot_col = "".join(c if c.isalnum() else "_" for c in one_hot_col)
                
                if one_hot_col in df.columns:
                    df[one_hot_col] = 1
                    
        return df

    def fitness_function(self, genome):
        """
        Calculates the ROI (Profit) of a specific strategy.
        Fitness = (Revenue) - (Real Cost)
        """
        # --- 1. Predict Market Efficiency (Engine B) ---
        market_df = self.decode_genome_to_dataframe(genome, self.market_features)
        
        # Predict Overcost (Positive = Under Budget, Negative = Over Budget)
        pred_overcost = self.market_model.predict(market_df)[0]
        
        # Real Cost = Budget - Overcost
        estimated_cost = genome['approved_budget'] - pred_overcost
        estimated_cost = max(estimated_cost, 10.0) # Prevent impossible negative cost

        # --- 2. Predict User Conversion (Engine A) ---
        user_df = self.decode_genome_to_dataframe(genome, self.user_features)
        conversion_rate = self.user_model.predict(user_df)[0]
        
        # Clip to realistic probability (0 to 1)
        conversion_rate = np.clip(conversion_rate, 0, 1)

        # --- 3. Calculate Score (ROI) ---
        # Assumption: Average Value of a Sale is higher to make the math work with low probabilities
        AVG_SALE_VALUE = 200 
        
        # Estimated Reach: $2 CPM (Cost Per Mille) assumption -> 500 views per $1
        estimated_reach = estimated_cost * 0.5 
        
        expected_conversions = estimated_reach * conversion_rate
        expected_revenue = expected_conversions * AVG_SALE_VALUE
        
        profit = expected_revenue - estimated_cost
        
        return profit

    def run_evolution(self, generations=10, population_size=20):
        """
        Main loop to evolve the best strategy.
        """
        # 1. Initialize Population
        population = [self.create_genome() for _ in range(population_size)]
        
        best_solution = None
        best_fitness = -float('inf')

        print(f"\n🚀 Starting Evolution ({generations} gens)...")

        for gen in range(generations):
            # Evaluate Fitness
            scores = [(genome, self.fitness_function(genome)) for genome in population]
            
            # Sort by Fitness (Descending)
            scores.sort(key=lambda x: x[1], reverse=True)
            
            # Track Best
            current_best_genome, current_best_score = scores[0]
            if current_best_score > best_fitness:
                best_fitness = current_best_score
                best_solution = current_best_genome
            
            print(f"Gen {gen+1}: Profit ${current_best_score:,.2f} | Strat: {current_best_genome['Platform']} / {current_best_genome['Category']}")
            
            # Selection: Keep top 50%
            survivors = [s[0] for s in scores[:population_size//2]]
            
            # Crossover & Mutation (Fill the rest)
            new_population = survivors[:]
            while len(new_population) < population_size:
                parent = random.choice(survivors)
                child = parent.copy()
                
                # Mutation: 30% chance to change a gene
                if random.random() < 0.3: 
                    mutation_key = random.choice(list(child.keys()))
                    dummy = self.create_genome() # Get a random gene from a fresh individual
                    child[mutation_key] = dummy[mutation_key]
                
                new_population.append(child)
            
            population = new_population

        print("\n🏆 Evolution Complete!")
        print(f"Best Strategy Found: {best_solution}")
        print(f"Expected Profit: ${best_fitness:,.2f}")
        return best_solution

# --- MAIN EXECUTION BLOCK ---
if __name__ == "__main__":
    
    # 1. Get the path of THIS script file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Look for models in ../models relative to this script
    models_dir = os.path.join(current_dir, "..", "models")
    
    print(f"🔎 Looking for models in: {models_dir}")

    try:
        # Search for files
        user_model_files = glob.glob(os.path.join(models_dir, "Engine_A_User_*.joblib"))
        market_model_files = glob.glob(os.path.join(models_dir, "Engine_B_Market_*.joblib"))
        
        if not user_model_files:
            raise FileNotFoundError("❌ Missing User Model (Engine A). Please run 'Train_User_Engine.ipynb' first.")
        
        if not market_model_files:
            raise FileNotFoundError("❌ Missing Market Model (Engine B). Please run 'Train_Market_Engine.ipynb' first.")

        # Pick the most recent ones
        user_model_files.sort()
        market_model_files.sort()
        
        u_path = user_model_files[-1]
        m_path = market_model_files[-1]
        
        optimizer = GeneticOptimizer(u_path, m_path)
        optimizer.run_evolution()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")