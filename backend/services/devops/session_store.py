from typing import Dict, Optional
from services.devops.state import DevOpsState

# In-memory session store for DevOps pipeline state.
# Keyed by roundId / session_id generated on the frontend.
# Note: This is for development/demo only — resets on server restart.
_sessions: Dict[str, DevOpsState] = {}


def get_session(session_id: Optional[str]) -> Optional[DevOpsState]:
    if not session_id:
        return None
    return _sessions.get(session_id)


def save_session(session_id: str, state: DevOpsState) -> None:
    _sessions[session_id] = state


def update_session(session_id: str, updates: Dict) -> DevOpsState:
    current = _sessions.get(session_id, {})
    new_state: DevOpsState = {**current, **updates}  # type: ignore
    _sessions[session_id] = new_state
    return new_state
