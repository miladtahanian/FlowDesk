import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "username": "newuser",
        "full_name": "New User",
        "password": "password123",
        "tenant_name": "New Org",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "username": "user1",
        "full_name": "User 1",
        "password": "password123",
        "tenant_name": "Org 1",
    })
    response = await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "username": "user2",
        "full_name": "User 2",
        "password": "password123",
        "tenant_name": "Org 2",
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "full_name": "Login User",
        "password": "password123",
        "tenant_name": "Login Org",
    })
    response = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_workspace(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/workspaces/", json={
        "name": "Test Workspace",
        "description": "A test workspace",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Workspace"


@pytest.mark.asyncio
async def test_list_workspaces(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/workspaces/", json={"name": "WS1"}, headers=auth_headers)
    await client.post("/api/v1/workspaces/", json={"name": "WS2"}, headers=auth_headers)
    response = await client.get("/api/v1/workspaces/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, auth_headers: dict):
    ws_res = await client.post("/api/v1/workspaces/", json={"name": "For Project"}, headers=auth_headers)
    ws_id = ws_res.json()["id"]
    response = await client.post(f"/api/v1/projects/workspace/{ws_id}", json={
        "name": "Test Project",
        "description": "A test project",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"


@pytest.mark.asyncio
async def test_create_board(client: AsyncClient, auth_headers: dict):
    ws_res = await client.post("/api/v1/workspaces/", json={"name": "For Board"}, headers=auth_headers)
    ws_id = ws_res.json()["id"]
    proj_res = await client.post(f"/api/v1/projects/workspace/{ws_id}", json={"name": "Proj"}, headers=auth_headers)
    proj_id = proj_res.json()["id"]
    response = await client.post(f"/api/v1/boards/project/{proj_id}", json={
        "name": "Test Board",
        "type": "kanban",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Board"


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers: dict):
    ws_res = await client.post("/api/v1/workspaces/", json={"name": "For Task"}, headers=auth_headers)
    ws_id = ws_res.json()["id"]
    proj_res = await client.post(f"/api/v1/projects/workspace/{ws_id}", json={"name": "P"}, headers=auth_headers)
    proj_id = proj_res.json()["id"]
    board_res = await client.post(f"/api/v1/boards/project/{proj_id}", json={"name": "B"}, headers=auth_headers)
    board_id = board_res.json()["id"]
    board_detail = await client.get(f"/api/v1/boards/{board_id}", headers=auth_headers)
    columns = board_detail.json()["columns"]
    column_id = columns[0]["id"]
    response = await client.post("/api/v1/tasks/", json={
        "title": "Test Task",
        "column_id": column_id,
        "priority": "high",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["priority"] == "high"


@pytest.mark.asyncio
async def test_search(client: AsyncClient, auth_headers: dict):
    ws_res = await client.post("/api/v1/workspaces/", json={"name": "Searchable"}, headers=auth_headers)
    response = await client.get("/api/v1/search/", params={"q": "Searchable"}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["workspaces"]) >= 1


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, auth_headers: dict):
    response = await client.put("/api/v1/auth/change-password", json={
        "current_password": "password123",
        "new_password": "newpassword456",
    }, headers=auth_headers)
    assert response.status_code == 200

    login_res = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "newpassword456",
    })
    assert login_res.status_code == 200


@pytest.mark.asyncio
async def test_notifications(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/activity/notifications", headers=auth_headers)
    assert response.status_code == 200

    count_res = await client.get("/api/v1/activity/notifications/unread-count", headers=auth_headers)
    assert count_res.status_code == 200
    assert "count" in count_res.json()
