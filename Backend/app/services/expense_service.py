import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.services.audit_helper import log_action


def create_expense(payload: ExpenseCreate, db: Session, current_user: User) -> ExpenseOut:
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.flush()
    log_action(
        db, action="CREATE", table_name="expenses",
        record_id=expense.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(expense)
    return ExpenseOut.model_validate(expense)


def list_expenses(db: Session, vehicle_id: uuid.UUID = None, trip_id: uuid.UUID = None) -> List[ExpenseOut]:
    q = db.query(Expense)
    if vehicle_id:
        q = q.filter(Expense.vehicle_id == vehicle_id)
    if trip_id:
        q = q.filter(Expense.trip_id == trip_id)
    return [ExpenseOut.model_validate(e) for e in q.order_by(Expense.date.desc()).all()]


def get_expense(expense_id: uuid.UUID, db: Session) -> ExpenseOut:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    return ExpenseOut.model_validate(expense)


def update_expense(expense_id: uuid.UUID, payload: ExpenseUpdate, db: Session, current_user: User) -> ExpenseOut:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    old = {c.name: str(getattr(expense, c.name)) for c in Expense.__table__.columns}
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    db.flush()
    log_action(
        db, action="UPDATE", table_name="expenses",
        record_id=expense.id, user_id=current_user.id,
        old_values=old,
        new_values={k: str(v) for k, v in update_data.items()},
    )
    db.commit()
    db.refresh(expense)
    return ExpenseOut.model_validate(expense)
