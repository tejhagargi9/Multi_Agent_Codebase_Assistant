from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env (must be before any code that reads OPENAI/PINECONE keys)
load_dotenv()

from routes.upload import router as upload_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 FastAPI CRUD server starting up on http://127.0.0.1:8000")
    yield
    print("🛑 Server shutting down")

app = FastAPI(title="FastAPI CRUD", version="1.0.0", lifespan=lifespan)

# CORS for React frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload routes (zip analysis)
app.include_router(upload_router)

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int

items_db: dict[int, Item] = {}
next_id: int = 1

@app.post("/items/", response_model=Item, status_code=201)
def create_item(item: ItemCreate):
    global next_id
    new_item = Item(id=next_id, **item.model_dump())
    items_db[next_id] = new_item
    next_id += 1
    return new_item

@app.get("/items/", response_model=list[Item])
def read_items():
    return list(items_db.values())

@app.get("/")
def root():
    return "Your fast api server is running successfully..."

@app.get("/items/{item_id}", response_model=Item)
def read_item(item_id: int):
    
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    return items_db[item_id]

@app.put("/items/{item_id}", response_model=Item)
def update_item(item_id: int, item: ItemCreate):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    updated_item = Item(id=item_id, **item.model_dump())
    items_db[item_id] = updated_item
    return updated_item

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    del items_db[item_id]
    return {"message": "Item deleted successfully"}
