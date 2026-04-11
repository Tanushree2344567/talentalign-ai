import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from database import get_db
import models
import auth_utils

load_dotenv()

router = APIRouter()

SYSTEM_PROMPT = """You are a helpful support assistant for TalentAlign AI — an AI-powered resume screening platform.

You help users with:
- How to create projects and upload resumes
- Understanding match scores (skills, experience, education)
- How the AI ranking works
- Troubleshooting upload issues
- Understanding matched/missing skills
- General platform navigation

Keep responses concise, friendly, and helpful.
If the user's issue seems complex or unresolved after your response, suggest they create a support ticket by saying "Would you like me to create a support ticket for this?"
If the user says yes to creating a ticket, respond with exactly: [CREATE_TICKET: <one line summary of the issue>]
"""


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    reply: str
    ticket_created: bool = False
    ticket_id: Optional[int] = None


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    created_at: str
    message_count: int


class CreateTicketRequest(BaseModel):
    title: str
    description: str
    priority: Optional[str] = "medium"


class UpdateTicketStatus(BaseModel):
    status: str


# ── Chat Route ────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured.")

    client = OpenAI(api_key=api_key)

    # Build message history for context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in (body.history or [])[-10:]:  # last 10 messages for context
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": body.message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.5,
        max_tokens=400,
    )

    reply = response.choices[0].message.content.strip()

    # Check if AI wants to create a ticket
    ticket_created = False
    ticket_id = None

    if "[CREATE_TICKET:" in reply:
        # Extract ticket title from AI response
        try:
            ticket_title = reply.split("[CREATE_TICKET:")[1].split("]")[0].strip()
        except Exception:
            ticket_title = body.message[:100]

        # Create the ticket
        ticket = models.SupportTicket(
            user_id=current_user.id,
            title=ticket_title,
            description=body.message,
            status="open",
            priority="medium",
        )
        db.add(ticket)
        db.flush()

        # Save conversation as ticket messages
        for h in (body.history or [])[-6:]:
            if h.get("role") in ("user", "assistant"):
                db.add(models.TicketMessage(
                    ticket_id=ticket.id,
                    role=h["role"],
                    content=h["content"],
                ))
        db.add(models.TicketMessage(
            ticket_id=ticket.id,
            role="user",
            content=body.message,
        ))
        db.commit()

        ticket_created = True
        ticket_id = ticket.id
        reply = f"I've created a support ticket (#{ticket.id}) for your issue: **{ticket_title}**. Our team will follow up with you soon. You can track it in the Support section."

    return ChatResponse(reply=reply, ticket_created=ticket_created, ticket_id=ticket_id)


# ── Ticket Routes ─────────────────────────────────────────────────────────────

@router.get("/tickets", response_model=List[TicketOut])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    tickets = (
        db.query(models.SupportTicket)
        .filter(models.SupportTicket.user_id == current_user.id)
        .order_by(models.SupportTicket.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "created_at": t.created_at.isoformat(),
            "message_count": len(t.messages),
        }
        for t in tickets
    ]


@router.post("/tickets", response_model=TicketOut)
def create_ticket(
    body: CreateTicketRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    ticket = models.SupportTicket(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "created_at": ticket.created_at.isoformat(),
        "message_count": 0,
    }


@router.patch("/tickets/{ticket_id}", response_model=TicketOut)
def update_ticket_status(
    ticket_id: int,
    body: UpdateTicketStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id,
        models.SupportTicket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    valid_statuses = ["open", "in_progress", "resolved", "closed"]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    ticket.status = body.status
    db.commit()
    db.refresh(ticket)
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "created_at": ticket.created_at.isoformat(),
        "message_count": len(ticket.messages),
    }


@router.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    ticket = db.query(models.SupportTicket).filter(
        models.SupportTicket.id == ticket_id,
        models.SupportTicket.user_id == current_user.id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted"}
