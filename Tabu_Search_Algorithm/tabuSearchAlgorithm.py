# tabu_search_core.py
import numpy as np
import random
from copy import deepcopy
from typing import List, Dict, Tuple, Optional, Set
from collections import deque

from Classes.models import Campaign, Ad
from Genetic_Algorithm.geneticAlgorithm import Individual, DataManager, FitnessEvaluator, print_solution_details


# ============================================================================
# TABU SEARCH SPECIFIC STRUCTURES
# ============================================================================

class TabuList:
    """
    Manages the tabu list to prevent cycling back to recently visited solutions.
    Uses a deque for efficient FIFO operations.
    """
    
    def __init__(self, max_size: int):
        self.max_size = max_size
        self.tabu_moves = deque(maxlen=max_size)
        self.tabu_solutions = set()  # Hash of complete solutions
        
    def add_move(self, move: Tuple):
        """
        Add a move to the tabu list.
        Move format: (ad_id, from_campaign, to_campaign)
        """
        self.tabu_moves.append(move)
        
    def add_solution(self, individual: Individual):
        """Add a solution signature to prevent revisiting"""
        signature = self._get_solution_signature(individual)
        self.tabu_solutions.add(signature)
        
        # Limit solution memory to prevent unbounded growth
        if len(self.tabu_solutions) > self.max_size * 10:
            # Remove oldest half
            self.tabu_solutions = set(list(self.tabu_solutions)[self.max_size * 5:])
    
    def is_tabu_move(self, move: Tuple) -> bool:
        """Check if a move is in the tabu list"""
        return move in self.tabu_moves
    
    def is_tabu_solution(self, individual: Individual) -> bool:
        """Check if a solution has been visited recently"""
        signature = self._get_solution_signature(individual)
        return signature in self.tabu_solutions
    
    def _get_solution_signature(self, individual: Individual) -> Tuple:
        """Create a hashable signature for a solution"""
        return tuple(sorted(
            (cid, tuple(sorted(ad_ids))) 
            for cid, ad_ids in individual.allocation.items()
        ))
    
    def clear(self):
        """Clear the tabu list"""
        self.tabu_moves.clear()
        self.tabu_solutions.clear()


# ============================================================================
# NEIGHBORHOOD GENERATION
# ============================================================================

class NeighborhoodGenerator:
    """
    Generates neighbor solutions through various move strategies.
    """
    
    def __init__(self, data_manager: DataManager):
        self.data_manager = data_manager
        self.campaign_ids = data_manager.campaign_ids
        self.ad_ids = data_manager.ad_ids
    
    def generate_neighbors(self, 
                          current: Individual, 
                          tabu_list: TabuList,
                          num_neighbors: int = 20,
                          use_aspiration: bool = True,
                          best_fitness: float = float('-inf')) -> List[Tuple[Individual, Tuple]]:
        """
        Generate neighbor solutions using different move strategies.
        Returns list of (neighbor, move) tuples.
        """
        neighbors = []
        move_strategies = ['single_move', 'swap', 'multi_move']
        
        attempts = 0
        max_attempts = num_neighbors * 3
        
        while len(neighbors) < num_neighbors and attempts < max_attempts:
            attempts += 1
            strategy = random.choice(move_strategies)
            
            if strategy == 'single_move':
                neighbor, move = self._single_ad_move(current)
            elif strategy == 'swap':
                neighbor, move = self._swap_ads(current)
            else:  # multi_move
                neighbor, move = self._multi_ad_move(current)
            
            if neighbor is None:
                continue
            
            # Check if move is tabu
            if tabu_list.is_tabu_move(move):
                # Aspiration criterion: accept tabu move if it's better than best known
                if use_aspiration and neighbor.fitness > best_fitness:
                    neighbors.append((neighbor, move))
                # Otherwise skip this tabu move
                continue
            else:
                neighbors.append((neighbor, move))
        
        return neighbors
    
    def _single_ad_move(self, current: Individual) -> Tuple[Optional[Individual], Optional[Tuple]]:
        """Move a single ad from one campaign to another"""
        allocation = deepcopy(current.allocation)
        
        # Find campaigns with more than 1 ad (can donate)
        source_campaigns = [cid for cid in self.campaign_ids if len(allocation[cid]) > 1]
        
        if not source_campaigns:
            return None, None
        
        source_cid = random.choice(source_campaigns)
        target_cid = random.choice([c for c in self.campaign_ids if c != source_cid])
        
        ad_to_move = random.choice(allocation[source_cid])
        
        # Perform move
        allocation[source_cid].remove(ad_to_move)
        allocation[target_cid].append(ad_to_move)
        
        neighbor = Individual(allocation=allocation)
        move = (ad_to_move, source_cid, target_cid)
        
        return neighbor, move
    
    def _swap_ads(self, current: Individual) -> Tuple[Optional[Individual], Optional[Tuple]]:
        """Swap ads between two campaigns"""
        allocation = deepcopy(current.allocation)
        
        # Select two different campaigns with ads
        campaigns_with_ads = [cid for cid in self.campaign_ids if allocation[cid]]
        
        if len(campaigns_with_ads) < 2:
            return None, None
        
        camp1, camp2 = random.sample(campaigns_with_ads, 2)
        
        ad1 = random.choice(allocation[camp1])
        ad2 = random.choice(allocation[camp2])
        
        # Perform swap
        allocation[camp1].remove(ad1)
        allocation[camp2].remove(ad2)
        allocation[camp1].append(ad2)
        allocation[camp2].append(ad1)
        
        neighbor = Individual(allocation=allocation)
        move = ('swap', ad1, camp1, ad2, camp2)
        
        return neighbor, move
    
    def _multi_ad_move(self, current: Individual) -> Tuple[Optional[Individual], Optional[Tuple]]:
        """Move multiple ads (2-3) in a single move"""
        allocation = deepcopy(current.allocation)
        
        num_moves = random.randint(2, 3)
        moves_made = []
        
        for _ in range(num_moves):
            source_campaigns = [cid for cid in self.campaign_ids if len(allocation[cid]) > 1]
            
            if not source_campaigns:
                break
            
            source_cid = random.choice(source_campaigns)
            target_cid = random.choice([c for c in self.campaign_ids if c != source_cid])
            
            ad_to_move = random.choice(allocation[source_cid])
            
            allocation[source_cid].remove(ad_to_move)
            allocation[target_cid].append(ad_to_move)
            
            moves_made.append((ad_to_move, source_cid, target_cid))
        
        if not moves_made:
            return None, None
        
        neighbor = Individual(allocation=allocation)
        move = ('multi', tuple(moves_made))
        
        return neighbor, move


# ============================================================================
# TABU SEARCH ALGORITHM
# ============================================================================

class TabuSearch:
    """
    Tabu Search algorithm for optimizing ad allocation to campaigns.
    """
    
    def __init__(self,
                 max_iterations: int,
                 tabu_tenure: int,
                 neighborhood_size: int,
                 fitness_evaluator: FitnessEvaluator,
                 data_manager: DataManager,
                 use_aspiration: bool = True,
                 intensification_threshold: int = 50,
                 diversification_threshold: int = 100):
        
        self.max_iterations = max_iterations
        self.tabu_tenure = tabu_tenure
        self.neighborhood_size = neighborhood_size
        self.fitness_evaluator = fitness_evaluator
        self.data_manager = data_manager
        self.use_aspiration = use_aspiration
        self.intensification_threshold = intensification_threshold
        self.diversification_threshold = diversification_threshold
        
        self.campaign_ids = data_manager.campaign_ids
        self.ad_ids = data_manager.ad_ids
        self.num_campaigns = len(self.campaign_ids)
        self.num_ads = len(self.ad_ids)
        
        self.tabu_list = TabuList(max_size=tabu_tenure)
        self.neighborhood_gen = NeighborhoodGenerator(data_manager)
        
        self.current_solution: Individual = None
        self.best_solution: Individual = None
        self.history = []
        self.iterations_without_improvement = 0
    
    def create_initial_solution(self) -> Individual:
        """Create an initial random solution"""
        allocation = {cid: [] for cid in self.campaign_ids}
        available_ads = self.ad_ids.copy()
        random.shuffle(available_ads)
        
        if not self.campaign_ids or not self.ad_ids:
            raise ValueError("Cannot create allocation with no campaigns or ads.")
        
        if len(self.campaign_ids) > len(available_ads):
            raise ValueError(f"Not enough ads ({len(available_ads)}) to assign at least one to each campaign ({len(self.campaign_ids)}).")
        
        # Assign one ad to each campaign first
        temp_ads_for_init = available_ads[:self.num_campaigns]
        remaining_ads = available_ads[self.num_campaigns:]
        
        for i, cid in enumerate(self.campaign_ids):
            allocation[cid].append(temp_ads_for_init[i])
        
        # Distribute remaining ads randomly
        for ad_id in remaining_ads:
            random_campaign = random.choice(self.campaign_ids)
            allocation[random_campaign].append(ad_id)
        
        individual = Individual(allocation=allocation)
        self.fitness_evaluator.evaluate(individual)
        
        return individual
    
    def intensification(self):
        """
        Intensification: explore more thoroughly around the best solution.
        Temporarily reduce neighborhood size and tabu tenure.
        """
        print(f"  [Intensification triggered at iteration {len(self.history)}]")
        
        # Start from best solution
        self.current_solution = deepcopy(self.best_solution)
        
        # Reduce parameters for focused search
        original_neighborhood = self.neighborhood_size
        original_tenure = self.tabu_tenure
        
        self.neighborhood_size = max(10, self.neighborhood_size // 2)
        self.tabu_tenure = max(5, self.tabu_tenure // 2)
        
        # Perform several iterations of focused search
        for _ in range(10):
            self._perform_iteration()
        
        # Restore parameters
        self.neighborhood_size = original_neighborhood
        self.tabu_tenure = original_tenure
        self.tabu_list.max_size = original_tenure
    
    def diversification(self):
        """
        Diversification: jump to a different region of the solution space.
        Perform significant random modifications to current solution.
        """
        print(f"  [Diversification triggered at iteration {len(self.history)}]")
        
        allocation = deepcopy(self.current_solution.allocation)
        
        # Randomly move 20-30% of ads to different campaigns
        num_moves = int(0.2 * self.num_ads) + random.randint(0, int(0.1 * self.num_ads))
        
        for _ in range(num_moves):
            source_campaigns = [cid for cid in self.campaign_ids if len(allocation[cid]) > 1]
            
            if not source_campaigns:
                break
            
            source_cid = random.choice(source_campaigns)
            target_cid = random.choice([c for c in self.campaign_ids if c != source_cid])
            
            ad_to_move = random.choice(allocation[source_cid])
            allocation[source_cid].remove(ad_to_move)
            allocation[target_cid].append(ad_to_move)
        
        self.current_solution = Individual(allocation=allocation)
        self.fitness_evaluator.evaluate(self.current_solution)
        
        # Clear tabu list to allow fresh exploration
        self.tabu_list.clear()
        
        # Reset stagnation counter
        self.iterations_without_improvement = 0
    
    def _perform_iteration(self):
        """Perform a single iteration of tabu search"""
        # Generate neighbors
        neighbors = self.neighborhood_gen.generate_neighbors(
            current=self.current_solution,
            tabu_list=self.tabu_list,
            num_neighbors=self.neighborhood_size,
            use_aspiration=self.use_aspiration,
            best_fitness=self.best_solution.fitness if self.best_solution else float('-inf')
        )
        
        if not neighbors:
            # If no neighbors generated, do a random restart
            print("  [No valid neighbors, performing random restart]")
            self.current_solution = self.create_initial_solution()
            return
        
        # Evaluate all neighbors
        for neighbor, move in neighbors:
            if neighbor.validate(self.campaign_ids, self.ad_ids):
                self.fitness_evaluator.evaluate(neighbor)
        
        # Select best non-tabu neighbor (or best tabu if aspiration criterion met)
        valid_neighbors = [(n, m) for n, m in neighbors 
                          if n.validate(self.campaign_ids, self.ad_ids)]
        
        if not valid_neighbors:
            return
        
        best_neighbor, best_move = max(valid_neighbors, key=lambda x: x[0].fitness)
        
        # Update current solution
        self.current_solution = best_neighbor
        
        # Add move to tabu list
        self.tabu_list.add_move(best_move)
        self.tabu_list.add_solution(best_neighbor)
        
        # Update best solution if improved
        if self.best_solution is None or best_neighbor.fitness > self.best_solution.fitness:
            self.best_solution = deepcopy(best_neighbor)
            self.iterations_without_improvement = 0
        else:
            self.iterations_without_improvement += 1
    
    def run(self, verbose: bool = True):
        """Execute the complete tabu search optimization process"""
        print("Inicializando solução inicial para Tabu Search...")
        
        try:
            self.current_solution = self.create_initial_solution()
            self.best_solution = deepcopy(self.current_solution)
        except ValueError as e:
            print(f"FATAL TABU SEARCH ERROR: {e}")
            return None
        
        if verbose:
            print(f"\nExecutando {self.max_iterations} iterações do Tabu Search...")
            print(f"Campanhas: {self.num_campaigns}, Anúncios: {self.num_ads}")
            print(f"Tabu Tenure: {self.tabu_tenure}, Neighborhood Size: {self.neighborhood_size}")
            print("-" * 70)
        
        for iteration in range(self.max_iterations):
            self._perform_iteration()
            
            # Record history
            self.history.append({
                'iteration': iteration,
                'best_fitness': self.best_solution.fitness,
                'best_roi': self.best_solution.total_roi,
                'best_cost': self.best_solution.total_cost,
                'current_fitness': self.current_solution.fitness,
                'current_roi': self.current_solution.total_roi,
                'iterations_without_improvement': self.iterations_without_improvement
            })
            
            # Intensification: if making good progress, focus search
            if (self.iterations_without_improvement > 0 and 
                self.iterations_without_improvement % self.intensification_threshold == 0):
                self.intensification()
            
            # Diversification: if stuck, jump to new region
            if self.iterations_without_improvement >= self.diversification_threshold:
                self.diversification()
            
            if verbose and (iteration % 10 == 0 or iteration == self.max_iterations - 1):
                print(f"Iter {iteration:3d} | "
                      f"Best ROI: {self.best_solution.total_roi:7.2%} | "
                      f"Fitness: {self.best_solution.fitness:8.3f} | "
                      f"Cost: ${self.best_solution.total_cost:,.0f} | "
                      f"Current ROI: {self.current_solution.total_roi:7.2%} | "
                      f"No Improve: {self.iterations_without_improvement}")
        
        if verbose:
            print("-" * 70)
        
        return self.best_solution


# ============================================================================
# ORCHESTRATOR FUNCTION
# ============================================================================

def run_tabu_search_optimization(
    campaigns: List[Campaign],
    ads: List[Ad],
    max_iterations: int,
    tabu_tenure: int,
    neighborhood_size: int,
    total_budget: float,
    risk_factor: float,
    use_aspiration: bool = True,
    intensification_threshold: int = 50,
    diversification_threshold: int = 100,
    verbose: bool = True
) -> Optional[Individual]:
    """
    Orchestrates the entire Tabu Search optimization process.
    
    Args:
        campaigns: List of campaigns with predicted values
        ads: List of ads with predicted values
        max_iterations: Maximum number of iterations
        tabu_tenure: Length of tabu list (how long moves stay tabu)
        neighborhood_size: Number of neighbors to generate per iteration
        total_budget: Total budget constraint
        risk_factor: Risk factor for fitness calculation
        use_aspiration: Whether to use aspiration criterion
        intensification_threshold: Iterations before intensification
        diversification_threshold: Iterations before diversification
        verbose: Whether to print progress
    
    Returns:
        Best solution found (Individual) or None if failed
    """
    if not campaigns or not ads:
        print("Error: Campaigns or Ads lists are empty. Cannot run Tabu Search.")
        return None
    
    # Initialize components
    data_manager = DataManager(campaigns, ads)
    
    if not data_manager.campaign_ids or not data_manager.ad_ids:
        print("Error: No valid campaigns or ads found after processing for Tabu Search.")
        return None
    
    fitness_evaluator = FitnessEvaluator(
        data_manager=data_manager,
        total_budget=total_budget,
        risk_factor=risk_factor
    )
    
    tabu_search = TabuSearch(
        max_iterations=max_iterations,
        tabu_tenure=tabu_tenure,
        neighborhood_size=neighborhood_size,
        fitness_evaluator=fitness_evaluator,
        data_manager=data_manager,
        use_aspiration=use_aspiration,
        intensification_threshold=intensification_threshold,
        diversification_threshold=diversification_threshold
    )
    
    # Run Tabu Search
    print("\n--- Tabu Search Orchestrator: Running Tabu Search ---")
    best_solution = tabu_search.run(verbose=verbose)
    
    if best_solution:
        print("\n--- Tabu Search Orchestrator: Best solution details ---")
        print_solution_details(best_solution, data_manager)
    else:
        print("\n--- Tabu Search Orchestrator: Tabu Search failed to find a solution ---")
    
    return best_solution