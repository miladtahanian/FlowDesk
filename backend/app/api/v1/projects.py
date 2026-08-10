from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.repositories.project import ProjectRepository, ProjectMemberRepository
from app.repositories.invitation import ProjectInvitationRepository
from app.repositories.user import UserRepository
from app.schemas.project import (
    ProjectCreateRequest, ProjectUpdateRequest, ProjectResponse, ProjectDetailResponse,
    ProjectInviteRequest, ProjectInvitationResponse, ProjectMemberResponse,
)
from app.schemas.base import PaginatedResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectMember, ProjectInvitation
from app.utils.helpers import generate_slug

router = APIRouter()


@router.get("/workspace/{workspace_id}", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    workspace_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_repo = ProjectRepository(db)
    skip = (page - 1) * page_size
    projects, total = await project_repo.get_multi(
        skip=skip,
        limit=page_size,
        filters=[Project.workspace_id == workspace_id],
    )
    return PaginatedResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/workspace/{workspace_id}", response_model=ProjectResponse)
async def create_project(
    workspace_id: str,
    data: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_repo = ProjectRepository(db)
    slug = generate_slug(data.name)

    project = Project(
        workspace_id=workspace_id,
        name=data.name,
        slug=slug,
        description=data.description,
        color=data.color or "#10B981",
        icon=data.icon or "project",
        status=data.status or "planning",
        priority=data.priority or "medium",
        start_date=data.start_date,
        end_date=data.end_date,
        budget=data.budget,
        created_by=current_user.id,
    )
    project = await project_repo.create(project)

    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="admin",
    )
    member_repo = ProjectMemberRepository(db)
    await member_repo.create(member)

    return ProjectResponse.model_validate(project)


@router.get("/my-invitations", response_model=list[ProjectInvitationResponse])
async def list_my_invitations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invitation_repo = ProjectInvitationRepository(db)
    invitations = await invitation_repo.get_pending_by_user(current_user.id)
    result = []
    for inv in invitations:
        project_repo = ProjectRepository(db)
        project = await project_repo.get_by_id(inv.project_id)
        inv_data = ProjectInvitationResponse.model_validate(inv)
        inv_data.project_name = project.name if project else None
        result.append(inv_data)
    return result


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get_with_boards(project_id)
    if not project:
        raise NotFoundException("Project")
    return ProjectDetailResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get_by_id(project_id)
    if not project:
        raise NotFoundException("Project")
    updated = await project_repo.update(project, data.model_dump(exclude_unset=True))
    return ProjectResponse.model_validate(updated)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get_by_id(project_id)
    if not project:
        raise NotFoundException("Project")
    await project_repo.soft_delete(project)
    return {"message": "Project deleted"}


@router.get("/{project_id}/members", response_model=list[ProjectMemberResponse])
async def list_members(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member_repo = ProjectMemberRepository(db)
    members, _ = await member_repo.get_multi(filters=[ProjectMember.project_id == project_id])
    return [ProjectMemberResponse.model_validate(m) for m in members]


@router.post("/{project_id}/invite", response_model=ProjectInvitationResponse)
async def invite_member(
    project_id: str,
    data: ProjectInviteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_repo = ProjectRepository(db)
    project = await project_repo.get_by_id(project_id)
    if not project:
        raise NotFoundException("Project")

    member_repo = ProjectMemberRepository(db)
    is_member = await member_repo.get_by_project_and_user(project_id, current_user.id)
    if not is_member:
        raise BadRequestException("You must be a project member to invite others")

    user_repo = UserRepository(db)
    invited_user = None
    users, _ = await user_repo.get_multi(filters=[User.invitation_code == data.invitation_code])
    if users:
        invited_user = users[0]

    if not invited_user:
        raise NotFoundException("User with this invitation code")

    existing_member = await member_repo.get_by_project_and_user(project_id, invited_user.id)
    if existing_member:
        raise ConflictException("User is already a member of this project")

    invitation_repo = ProjectInvitationRepository(db)
    existing_invitation = await invitation_repo.get_pending_by_project_and_email(project_id, invited_user.email)
    if existing_invitation:
        raise ConflictException("Invitation already pending for this user")

    invitation = ProjectInvitation(
        project_id=project_id,
        invited_by=current_user.id,
        email=invited_user.email,
        invitation_code=data.invitation_code,
        status="pending",
    )
    invitation = await invitation_repo.create(invitation)

    from app.models.activity import Notification
    notification = Notification(
        user_id=invited_user.id,
        tenant_id=current_user.tenant_id,
        type="project_invitation",
        title="Project Invitation",
        message=f"You have been invited to join project {project.name}",
        entity_type="project",
        entity_id=project_id,
    )
    db.add(notification)
    await db.flush()

    return ProjectInvitationResponse.model_validate(invitation)


@router.post("/{project_id}/invitations/{invitation_id}/accept")
async def accept_invitation(
    project_id: str,
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invitation_repo = ProjectInvitationRepository(db)
    invitation = await invitation_repo.get_by_id(invitation_id)
    if not invitation or invitation.project_id != project_id:
        raise NotFoundException("Invitation")
    if invitation.email != current_user.email:
        raise BadRequestException("This invitation is not for you")
    if invitation.status != "pending":
        raise BadRequestException("Invitation already processed")

    member_repo = ProjectMemberRepository(db)
    existing = await member_repo.get_by_project_and_user(project_id, current_user.id)
    if existing:
        raise ConflictException("You are already a member")

    member = ProjectMember(
        project_id=project_id,
        user_id=current_user.id,
        role="member",
    )
    await member_repo.create(member)

    from datetime import datetime, timezone
    invitation.status = "accepted"
    invitation.responded_at = datetime.now(timezone.utc)
    await db.flush()

    return {"message": "Invitation accepted"}


@router.post("/{project_id}/invitations/{invitation_id}/decline")
async def decline_invitation(
    project_id: str,
    invitation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invitation_repo = ProjectInvitationRepository(db)
    invitation = await invitation_repo.get_by_id(invitation_id)
    if not invitation or invitation.project_id != project_id:
        raise NotFoundException("Invitation")
    if invitation.email != current_user.email:
        raise BadRequestException("This invitation is not for you")
    if invitation.status != "pending":
        raise BadRequestException("Invitation already processed")

    invitation.status = "declined"
    invitation.responded_at = datetime.now(timezone.utc)
    await db.flush()

    return {"message": "Invitation declined"}


@router.delete("/{project_id}/members/{user_id}")
async def remove_member(
    project_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member_repo = ProjectMemberRepository(db)
    admin_member = await member_repo.get_by_project_and_user(project_id, current_user.id)
    if not admin_member or admin_member.role != "admin":
        raise BadRequestException("Only project admins can remove members")

    member = await member_repo.get_by_project_and_user(project_id, user_id)
    if not member:
        raise NotFoundException("Member")
    if member.role == "admin":
        raise BadRequestException("Cannot remove project admin")

    await member_repo.delete(member)
    return {"message": "Member removed"}
