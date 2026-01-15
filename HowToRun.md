# Install Dependencies:
1 - pip install fastapi uvicorn pydantic holidays

# How to Run:

# GENERATE SYNTHETIC DATA
1- python DB\dataGenerator

# CLEAN DATA & TRAIN ML MODELS
2- python app.py

# START THE FASTAPI SERVER
3- python -m uvicorn main:app --reload

# MAKE THE CALLS
4- Call the endpoints you want on your localhost, (GET campaings, GET ads, POST optimize marketing allocation)