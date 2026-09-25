import os
from typing import List


class Settings:
    PROJECT_NAME: str = "GridVision API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Allowed origins for CORS (Vite dev server default is 5173)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()
