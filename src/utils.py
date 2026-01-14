import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

def evaluate_model(model, X_test, y_test, model_name, is_optimized=False):
    """Calculates regression metrics and prints them."""
    y_pred = model.predict(X_test)
    
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    status = "OPTIMIZED" if is_optimized else "BASELINE"
    print(f"--- {model_name} [{status}] Results ---")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE:  {mae:.4f}")
    print(f"R2:   {r2:.4f}")
    print("-" * 30)
    
    return {'model': model_name, 'status': status, 'rmse': rmse, 'r2': r2}

def save_model(model, filename, folder="models"):
    """Saves the trained model to disk."""
    if not os.path.exists(folder):
        os.makedirs(folder)
    path = os.path.join(folder, filename)
    joblib.dump(model, path)
    print(f"✅ Model saved to {path}")

def plot_feature_importance(model, feature_names, model_name, folder="reports"):
    """Plots feature importance for tree-based models."""
    if not hasattr(model, 'feature_importances_'):
        return

    if not os.path.exists(folder):
        os.makedirs(folder)

    importance = model.feature_importances_
    indices = np.argsort(importance)[::-1]
    
    plt.figure(figsize=(10, 6))
    plt.title(f"Feature Importance - {model_name}")
    sns.barplot(x=importance[indices][:20], y=[feature_names[i] for i in indices][:20])
    plt.tight_layout()
    plt.savefig(f"{folder}/{model_name}_importance.png")
    plt.close()