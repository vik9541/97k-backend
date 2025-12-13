"""
Tests for Gmail Integration - Phase 9 Day 6-7

Tests:
- OAuth flow
- Email sync
- Contact enrichment
- Interaction tracking
"""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from api.integrations.gmail_sync import GmailSyncManager


@pytest.fixture
def gmail_manager():
    """Mock Gmail manager"""
    mock_supabase = MagicMock()
    manager = GmailSyncManager(mock_supabase)
    return manager


@pytest.mark.asyncio
async def test_get_auth_url(gmail_manager):
    """Test OAuth URL generation"""
    auth_url = await gmail_manager.get_auth_url("test-user-123")
    
    assert auth_url is not None
    assert "accounts.google.com" in auth_url
    assert "scope=" in auth_url


@pytest.mark.asyncio
@patch('api.integrations.gmail_sync.Flow')
async def test_oauth_callback(mock_flow, gmail_manager):
    """Test OAuth token exchange"""
    mock_flow.return_value.fetch_token = MagicMock()
    mock_flow.return_value.credentials.token = "access_token_123"
    mock_flow.return_value.credentials.refresh_token = "refresh_token_123"
    
    success = await gmail_manager.handle_oauth_callback(
        code="oauth_code_123",
        user_id="test-user-123"
    )
    
    assert success is True


@pytest.mark.asyncio
async def test_sync_contacts_and_interactions(gmail_manager):
    """Test email sync processes messages"""
    # Mock Gmail service
    with patch.object(gmail_manager, '_get_gmail_service') as mock_service:
        mock_service.return_value.users().messages().list().execute.return_value = {
            "messages": [{"id": "msg1"}, {"id": "msg2"}]
        }
        
        result = await gmail_manager.sync_contacts_and_interactions(
            user_id="test-user-123",
            workspace_id="workspace-456",
            max_emails=10
        )
        
        assert "contacts_enriched" in result
        assert "interactions_tracked" in result


@pytest.mark.asyncio
async def test_enrich_contact(gmail_manager):
    """Test contact enrichment with Gmail data"""
    contact_data = await gmail_manager.enrich_contact("contact-123")
    
    assert contact_data is not None


@pytest.mark.asyncio
async def test_get_sync_status(gmail_manager):
    """Test sync status retrieval"""
    # Mock database response
    gmail_manager.supabase.table().select().eq().execute = MagicMock(
        return_value=MagicMock(data=[{"enabled": True, "last_sync_at": "2025-01-10"}])
    )
    
    status = await gmail_manager.get_sync_status("test-user-123")
    
    assert status["connected"] is True


@pytest.mark.asyncio
async def test_disconnect(gmail_manager):
    """Test Gmail disconnection"""
    success = await gmail_manager.disconnect("test-user-123")
    
    assert success is True


@pytest.mark.asyncio
async def test_extract_emails(gmail_manager):
    """Test email address extraction"""
    email_string = "John Doe <john@example.com>, jane@example.com"
    emails = gmail_manager._extract_emails(email_string)
    
    assert len(emails) == 2
    assert ("John Doe", "john@example.com") in emails
