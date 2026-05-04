from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import auth

# 1. Create the database tables
Base.metadata.create_all(bind=engine)

# 2. Initialize FastAPI App
app = FastAPI(title="Ethara AI - Team Task Manager API")

# 3. Setup CORS (Crucial for when React tries to talk to this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Include Routers
app.include_router(auth.router)

# 5. Root Health Check
@app.get("/")
def read_root():
    return {"message": "Ethara Task Manager API is running!"}