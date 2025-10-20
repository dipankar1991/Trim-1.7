from flask import Flask, request, jsonify
from flask_cors import CORS
from ortools.linear_solver import pywraplp
from ortools.sat.python import cp_model
import numpy as np
import time

app = Flask(__name__)
CORS(app)

class CuttingStockOptimizer:
    def __init__(self, jumbo_width, min_trim, max_sections):
        self.jumbo_width = jumbo_width
        self.min_trim = min_trim
        self.max_sections = max_sections
        self.solver = pywraplp.Solver.CreateSolver('SCIP')
        
    def generate_feasible_patterns(self, widths):
        """Generate all feasible cutting patterns using DFS"""
        patterns = []
        
        def dfs(current_pattern, current_width, start_idx):
            if current_pattern:
                patterns.append(current_pattern.copy())
            
            if len(current_pattern) >= self.max_sections:
                return
                
            for i in range(start_idx, len(widths)):
                new_width = current_width + widths[i]
                if new_width <= self.jumbo_width - self.min_trim:
                    current_pattern.append(widths[i])
                    dfs(current_pattern, new_width, i)
                    current_pattern.pop()
        
        dfs([], 0, 0)
        return patterns
    
    def solve_with_ortools(self, widths, quantities):
        """Solve cutting stock problem using OR-Tools"""
        start_time = time.time()
        
        # Generate feasible patterns
        patterns = self.generate_feasible_patterns(widths)
        print(f"Generated {len(patterns)} feasible patterns")
        
        if not patterns:
            return {"error": "No feasible patterns found"}
        
        # Create variables for each pattern (how many times to use each pattern)
        pattern_vars = []
        for i in range(len(patterns)):
            pattern_vars.append(self.solver.IntVar(0, self.solver.infinity(), f'pattern_{i}'))
        
        # Demand constraints: for each width, total used must meet demand
        for width_idx, width in enumerate(widths):
            constraint = self.solver.Constraint(quantities[width_idx], self.solver.infinity())
            for pattern_idx, pattern in enumerate(patterns):
                # Count how many times this width appears in the pattern
                count_in_pattern = pattern.count(width)
                if count_in_pattern > 0:
                    constraint.SetCoefficient(pattern_vars[pattern_idx], count_in_pattern)
        
        # Objective: minimize total jumbo reels used
        objective = self.solver.Objective()
        for var in pattern_vars:
            objective.SetCoefficient(var, 1)
        objective.SetMinimization()
        
        # Solve the problem
        print("Solving with OR-Tools...")
        status = self.solver.Solve()
        solve_time = time.time() - start_time
        
        if status == pywraplp.Solver.OPTIMAL:
            solution = []
            total_reels = 0
            total_waste = 0
            
            for i, var in enumerate(pattern_vars):
                usage = var.solution_value()
                if usage > 0:
                    pattern_width = sum(patterns[i])
                    waste = self.jumbo_width - pattern_width
                    
                    solution.append({
                        'pattern': patterns[i],
                        'usage': int(usage),
                        'waste': waste,
                        'efficiency': round((pattern_width / self.jumbo_width) * 100, 2)
                    })
                    total_reels += usage
                    total_waste += waste * usage
            
            total_used = total_reels * self.jumbo_width - total_waste
            overall_efficiency = (total_used / (total_reels * self.jumbo_width)) * 100 if total_reels > 0 else 0
            
            return {
                'success': True,
                'patterns': solution,
                'statistics': {
                    'total_reels': int(total_reels),
                    'total_waste': total_waste,
                    'efficiency': round(overall_efficiency, 2),
                    'solve_time': round(solve_time, 2)
                },
                'message': f'OR-Tools found optimal solution in {solve_time:.2f}s'
            }
        else:
            return {"error": "No optimal solution found"}

@app.route('/optimize', methods=['POST'])
def optimize_cutting():
    try:
        data = request.json
        orders = data['orders']
        machine_settings = data['machineSettings']
        
        # Extract widths and quantities
        widths = [order['width'] for order in orders]
        quantities = [order['quantity'] for order in orders]
        
        print(f"Optimizing: {len(widths)} widths, quantities: {quantities}")
        
        # Create optimizer
        optimizer = CuttingStockOptimizer(
            jumbo_width=machine_settings['maxJumboWidth'],
            min_trim=machine_settings['minTrimWidth'],
            max_sections=machine_settings['maxSections']
        )
        
        # Solve
        result = optimizer.solve_with_ortools(widths, quantities)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Optimization error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "message": "OR-Tools cutting stock optimizer is running",
        "technology": "Google OR-Tools with SCIP solver"
    })

if __name__ == '__main__':
    print("Starting OR-Tools Cutting Stock Optimizer...")
    app.run(debug=True, port=5000, host='0.0.0.0')
    # 