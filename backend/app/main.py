from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import upload, generations

app = FastAPI(title="AudioGenie API", version="1.0.0")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(generations.router)

@app.get("/")
async def root():
    return {"message": "AudioGenie API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
