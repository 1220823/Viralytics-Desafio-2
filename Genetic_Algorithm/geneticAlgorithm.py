# genetic_algorithm_core.py
import numpy as np
import random
from copy import deepcopy
from typing import List, Dict, Tuple, Optional

from Classes.models import Campaign, Ad 

from pydantic.dataclasses import dataclass
from dataclasses import field   

# ============================================================================
# 1. ESTRUTURAS DE DADOS
# ============================================================================

@dataclass
class Individual:
    """
    Represents a complete allocation solution.
    
    Attributes:
        allocation: Dict mapping campaign_id to list of ad_ids
        fitness: Calculated fitness score
        total_roi: Overall return on investment
        total_cost: Total media cost
        total_revenue: Total revenue generated
        campaign_metrics: Detailed metrics per campaign
    
    Constraints:
        - Each campaign must have at least 1 ad
        - All ads must be distributed exactly once
    """
    allocation: Dict[int, List[int]]  # campaign_id -> [ad_ids]
    
    # Métricas calculadas
    fitness: float = 0.0
    total_roi: float = 0.0
    total_cost: float = 0.0
    total_revenue: float = 0.0
    campaign_metrics: Dict[int, dict] = field(default_factory=dict)
    
    def get_all_ad_ids(self) -> List[int]:
        """Returns all ad IDs in the allocation"""
        return [ad_id for ads in self.allocation.values() for ad_id in ads]
    
    def validate(self, all_campaign_ids: List[int], all_ad_ids: List[int]) -> bool:
        """Validates allocation meets all constraints"""
        if not all_campaign_ids or not all_ad_ids: # Handle empty input gracefully
            return False

        # All campaigns must be present in the allocation keys
        if set(self.allocation.keys()) != set(all_campaign_ids):
            return False
        
        # Each campaign must have at least 1 ad
        if any(len(ads) == 0 for ads in self.allocation.values()):
            return False
        
        # All ads must be distributed exactly once
        allocated_ads = self.get_all_ad_ids()
        
        # Check if all ads are covered (length and set equality)
        if len(allocated_ads) != len(all_ad_ids) or set(allocated_ads) != set(all_ad_ids):
            return False
        
        # Check for duplicates within the allocation
        if len(set(allocated_ads)) != len(allocated_ads):
            return False
        
        return True


# ============================================================================
# 2. DATA MANAGER
# ============================================================================

class DataManager:
    """Manages campaign and ad data with efficient lookup"""
    
    def __init__(self, campaigns: List[Campaign], ads: List[Ad]):
        self.campaigns_dict = {c.id: c for c in campaigns}
        self.ads_dict = {a.id: a for a in ads}
        self.campaign_ids = list(self.campaigns_dict.keys())
        self.ad_ids = list(self.ads_dict.keys())
    
    def get_campaign(self, campaign_id: int) -> Campaign:
        return self.campaigns_dict[campaign_id]
    
    def get_ad(self, ad_id: int) -> Ad:
        return self.ads_dict[ad_id]


# ============================================================================
# 4. FUNÇÃO DE FITNESS (FOCO EM ROI)
# ============================================================================

class FitnessEvaluator:
    """
    Evaluates solution fitness focusing on ROI maximization.
    Uses predicted overcost and conversion_rate values from Campaign/Ad objects.
    """
    
    def __init__(self, 
                 data_manager: DataManager,
                 total_budget: float,
                 risk_factor: float = 0.0):
        self.data_manager = data_manager
        self.total_budget = total_budget
        self.risk_factor = risk_factor 
    
    def evaluate(self, individual: Individual) -> float:
        """
        Calculates fitness score based on ROI, budget constraints, and balance.
        
        Fitness = 0.7*Total_ROI + 0.3*Avg_Campaign_ROI + Balance_Penalty + Budget_Terms
        """
        
        total_cost = 0.0  # Total cost for budget penalty (includes approved budget + overcost + ads)
        total_media_cost = 0.0  # Total media cost for ROI calculation (only media costs)
        total_media_revenue = 0.0
        campaign_metrics = {}
        
        for campaign_id, ad_ids in individual.allocation.items():
            campaign = self.data_manager.get_campaign(campaign_id)
            
            # Overcost is relative to approved_budget
            campaign_approved_budget = campaign.approved_budget
            campaign_overcost_amount = campaign.overcost 
            
            # Budget cost for constraint checking (approved budget + overcost)
            campaign_budget_cost = campaign_approved_budget + campaign_overcost_amount
            
            # Media cost for ROI calculation (only actual media spending)
            campaign_media_cost = campaign.media_cost_usd
            
            campaign_revenue = 0.0
            campaign_ads_cost = 0.0
            conversion_rates_for_campaign = []
            
            if not ad_ids:
                continue

            for ad_id in ad_ids:
                ad = self.data_manager.get_ad(ad_id)
                
                conversion_rate = ad.conversion_rate
                conversion_rates_for_campaign.append(conversion_rate)
                
                # Distribute campaign clicks equally among ads
                ad_share = 1.0 / len(ad_ids)
                expected_clicks = campaign.clicks * ad_share
                
                # Ensure at least 1 click for calculation purposes
                expected_clicks = max(expected_clicks, 1)
                expected_conversions = expected_clicks * conversion_rate
                
                # Ad cost = clicks × cost per click
                ad_cost = expected_clicks * ad.cost_per_click
                campaign_ads_cost += ad_cost
                
                # Revenue = conversions × value per conversion
                # Value per conversion = CPC × ROI (ROI represents value multiplier)
                estimated_value_per_conversion = ad.cost_per_click * ad.roi
                ad_revenue = expected_conversions * estimated_value_per_conversion
                
                campaign_revenue += ad_revenue
            
            # Cost for budget constraint = budget cost + ad spending
            campaign_total_cost = campaign_budget_cost + campaign_ads_cost
            
            # Cost for ROI = only media costs (campaign media + ad spending)
            campaign_total_media_cost = campaign_media_cost + campaign_ads_cost
            
            # Calculate ROI for this campaign using only media costs
            campaign_roi = ((campaign_revenue - campaign_total_media_cost) / 
                           campaign_total_media_cost if campaign_total_media_cost > 0 else 0)
            
            total_cost += campaign_total_cost
            total_media_cost += campaign_total_media_cost
            total_media_revenue += campaign_revenue
            
            campaign_metrics[campaign_id] = {
                'cost': campaign_total_media_cost,  # Show media-based cost in metrics
                'revenue': campaign_revenue,
                'roi': campaign_roi,
                'overcost': campaign_overcost_amount,
                'budget_cost': campaign_budget_cost,
                'media_cost': campaign_media_cost,
                'ads_cost': campaign_ads_cost,
                'approved_budget': campaign_approved_budget,
                'avg_conversion_rate': np.mean(conversion_rates_for_campaign) if conversion_rates_for_campaign else 0,
                'n_ads': len(ad_ids)
            }
        
        # Calculate ROI using only media costs
        if total_media_cost > 0:
            total_roi = (total_media_revenue - total_media_cost) / total_media_cost
        else:
            total_roi = 0.0
        
        # Calculate weighted average of campaign ROIs (encourages balanced performance)
        campaign_roi_values = [metrics['roi'] for metrics in campaign_metrics.values()]
        avg_campaign_roi = np.mean(campaign_roi_values) if campaign_roi_values else 0.0
        
        
        # Balance penalty: penalize uneven distribution of ads
        allocation_sizes = [len(ad_ids) for ad_ids in individual.allocation.values()]
        if len(allocation_sizes) > 1:
            std_dev = np.std(allocation_sizes)
            mean_size = np.mean(allocation_sizes)
            balance_penalty = - self.risk_factor * (std_dev / mean_size if mean_size > 0 else 0)
        else:
            balance_penalty = 0.0
        
        # Budget penalty uses full budget (approved budget + overcost + ads)
        budget_penalty = 0.0
        if total_cost > self.total_budget:
            excess_ratio = (total_cost - self.total_budget) / self.total_budget
            budget_penalty = -10.0 * excess_ratio
        
        # Budget bonus also based on full budget constraint
        #budget_usage = total_cost / self.total_budget if self.total_budget > 0 else 0
        #if budget_usage > 0.85 and budget_usage <= 1.0:
            #budget_bonus = 0.5 * budget_usage
       # else:
            #budget_bonus = 0.0

        budget_bonus = 0.0
        
        # Combined fitness: 70% total ROI + 30% average campaign ROI + balance penalty
        fitness = (0.7 * total_roi + 0.3 * avg_campaign_roi + 
                   balance_penalty + budget_penalty + budget_bonus)
        
        individual.fitness = fitness
        individual.total_roi = total_roi
        individual.total_cost = total_media_cost  # Store media-based cost for ROI tracking
        individual.total_revenue = total_media_revenue
        individual.campaign_metrics = campaign_metrics
        
        return fitness


# ============================================================================
# 5. ALGORITMO GENÉTICO
# ============================================================================

class GeneticAlgorithm:
    """Genetic Algorithm for optimizing ad allocation to campaigns"""
    
    def __init__(self,
                 population_size: int,
                 max_generations: int,
                 mutation_rate: float,
                 crossover_rate: float,
                 fitness_evaluator: FitnessEvaluator,
                 data_manager: DataManager):
        
        self.population_size = population_size
        self.max_generations = max_generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.fitness_evaluator = fitness_evaluator
        self.data_manager = data_manager
        
        self.campaign_ids = data_manager.campaign_ids
        self.ad_ids = data_manager.ad_ids
        self.num_campaigns = len(self.campaign_ids)
        self.num_ads = len(self.ad_ids)
        
        self.population: List[Individual] = []
        self.best_individual: Individual = None
        self.history = []
        self.generations_without_improvement = 0  # Track stagnation
        self.best_fitness_ever = float('-inf')
        self.diversity_threshold = 0.1  # Diversity threshold for triggering forced exploration
    
    def create_random_allocation(self) -> Dict[int, List[int]]:
        """
        Creates a valid random allocation ensuring:
        - Each campaign receives at least 1 ad
        - All ads are distributed
        """
        allocation = {cid: [] for cid in self.campaign_ids}
        available_ads = self.ad_ids.copy()
        random.shuffle(available_ads)
        
        if not self.campaign_ids or not self.ad_ids:
            raise ValueError("Cannot create allocation with no campaigns or ads.")

        if len(self.campaign_ids) > len(available_ads):
            raise ValueError(f"Not enough ads ({len(available_ads)}) to assign at least one to each campaign ({len(self.campaign_ids)}).")

        temp_ads_for_init = available_ads[:self.num_campaigns]
        remaining_ads = available_ads[self.num_campaigns:]
        
        for i, cid in enumerate(self.campaign_ids):
            allocation[cid].append(temp_ads_for_init[i])
        
        for ad_id in remaining_ads:
            random_campaign = random.choice(self.campaign_ids)
            allocation[random_campaign].append(ad_id)
        
        return allocation
    
    def initialize_population(self):
        """Creates initial random population and evaluates fitness"""
        self.population = []
        
        for _ in range(self.population_size):
            try:
                allocation = self.create_random_allocation()
                individual = Individual(allocation=allocation)
                self.fitness_evaluator.evaluate(individual)
                self.population.append(individual)
            except ValueError as e:
                print(f"Skipping individual due to error: {e}")
                if len(self.ad_ids) < len(self.campaign_ids):
                    print("Error: Number of ads is less than number of campaigns. Cannot guarantee one ad per campaign.")
                    break 
        
        if not self.population:
            raise ValueError("Could not initialize any valid individuals. Check input data (e.g., ads vs campaigns count).")

        self.population.sort(key=lambda x: x.fitness, reverse=True)
        self.best_individual = deepcopy(self.population[0])
    
    def selection(self) -> Individual:
        """Tournament selection with balanced selection pressure"""
        tournament_size = 3
        competitors = random.sample(self.population, 
                                   min(tournament_size, len(self.population)))
        return max(competitors, key=lambda x: x.fitness)
    
    def crossover(self, parent1: Individual, parent2: Individual) -> Tuple[Individual, Individual]:
        """
        Multi-strategy crossover with diversity mechanisms.
        Randomly selects from single-point, uniform, or ad-level strategies.
        """
        if random.random() > self.crossover_rate:
            return deepcopy(parent1), deepcopy(parent2)
        
        if self.num_campaigns < 2:
            return deepcopy(parent1), deepcopy(parent2)

        # Randomly choose crossover strategy
        strategy = random.choice(['single_point', 'uniform', 'ad_level'])
        
        if strategy == 'single_point':
            # Single-point crossover
            split_point = random.randint(1, self.num_campaigns - 1)
            campaigns_shuffled = self.campaign_ids.copy()
            random.shuffle(campaigns_shuffled)
            
            group1 = campaigns_shuffled[:split_point]
            group2 = campaigns_shuffled[split_point:]
            
            child1_allocation = {}
            child2_allocation = {}
            
            for cid in group1:
                child1_allocation[cid] = parent1.allocation[cid].copy()
                child2_allocation[cid] = parent2.allocation[cid].copy()
            
            for cid in group2:
                child1_allocation[cid] = parent2.allocation[cid].copy()
                child2_allocation[cid] = parent1.allocation[cid].copy()
        
        elif strategy == 'uniform':
            # Uniform crossover: randomly choose from each parent for each campaign
            child1_allocation = {}
            child2_allocation = {}
            
            for cid in self.campaign_ids:
                if random.random() < 0.5:
                    child1_allocation[cid] = parent1.allocation[cid].copy()
                    child2_allocation[cid] = parent2.allocation[cid].copy()
                else:
                    child1_allocation[cid] = parent2.allocation[cid].copy()
                    child2_allocation[cid] = parent1.allocation[cid].copy()
        
        else:  # ad_level
            # Ad-level crossover: mix ads at individual ad level
            child1_allocation = {cid: [] for cid in self.campaign_ids}
            child2_allocation = {cid: [] for cid in self.campaign_ids}
            
            # Collect all ads from both parents
            all_ads_p1 = [(cid, ad_id) for cid in self.campaign_ids for ad_id in parent1.allocation[cid]]
            all_ads_p2 = [(cid, ad_id) for cid in self.campaign_ids for ad_id in parent2.allocation[cid]]
            
            # Randomly mix
            random.shuffle(all_ads_p1)
            random.shuffle(all_ads_p2)
            
            split = len(all_ads_p1) // 2
            child1_mix = all_ads_p1[:split] + all_ads_p2[split:]
            child2_mix = all_ads_p2[:split] + all_ads_p1[split:]
            
            for cid, ad_id in child1_mix:
                child1_allocation[cid].append(ad_id)
            for cid, ad_id in child2_mix:
                child2_allocation[cid].append(ad_id)
        
        child1_allocation = self._repair_allocation(child1_allocation)
        child2_allocation = self._repair_allocation(child2_allocation)
        
        child1 = Individual(allocation=child1_allocation)
        child2 = Individual(allocation=child2_allocation)
        
        return child1, child2
    
    def _repair_allocation(self, allocation: Dict[int, List[int]]) -> Dict[int, List[int]]:
        """
        Repairs an allocation to ensure:
        1. All ads are present exactly once.
        2. Every campaign has at least one ad.
        """
        if not self.campaign_ids or not self.ad_ids:
            return {cid: [] for cid in self.campaign_ids}

        new_allocation = {cid: [] for cid in self.campaign_ids}
        used_ads = set()
        
        for cid in self.campaign_ids:
            if cid in allocation:
                for ad_id in allocation[cid]:
                    if ad_id not in used_ads:
                        new_allocation[cid].append(ad_id)
                        used_ads.add(ad_id)
        
        all_ads_set = set(self.ad_ids)
        missing_ads = list(all_ads_set - used_ads)
        
        for ad_id in missing_ads:
            target_cid = random.choice(self.campaign_ids)
            new_allocation[target_cid].append(ad_id)
            used_ads.add(ad_id)
        
        for cid in self.campaign_ids:
            while not new_allocation[cid]:
                candidate_donors = [c for c in self.campaign_ids if len(new_allocation[c]) > 1]
                if candidate_donors:
                    donor_cid = random.choice(candidate_donors)
                    ad_to_move = new_allocation[donor_cid].pop()
                    new_allocation[cid].append(ad_to_move)
                else:
                    break 
        
        return new_allocation
    
    def calculate_population_diversity(self) -> float:
        """
        Calculate population diversity based on unique allocations
        Returns value between 0 (all identical) and 1 (all unique)
        """
        if not self.population:
            return 0.0
        
        # Convert allocations to hashable format for comparison
        allocation_signatures = []
        for individual in self.population:
            # Create signature: tuple of (campaign_id, sorted_ad_ids)
            signature = tuple(sorted(
                (cid, tuple(sorted(ad_ids))) 
                for cid, ad_ids in individual.allocation.items()
            ))
            allocation_signatures.append(signature)
        
        # Count unique signatures
        unique_count = len(set(allocation_signatures))
        diversity = unique_count / len(self.population)
        
        return diversity
    
    def mutate(self, individual: Individual, adaptive_rate: float = None, force_diversity: bool = False):
        """
        Adaptive mutation with multiple strategies.
        
        Args:
            individual: Individual to mutate
            adaptive_rate: Optional higher mutation rate for forced exploration
            force_diversity: If True, uses aggressive mutation strategies
        """
        allocation = individual.allocation
        
        if not self.campaign_ids or self.num_campaigns < 2 or not self.ad_ids or self.num_ads < 2:
            return

        # Use adaptive rate if provided, otherwise use base rate
        current_mutation_rate = adaptive_rate if adaptive_rate is not None else self.mutation_rate
        
        # Increase mutation intensity when forcing diversity
        if force_diversity:
            current_mutation_rate = min(0.6, current_mutation_rate * 3.0)
        
        # Choose mutation strategy
        strategy = random.choice(['move', 'swap', 'scramble']) if force_diversity else 'move'
        
        if strategy == 'move':
            # Move ads between campaigns
            num_mutations_attempts = max(1, int(current_mutation_rate * self.num_ads))
            
            for _ in range(num_mutations_attempts):
                if random.random() < current_mutation_rate:
                    source_campaign_candidates = [cid for cid in self.campaign_ids 
                                                if len(allocation[cid]) > 1]
                    
                    if not source_campaign_candidates:
                        continue
                    
                    source_cid = random.choice(source_campaign_candidates)
                    target_cid = random.choice([c for c in self.campaign_ids if c != source_cid])
                    
                    if allocation[source_cid]:
                        ad_to_move = random.choice(allocation[source_cid])
                        allocation[source_cid].remove(ad_to_move)
                        allocation[target_cid].append(ad_to_move)
        
        elif strategy == 'swap':
            # Swap ads between two campaigns
            num_swaps = max(1, int(current_mutation_rate * self.num_ads * 0.5))
            
            for _ in range(num_swaps):
                campaign1 = random.choice(self.campaign_ids)
                campaign2 = random.choice([c for c in self.campaign_ids if c != campaign1])
                
                if allocation[campaign1] and allocation[campaign2]:
                    ad1 = random.choice(allocation[campaign1])
                    ad2 = random.choice(allocation[campaign2])
                    
                    allocation[campaign1].remove(ad1)
                    allocation[campaign2].remove(ad2)
                    allocation[campaign1].append(ad2)
                    allocation[campaign2].append(ad1)
        
        else:  # scramble
            # Scramble: redistribute multiple ads randomly
            num_to_scramble = max(2, int(current_mutation_rate * self.num_ads))
            
            # Collect random ads from campaigns (that have more than 1 ad)
            ads_to_scramble = []
            source_campaigns = [cid for cid in self.campaign_ids if len(allocation[cid]) > 1]
            
            for _ in range(num_to_scramble):
                if not source_campaigns:
                    break
                source_cid = random.choice(source_campaigns)
                if allocation[source_cid]:
                    ad_to_scramble = random.choice(allocation[source_cid])
                    allocation[source_cid].remove(ad_to_scramble)
                    ads_to_scramble.append(ad_to_scramble)
                    
                    # Update source campaigns list
                    source_campaigns = [cid for cid in self.campaign_ids if len(allocation[cid]) > 1]
            
            # Redistribute scrambled ads randomly
            for ad_id in ads_to_scramble:
                target_cid = random.choice(self.campaign_ids)
                allocation[target_cid].append(ad_id)
    
    def evolve(self, generation: int = 0):
        """Creates next generation with adaptive elitism and diversity preservation"""
        # Calculate current population diversity
        diversity = self.calculate_population_diversity()
        force_diversity_mode = diversity < self.diversity_threshold
        
        new_population = []
        
        # Adjust elite size based on diversity
        if force_diversity_mode:
            elite_size = max(1, int(self.population_size * 0.10))  # Reduce elite when diversity is low
        else:
            elite_size = max(2, int(self.population_size * 0.15))  # Normal elite size
        
        elites = [deepcopy(ind) for ind in self.population[:elite_size]]
        new_population.extend(elites)
        
        # Diversity preservation: keep some random individuals (not just worst)
        if force_diversity_mode:
            # When diversity is low, inject more random individuals
            diversity_size = max(3, int(self.population_size * 0.15))
            # Mix of worst and random from population
            diverse_individuals = []
            diverse_individuals.extend(self.population[-diversity_size//2:])
            diverse_individuals.extend(random.sample(self.population[elite_size:-diversity_size//2], 
                                                    diversity_size//2) if len(self.population) > elite_size + diversity_size else [])
            new_population.extend([deepcopy(ind) for ind in diverse_individuals])
        else:
            diversity_size = max(1, int(self.population_size * 0.05))
            worst_individuals = [deepcopy(ind) for ind in self.population[-diversity_size:]]
            new_population.extend(worst_individuals)
        
        # Fill the rest with crossover and mutation
        while len(new_population) < self.population_size:
            parent1 = self.selection()
            parent2 = self.selection()
            
            child1, child2 = self.crossover(parent1, parent2)
            
            # Use force_diversity flag in mutation when population is homogeneous
            self.mutate(child1, force_diversity=force_diversity_mode)
            self.mutate(child2, force_diversity=force_diversity_mode)
            
            if child1.validate(self.campaign_ids, self.ad_ids):
                self.fitness_evaluator.evaluate(child1)
                new_population.append(child1)
            
            if len(new_population) < self.population_size:
                if child2.validate(self.campaign_ids, self.ad_ids):
                    self.fitness_evaluator.evaluate(child2)
                    new_population.append(child2)
        
        # Inject random immigrants more frequently when diversity is low
        num_immigrants = 3 if force_diversity_mode else 1
        
        if len(new_population) >= self.population_size:
            for _ in range(num_immigrants):
                if len(new_population) > elite_size + 1:
                    replace_idx = random.randint(elite_size, len(new_population) - 1)
                    new_allocation = self.create_random_allocation()
                    new_individual = Individual(allocation=new_allocation)
                    self.fitness_evaluator.evaluate(new_individual)
                    new_population[replace_idx] = new_individual
        
        self.population = new_population[:self.population_size]
        self.population.sort(key=lambda x: x.fitness, reverse=True)
        
        # Track improvement
        if self.population[0].fitness > self.best_individual.fitness:
            self.best_individual = deepcopy(self.population[0])
            self.generations_without_improvement = 0
        else:
            self.generations_without_improvement += 1
    
    def run(self, verbose=True):
        """Executes the complete genetic algorithm optimization process"""
        print("Inicializando população para GA...")
        try:
            self.initialize_population()
        except ValueError as e:
            print(f"FATAL GA ERROR: {e}")
            return None

        if not self.population:
            return None
        
        if verbose:
            print(f"\nExecutando {self.max_generations} gerações do GA...")
            print(f"Campanhas: {self.num_campaigns}, Anúncios: {self.num_ads}")
            print("-" * 70)
        
        for generation in range(self.max_generations):
            self.evolve(generation=generation)
            
            avg_fitness = np.mean([ind.fitness for ind in self.population])
            avg_roi = np.mean([ind.total_roi for ind in self.population])
            diversity = self.calculate_population_diversity()
            
            self.history.append({
                'generation': generation,
                'best_fitness': self.best_individual.fitness,
                'best_roi': self.best_individual.total_roi,
                'best_cost': self.best_individual.total_cost,
                'avg_fitness': avg_fitness,
                'avg_roi': avg_roi,
                'diversity': diversity
            })
            
            if verbose and (generation % 10 == 0 or generation == self.max_generations - 1):
                print(f"Gen {generation:3d} | "
                      f"ROI: {self.best_individual.total_roi:7.2%} | "
                      f"Fitness: {self.best_individual.fitness:8.3f} | "
                      f"Cost: ${self.best_individual.total_cost:,.0f} | "
                      f"Avg ROI: {avg_roi:7.2%} | "
                      f"Div: {diversity:5.2%}")
        
        if verbose:
            print("-" * 70)
        return self.best_individual


# ============================================================================
# 6. VISUALIZATION AND ANALYSIS
# ============================================================================

def print_solution_details(solution: Individual, data_manager: DataManager):
    """Prints comprehensive solution metrics and allocation details"""
    print("\n" + "="*70)
    print("MELHOR SOLUÇÃO ENCONTRADA")
    print("="*70)
    
    if solution is None:
        print("No valid solution found.")
        return

    print(f"\n📊 MÉTRICAS GLOBAIS:")
    print(f"  • ROI Total: {solution.total_roi:.2%}")
    print(f"  • Fitness: {solution.fitness:.3f}")
    print(f"  • Custo Total: ${solution.total_cost:,.2f}")
    print(f"  • Revenue Total: ${solution.total_revenue:,.2f}")
    print(f"  • Lucro: ${solution.total_revenue - solution.total_cost:,.2f}")
    
    print(f"\n📈 DETALHES POR CAMPANHA:")
    print("-" * 70)
    
    for campaign_id, metrics in solution.campaign_metrics.items():
        campaign = data_manager.get_campaign(campaign_id)
        ads = solution.allocation[campaign_id]
        
        print(f"\n  Campanha #{campaign_id} ({campaign.channel_name} - {campaign.ext_service_name})")
        print(f"    └─ ROI: {metrics['roi']:.2%} | "
              f"Cost: ${metrics['cost']:,.0f} | "
              f"Revenue: ${metrics['revenue']:,.0f}")
        print(f"    └─ Budget Cost: ${metrics['budget_cost']:,.0f} "
              f"(Approved: ${metrics['approved_budget']:,.0f}, Overcost: ${metrics['overcost']:,.0f})")
        print(f"    └─ Ads Cost: ${metrics['ads_cost']:,.0f} | "
              f"Avg Conversion: {metrics['avg_conversion_rate']:.2%}")
        print(f"    └─ Anúncios alocados: {metrics['n_ads']}")
        print(f"       IDs: {ads[:5]}{'...' if len(ads) > 5 else ''}")


# ============================================================================
# 7. ORCHESTRATOR FUNCTION
# ============================================================================

def run_genetic_optimization(
    campaigns: List[Campaign],
    ads: List[Ad],
    population_size: int,
    max_generations: int,
    mutation_rate: float,
    crossover_rate: float,
    total_budget: float,
    risk_factor: float,
    verbose: bool = True
) -> Optional[Individual]:
    """
    Orchestrates the entire Genetic Algorithm optimization process.
    Expects campaigns and ads with already predicted overcosts and conversion rates.
    Handles GA setup and execution.
    """
    if not campaigns or not ads:
        print("Error: Campaigns or Ads lists are empty. Cannot run GA.")
        return None

    # Initialize GA components with the predicted data (predictions done in main.py)
    data_manager = DataManager(campaigns, ads)
    
    if not data_manager.campaign_ids or not data_manager.ad_ids:
        print("Error: No valid campaigns or ads found after processing for GA.")
        return None
    
    fitness_evaluator = FitnessEvaluator(
        data_manager=data_manager,
        total_budget=total_budget,
        risk_factor=risk_factor
    )
    
    ga = GeneticAlgorithm(
        population_size=population_size,
        max_generations=max_generations,
        mutation_rate=mutation_rate,
        crossover_rate=crossover_rate,
        fitness_evaluator=fitness_evaluator,
        data_manager=data_manager
    )
    
    # 3. Run the Genetic Algorithm
    print("\n--- GA Orchestrator: Running Genetic Algorithm ---")
    best_solution = ga.run(verbose=verbose)
    
    if best_solution:
        print("\n--- GA Orchestrator: Best solution details ---")
        print_solution_details(best_solution, data_manager)
    else:
        print("\n--- GA Orchestrator: Genetic Algorithm failed to find a solution ---")
    
    return best_solution