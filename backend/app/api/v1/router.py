from fastapi import APIRouter
from app.api.v1 import auth, users, tenants, workspaces, projects, boards, tasks, labels, activity, dashboard, search

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(boards.router, prefix="/boards", tags=["Boards"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(labels.router, prefix="/labels", tags=["Labels"])
api_router.include_router(activity.router, prefix="/activity", tags=["Activity & Notifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
