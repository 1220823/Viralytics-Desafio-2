# Install Dependencies:
1 - pip install fastapi uvicorn pydantic holidays

# How to Run:

# GENERATE SYNTHETIC DATA
1- python src\DB\dataGenerator

# START THE FASTAPI SERVER
3- python -m uvicorn src.main:app --reload

# MAKE THE CALLS
4- Call the endpoints you want on your localhost, (GET campaings, GET ads, POST optimize marketing allocation or POST optimize tabu search)

---
 
# Run the frontend

1- Enter frontend directory:

cd ad-bidder-ui/

2- Install dependencies:

npm install

3- Start the server:

npm run dev
