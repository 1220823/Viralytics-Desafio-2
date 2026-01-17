import joblib
import pandas as pd
import numpy as np
import holidays
import calendar
from typing import List
from datetime import datetime
from src.Classes.models import Ad

# --- 1. Carregar o Modelo ---
try:
    MODEL = joblib.load("src/Model_Training/Trained_Models/Advertising/Advertising_Model_LightGBM_Opt_R2-0.773_20260117_0257.joblib") 
    print("Modelo ML carregado com sucesso.")
except Exception as e:
    print(f"ERRO CRÍTICO: Não foi possível carregar o modelo. {e}")
    MODEL = None

# --- 2. Definições e Mapeamentos ---

# Lista exata de colunas que o modelo espera (na mesma ordem)
# COLUNAS_MODELO = [
#     'click_through_rate', 'view_time', 'cost_per_click', 'ROI', 
#     'hour_of_day', 'day_of_week', 'day_of_month', 'month', 
#     'is_month_start', 'is_month_end', 'is_weekend', 'time_of_day', 
#     'is_holiday', 'age_group_encoded', 'engagement_level_encoded', 
#     'device_type_Mobile', 'device_type_Tablet', 
#     'location_Germany', 'location_India', 'location_UK', 'location_USA', 
#     'gender_Male', 
#     'content_type_Text', 'content_type_Video', 
#     'ad_topic_Electronics', 'ad_topic_Entertainment', 'ad_topic_Fashion', 
#     'ad_topic_Finance', 'ad_topic_Food', 'ad_topic_Health', 'ad_topic_Travel', 
#     'ad_target_audience_Fitness Lovers', 'ad_target_audience_Professionals', 
#     'ad_target_audience_Students', 'ad_target_audience_Tech Enthusiasts', 
#     'ad_target_audience_Travel Lovers', 'ad_target_audience_Young Adults'
# ]


COLUNAS_MODELO = ['age_group_encoded', 'engagement_level_encoded', 'device_type_Tablet', 
                 'location_Germany', 'location_India', 'content_type_Text', 
                 'content_type_Video', 'ad_topic_Finance', 
                 'ad_target_audience_Professionals', 'ad_target_audience_Students']


AGE_MAP = {
    '18-24': 0, '25-34': 1, '35-44': 2, '45-54': 3, '55+': 4
}

ENGAGEMENT_MAP = {
    'Ignored': 0, 'Viewed': 2, 'Liked': 5, 'Commented': 15, 'Shared': 50
}

# --- 3. Funções Auxiliares  ---

def get_time_of_day(hour: int) -> int:
    if 0 <= hour < 6: return 0      # Madrugada
    elif 6 <= hour < 12: return 1   # Manhã
    elif 12 <= hour < 18: return 2  # Tarde
    else: return 3                  # Noite

def is_holiday_check(date_obj, country_str: str) -> int:
    """
    Verifica se é feriado usando a biblioteca 'holidays' dinamicamente.
    """
    try:
        # Mapear string do modelo para a classe da biblioteca holidays
        country_obj = None
        year = date_obj.year
        
        if country_str == 'USA': country_obj = holidays.US(years=year)
        elif country_str == 'UK': country_obj = holidays.GB(years=year)
        elif country_str == 'Germany': country_obj = holidays.DE(years=year)
        elif country_str == 'India': country_obj = holidays.IN(years=year)
        elif country_str == 'Canada': country_obj = holidays.CA(years=year)
        
        if country_obj and date_obj in country_obj:
            return 1
        return 0
    except Exception:
        return 0

# --- 4. Função Principal de Previsão ---

def predict_ads_conversion_rates_ml(ads: List[Ad]) -> List[Ad]:
    if not ads:
        return []
    
    if MODEL is None:
        print("Aviso: Modelo off-line. Retornando conversion_rate = 0")
        return ads

    rows = []

    for ad in ads:
        # Garantir que é um objeto datetime
        if isinstance(ad.timestamp, str):
            dt = datetime.fromisoformat(ad.timestamp)
        else:
            dt = ad.timestamp
        
        # --- FEATURE ENGINEERING (Réplica Exata) ---
        
        # 1. Features Básicas
        hour = dt.hour
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
        
        # 4. Time of Day 
        time_of_day_val = get_time_of_day(hour)
        
        # 5. Feriados (Usando biblioteca holidays)
        is_holiday_val = is_holiday_check(dt, ad.location)

        # --- CONSTRUÇÃO DO DICIONÁRIO ---
        row = {
            # 'click_through_rate': ad.click_through_rate,
            # 'view_time': ad.view_time,
            # 'cost_per_click': ad.cost_per_click,
            # 'ROI': ad.roi,

            # # Features Temporais Calculadas
            # 'hour_of_day': hour,
            # 'day_of_week': day_of_week,
            # 'day_of_month': day_of_month,
            # 'month': month,
            # 'is_month_start': is_month_start,
            # 'is_month_end': is_month_end,
            # 'is_weekend': is_weekend,
            # 'time_of_day': time_of_day_val,
            # 'is_holiday': is_holiday_val,
            
            # # Label Encodings
            'age_group_encoded': AGE_MAP.get(ad.age_group, 0),
            'engagement_level_encoded': ENGAGEMENT_MAP.get(ad.engagement_level, 0),

            # # One-Hot Encoding Manual (0 ou 1)
            # # Nota: 'Canada' ou outros países não listados no modelo ficarão todos 0
            # 'device_type_Mobile': 1 if ad.device_type == 'Mobile' else 0,
            'device_type_Tablet': 1 if ad.device_type == 'Tablet' else 0,
            
            'location_Germany': 1 if ad.location == 'Germany' else 0,
            'location_India': 1 if ad.location == 'India' else 0,
            # 'location_UK': 1 if ad.location == 'UK' else 0,
            # 'location_USA': 1 if ad.location == 'USA' else 0,
            
            # 'gender_Male': 1 if ad.gender == 'Male' else 0,
            
            'content_type_Text': 1 if ad.content_type == 'Text' else 0,
            'content_type_Video': 1 if ad.content_type == 'Video' else 0,
            
            # # Ad Topics
            # 'ad_topic_Electronics': 1 if ad.ad_topic == 'Electronics' else 0,
            # 'ad_topic_Entertainment': 0, # Se não houver no input Ad, assume 0
            # 'ad_topic_Fashion': 1 if ad.ad_topic == 'Fashion' else 0,
            'ad_topic_Finance': 1 if ad.ad_topic == 'Finance' else 0,
            # 'ad_topic_Food': 0,
            # 'ad_topic_Health': 1 if ad.ad_topic == 'Health' else 0,
            # 'ad_topic_Travel': 1 if ad.ad_topic == 'Travel' else 0,
            
            # # Target Audiences
            # 'ad_target_audience_Fitness Lovers': 1 if ad.ad_target_audience == 'Fitness Lovers' else 0,
            'ad_target_audience_Professionals': 1 if ad.ad_target_audience == 'Professionals' else 0,
            'ad_target_audience_Students': 1 if ad.ad_target_audience == 'Students' else 0,
            # 'ad_target_audience_Tech Enthusiasts': 1 if ad.ad_target_audience == 'Tech Enthusiasts' else 0,
            # 'ad_target_audience_Travel Lovers': 1 if ad.ad_target_audience == 'Travel Lovers' else 0,
            # 'ad_target_audience_Young Adults': 1 if ad.ad_target_audience == 'Young Adults' else 0,
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
            for i, ad in enumerate(ads):
                # Arredondar e garantir que é float python (não numpy float)
                ad.conversion_rate = round(float(predictions[i]), 4)
                print(f"Conversion Rate previsto para Ad ID {ad.id}: {ad.conversion_rate}")

                    
        except Exception as e:
            print(f"Erro durante o predict: {e}")

    return ads