from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIError(BaseModel):
    error_code: str
    message: str
    details: Optional[Any] = None


class ResponseEnvelope(BaseModel, Generic[DataT]):
    success: bool = True
    data: Optional[DataT] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    environment: str
    services: dict
