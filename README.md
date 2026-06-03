# Multi-Agent Codebase Assistant

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-19.2+-61dafb.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent multi-agent system powered by **LangGraph** for analyzing codebases, detecting bugs, generating fixes, and providing intelligent code reviews. Built with **FastAPI** backend and **React + Vite** frontend.

[Features](#features) • [Architecture](#architecture) • [Setup](#setup) • [Usage](#usage) • [API Documentation](#api-documentation)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Guide](#setup-guide)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Workflow](#workflow)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Multi-Agent Codebase Assistant** is an AI-powered platform that helps developers:
- **Upload & Analyze** project codebases in ZIP format
- **Detect Bugs** using intelligent code analysis with LLMs
- **Generate Fixes** automatically for identified issues
- **Review Code** with comprehensive quality analysis
- **Query Knowledge Base** through semantic RAG (Retrieval-Augmented Generation)

The system uses a **multi-agent orchestration** approach with conditional logic to intelligently route through analysis, fix generation, and review phases.

---

## Features

### 🔧 Core Capabilities

- ✅ **ZIP Codebase Upload**: Upload entire projects for analysis
- ✅ **Intelligent Code Crawling**: Automatically skips node_modules, .git, .env, and other non-essential files
- ✅ **RAG Pipeline**: 
  - Document chunking (1000 char chunks with 200 char overlap)
  - OpenAI embeddings
  - Pinecone vector storage with namespace isolation
- ✅ **Multi-Agent Workflow** (LangGraph):
  - **Retriever**: Searches Pinecone vector DB for relevant code
  - **Analyzer**: Determines if bugs exist (conditional routing)
  - **Fix Generator**: Creates solutions only when bugs are found
  - **Reviewer**: Provides final quality assessment
- ✅ **Semantic Search**: Query the codebase using natural language
- ✅ **Session Persistence**: Optional session storage for workflow state

### UI Features

- **Modern Dark Theme**: Built with Tailwind CSS
- **Upload Interface**: Drag-and-drop or file selection
- **Agent Chat**: Interactive conversation with the DevOps agents
- **Navigation**: Seamless routing between upload and chat pages

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                   │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Upload Page     │  │  Agent Chat Page │                 │
│  └──────────────────┘  └──────────────────┘                 │
└────────────────┬────────────────────────────────────┬───────┘
                 │ HTTP (CORS)                        │
        ┌────────▼────────────────────────────────────▼───────┐
        │         BACKEND (FastAPI)                            │
        │  ┌─────────────────────────────────────────────┐    │
        │  │  Upload Routes (/upload/zips)              │    │
        │  │  - ZIP extraction & crawling                │    │
        │  │  - RAG indexing to Pinecone                │    │
        │  └─────────────────────────────────────────────┘    │
        │  ┌─────────────────────────────────────────────┐    │
        │  │  DevOps Routes (/devops/run)                │    │
        │  │  - LangGraph workflow orchestration         │    │
        │  └─────────────────────────────────────────────┘    │
        │  ┌─────────────────────────────────────────────┐    │
        │  │  Multi-Agent Services (LangGraph)           │    │
        │  │  ├── Retriever (Pinecone)                   │    │
        │  │  ├── Analyzer (GPT-4)                       │    │
        │  │  ├── Fix Generator (GPT-4)                  │    │
        │  │  └── Reviewer (GPT-4)                       │    │
        │  └─────────────────────────────────────────────┘    │
        │  ┌─────────────────────────────────────────────┐    │
        │  │  RAG Pipeline (LangChain)                   │    │
        │  │  ├── Document Processing                    │    │
        │  │  ├── Text Splitting                         │    │
        │  │  └── Vector Storage (Pinecone)              │    │
        │  └─────────────────────────────────────────────┘    │
        └───────┬────────────────────────────────┬────────────┘
                │                                │
        ┌───────▼────────────┐         ┌────────▼──────────┐
        │   OpenAI API       │         │  Pinecone DB      │
        │  (Embeddings       │         │  (Vector Store)   │
        │   LLM Models)      │         │                   │
        └────────────────────┘         └───────────────────┘
```

---

##  Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangGraph** - Multi-agent orchestration & workflow
- **LangChain** - LLM framework & RAG pipeline
- **Pinecone** - Vector database for semantic search
- **OpenAI** - LLM models (GPT-4)
- **Python-multipart** - File upload handling
- **Python-dotenv** - Environment configuration

### Frontend
- **React 19.2** - UI framework
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **ESLint** - Code quality

---

##  Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm
- **OpenAI API Key** (for GPT-4 access)
- **Pinecone API Key** (for vector database)
- **Git** (optional, for version control)

---

## Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/tejhagargi9/Multi_Agent_Codebase_Assistant.git
cd Multi_Agent_Codebase_Assistant
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-key-here
PINECONE_ENVIRONMENT=your-pinecone-environment

# Optional: Logging & Debug
DEBUG=True
LOG_LEVEL=INFO
```

#### Verify Installation

```bash
python -c "import fastapi; import langchain; import pinecone; print('✅ All dependencies installed!')"
```

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

#### Configure API Endpoint (Optional)

Update API base URL in `frontend/src/` if needed (defaults to `http://localhost:8000`).

---

##  Running the Application

### Option 1: Terminal (Separate Windows)

#### Terminal 1 - Backend Server

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
FastAPI CRUD server starting up on http://127.0.0.1:8000
```

#### Terminal 2 - Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v8.0.12  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Option 2: Production Build

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Run Backend (Production)

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 📡 API Documentation

### Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints

#### Upload Zip Files
```http
POST /upload/zips
Content-Type: multipart/form-data

files: [file1.zip, file2.zip, ...]
```

**Response:**
```json
{
  "success": true,
  "total_zips": 2,
  "results": [
    {
      "zip_name": "project1.zip",
      "files_analyzed": 42,
      "documents": [...],
      "rag_indexing": {
        "chunks_created": 150,
        "vectors_stored": 150,
        "namespace": "project1"
      }
    }
  ]
}
```

#### Run DevOps Pipeline
```http
POST /devops/run
Content-Type: application/json

{
  "query": "Find bugs in the authentication module",
  "namespace": "project1",
  "session_id": "session-123-abc"
}
```

**Response:**
```json
{
  "query": "Find bugs in the authentication module",
  "session_id": "session-123-abc",
  "final_state": {
    "user_query": "Find bugs in the authentication module",
    "retrieved_context": "...",
    "has_bug": true,
    "analysis": "...",
    "fix": "...",
    "review": "..."
  }
}
```

---

##  Project Structure

```
Multi_Agent_Codebase_Assistant/
│
├── 📂 backend/                          # FastAPI backend
│   ├── main.py                          # App entry point with CORS setup
│   ├── requirements.txt                 # Python dependencies
│   │
│   ├── 📂 routes/                       # API route handlers
│   │   ├── upload.py                    # ZIP upload endpoint
│   │   └── devops.py                    # Multi-agent pipeline endpoint
│   │
│   └── 📂 services/                     # Business logic
│       ├── zip_processor.py             # ZIP extraction & crawling
│       │
│       ├── 📂 devops/                   # Multi-agent agents
│       │   ├── __init__.py
│       │   ├── state.py                 # State schema (TypedDict)
│       │   ├── graph.py                 # LangGraph workflow
│       │   ├── retriever.py             # Pinecone retrieval agent
│       │   ├── analyzer.py              # Bug analysis agent
│       │   ├── fix_generator.py         # Fix generation agent
│       │   ├── reviewer.py              # Code review agent
│       │   └── session_store.py         # Session persistence
│       │
│       └── 📂 rag/                      # RAG pipeline
│           ├── __init__.py
│           ├── indexer.py               # Document indexing
│           └── vector_store.py          # Pinecone integration
│
├── 📂 frontend/                         # React + Vite frontend
│   ├── package.json                     # Node dependencies
│   ├── vite.config.js                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── postcss.config.js                # PostCSS config
│   ├── eslint.config.js                 # ESLint rules
│   │
│   ├── index.html                       # Entry HTML
│   │
│   └── 📂 src/
│       ├── main.jsx                     # React entry
│       ├── App.jsx                      # App component & routing
│       ├── index.css                    # Global styles
│       │
│       ├── 📂 pages/
│       │   ├── Upload.jsx               # File upload interface
│       │   └── Chat.jsx                 # Agent chat interface
│       │
│       ├── 📂 assets/                   # Static assets
│       └── 📂 components/               # Reusable components
│
└── README.md                            # This file
```

---

## Workflow

### Upload & Indexing Flow

```
1. User uploads ZIP(s) via React UI
      ↓
2. Backend receives file in /upload/zips
      ↓
3. ZIP extraction & file crawling
   - Skips: node_modules/, .git/, .env, __pycache__/, etc.
      ↓
4. Document extraction (code content)
      ↓
5. RAG Pipeline:
   - Chunk documents (1000 char / 200 overlap)
   - Generate OpenAI embeddings
   - Store in Pinecone (namespace = project name)
      ↓
6. Return indexing stats to UI
```

### Multi-Agent Pipeline Flow

```
User Query: "Find bugs in auth module"
      ↓
LangGraph Workflow Starts
      ↓
┌─────────────────────────────────┐
│ 1. Retriever Node               │
│ - Query Pinecone vector DB      │
│ - Return relevant code snippets │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│ 2. Analyzer Node                │
│ - Analyze retrieved code        │
│ - Decide: has_bug = true/false  │
└──────────────┬──────────────────┘
               ↓
        CONDITIONAL ROUTING
               ↓
    ┌──────────┴──────────┐
    │ has_bug?            │
    ├─────────────────────┤
    │ YES ↓       NO ↓    │
    │  Fix        Review  │
    └─────┬──────────┬────┘
          ↓          ↓
     ┌─────────────────────────────────┐
     │ 3. Fix Generator Node (optional)│
     │ - Generate code fixes           │
     └──────────────┬──────────────────┘
                    ↓
     ┌─────────────────────────────────┐
     │ 4. Reviewer Node                │
     │ - Review fixes / analysis       │
     │ - Provide final assessment      │
     └──────────────┬──────────────────┘
                    ↓
            Return final_state
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 access | `sk-...` |
| `PINECONE_API_KEY` | Pinecone API key | `xxxx-xxxx-xxxx` |
| `PINECONE_ENVIRONMENT` | Pinecone environment | `gcp-starter` |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

##  Acknowledgments

- **LangGraph** - For powerful multi-agent orchestration
- **FastAPI** - For excellent Python web framework
- **OpenAI** - For GPT models
- **Pinecone** - For vector database infrastructure
- **React & Vite** - For modern frontend development

---

<div align="center">

[⬆ back to top](#multi-agent-codebase-assistant-)

</div>
