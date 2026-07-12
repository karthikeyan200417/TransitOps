from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
import uuid
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    table_name: str
    record_id: uuid.UUID
    old_values: Optional[Any]
    new_values: Optional[Any]
    timestamp: datetime

    model_config = {"from_attributes": True}
