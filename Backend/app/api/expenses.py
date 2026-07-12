import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import EXPENSE_WRITE, EXPENSE_READ
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.services import expense_service

router = APIRouter()


@router.post(
    "",
    response_model=ExpenseOut,
    status_code=201,
    summary="Record an expense",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, FINANCIAL_ANALYST",
)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(EXPENSE_WRITE),
):
    return expense_service.create_expense(payload, db, current_user)


@router.get(
    "",
    response_model=List[ExpenseOut],
    summary="List expenses",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST",
)
def list_expenses(
    vehicle_id: Optional[uuid.UUID] = Query(None, description="Filter by vehicle ID"),
    trip_id: Optional[uuid.UUID] = Query(None, description="Filter by trip ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(EXPENSE_READ),
):
    return expense_service.list_expenses(db, vehicle_id=vehicle_id, trip_id=trip_id)


@router.get(
    "/{expense_id}",
    response_model=ExpenseOut,
    summary="Get an expense by ID",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST",
)
def get_expense(
    expense_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(EXPENSE_READ),
):
    return expense_service.get_expense(expense_id, db)


@router.put(
    "/{expense_id}",
    response_model=ExpenseOut,
    summary="Update an expense",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, FINANCIAL_ANALYST",
)
def update_expense(
    expense_id: uuid.UUID,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(EXPENSE_WRITE),
):
    return expense_service.update_expense(expense_id, payload, db, current_user)
