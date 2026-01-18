import joblib
import pandas as pd
import numpy as np
import holidays
import calendar
from typing import List
from datetime import datetime
from src.Classes.models import Campaign

# --- 1. Carregar o Modelo ---
try:
    MODEL = joblib.load("src/Model_Training/Trained_Models/Marketing/Marketing_Model_XGBoost_Opt_R2-0.609_20260117_1754.joblib") 
    print("Modelo ML Campaigns carregado com sucesso.")
except Exception as e:
    print(f"ERRO CRÍTICO: Não foi possível carregar o modelo. {e}")
    MODEL = None

# --- 2. Definições e Mapeamentos ---

COLUNAS_MODELO = ['no_of_days', 'approved_budget', 'start_month', 
                  'ext_service_name_Facebook Ads', 'ext_service_name_Google Ads', 
                  'channel_name_Mobile', 'channel_name_Search', 'search_tag_cat_Other', 
                  'search_tag_cat_Retargeting', 'search_tag_cat_Youtube']    

# --- 3. Função Principal de Previsão ---

def predict_campaigns_overcosts_ml(campaigns: List[Campaign]) -> List[Campaign]:
    if not campaigns:
        return []
    
    if MODEL is None:
        print("Aviso: Modelo off-line. Retornando conversion_rate = 0")
        return campaigns

    rows = []

    for campaign in campaigns:
        # Garantir que é um objeto date
        dt = campaign.time
        if not isinstance(dt, datetime):
            dt = datetime.combine(campaign.time, datetime.min.time())
        
        # --- FEATURE ENGINEERING (Réplica Exata) ---
        
        # 1. Features Básicas
        day_of_week = dt.weekday() # 0=Monday, 6=Sunday
        day_of_month = dt.day
        month = dt.month
        
        # 2. Início e Fim do Mês 
        # "is_month_start = 1 if x <= 7 else 0"
        is_month_start = 1 if day_of_month <= 7 else 0
        
        # "is_month_end = 1 if (days_in_month - day) < 7 else 0"
        # calendar.monthrange retorna (weekday_first_day, number_of_days)
        total_days_in_month = calendar.monthrange(dt.year, dt.month)[1]
        is_month_end = 1 if (total_days_in_month - day_of_month) < 7 else 0
        
        # 3. Fim de Semana
        # "is_weekend = 1 if x >= 5 else 0" (Sábado=5, Domingo=6)
        is_weekend = 1 if day_of_week >= 5 else 0

        # --- CONSTRUÇÃO DO DICIONÁRIO ---
        row = {
            'no_of_days': campaign.no_of_days,
            'approved_budget': campaign.approved_budget,
            'start_month': month,
            'ext_service_name_Facebook Ads': 1 if campaign.ext_service_name == 'Facebook Ads' else 0,
            'ext_service_name_Google Ads': 1 if campaign.ext_service_name == 'Google Ads' else 0,
            'channel_name_Mobile': 1 if campaign.channel_name == 'Mobile' else 0,
            'channel_name_Search': 1 if campaign.channel_name == 'Search' else 0,
            'search_tag_cat_Other': 1 if campaign.search_tag_cat == 'Other' else 0,
            'search_tag_cat_Retargeting': 1 if campaign.search_tag_cat == 'Retargeting' else 0,
            'search_tag_cat_Youtube': 1 if campaign.search_tag_cat == 'Youtube' else 0,
        }
        
        # Preencher colunas faltantes com 0 (segurança)
        for col in COLUNAS_MODELO:
            if col not in row:
                row[col] = 0
                
        rows.append(row)

    # --- PREVISÃO ---
    if rows:
        # Criar DataFrame e forçar ordem das colunas
        df_predict = pd.DataFrame(rows)
        df_predict = df_predict[COLUNAS_MODELO]

        try:
            predictions = MODEL.predict(df_predict)
            
            # Atualizar os objetos Ad originais
            for i, campaign in enumerate(campaigns):
                # Arredondar e garantir que é float python (não numpy float)
                campaign.overcost = round(float(predictions[i]), 4)
                #print(f"Conversion Rate previsto para Campaign ID {campaign.ID}: {campaign.overcost}")

                    
        except Exception as e:
            print(f"Erro durante o predict: {e}")

    return campaigns