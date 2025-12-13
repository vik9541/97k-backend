"""
Tests for GDPR Compliance Module - Phase 9 Day 3-4

Tests:
- export_user_data
- delete_user_data  
- restrict_processing
- get_data_locations
"""

import pytest
from unittest.mock import MagicMock, AsyncMock
from api.core.gdpr import GDPRManager
import os


@pytest.fixture
def gdpr_manager():
    """Mock GDPR manager"""
    mock_supabase = MagicMock()
    manager = GDPRManager(mock_supabase)
    return manager


@pytest.mark.asyncio
async def test_export_user_data(gdpr_manager):
    """Test data export creates ZIP"""
    export_id = await gdpr_manager.export_user_data(
        user_id="test-user-123",
        workspace_id="workspace-456",
        authorized_by="admin"
    )
    
    assert export_id is not None
    assert os.path.exists(f"exports/gdpr/{export_id}.zip")


@pytest.mark.asyncio
async def test_delete_user_data(gdpr_manager):
    """Test user data deletion (anonymization)"""
    operation_id = await gdpr_manager.delete_user_data(
        user_id="test-user-123",
        reason="User requested deletion",
        authorized_by="user"
    )
    
    assert operation_id is not None


@pytest.mark.asyncio
async def test_restrict_processing(gdpr_manager):
    """Test processing restriction"""
    success = await gdpr_manager.restrict_processing(
        user_id="test-user-123",
        authorized_by="user"
    )
    
    assert success is True


@pytest.mark.asyncio
async def test_get_data_locations(gdpr_manager):
    """Test data location transparency"""
    locations = await gdpr_manager.get_data_locations("test-user-123")
    
    assert "databases" in locations
    assert "file_storage" in locations
    assert "third_party" in locations


@pytest.mark.asyncio
async def test_export_status(gdpr_manager):
    """Test export status tracking"""
    export_id = "test-export-123"
    
    # Mock status
    gdpr_manager.supabase.table().select().eq().execute = MagicMock(
        return_value=MagicMock(data=[{"status": "completed"}])
    )
    
    status = await gdpr_manager.get_export_status(export_id)
    assert status is not None


@pytest.mark.asyncio
async def test_audit_trail_logging(gdpr_manager):
    """Test GDPR operations are logged"""
    await gdpr_manager._log_operation(
        user_id="test-user-123",
        operation_type="export_data",
        status="completed",
        details={"export_id": "test-123"},
        authorized_by="user"
    )
    
    # Verify log was created
    assert gdpr_manager.supabase.table.called
