from fastapi import FastAPI

app = FastAPI(title="GridVision API")


@app.get("/health")
def health():
    return {"status": "ok"}
