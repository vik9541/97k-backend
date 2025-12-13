"""
Tests for Analytics Module - Phase 9 Day 8-9

Tests:
- CLV calculation
- Health score
- Engagement trends
- Top contacts
"""

import pytest
from unittest.mock import MagicMock
from api.analytics.metrics import AnalyticsMetrics
from datetime import datetime, timedelta


@pytest.fixture
def analytics_manager():
    """Mock analytics manager"""
    mock_supabase = MagicMock()
    manager = AnalyticsMetrics(mock_supabase)
    return manager


@pytest.mark.asyncio
async def test_get_all_metrics(analytics_manager):
    """Test getting all analytics metrics"""
    metrics = await analytics_manager.get_metrics("workspace-123")
    
    assert "clv" in metrics
    assert "health_score" in metrics
    assert "engagement" in metrics
    assert "top_contacts" in metrics


@pytest.mark.asyncio
async def test_calculate_clv(analytics_manager):
    """Test CLV calculation"""
    # Mock contacts and interactions
    analytics_manager.supabase.table().select().eq().execute = MagicMock(
        return_value=MagicMock(data=[{"id": "contact-1"}])
    )
    
    clv = await analytics_manager.calculate_clv("workspace-123")
    
    assert "total_clv" in clv
    assert "avg_clv_per_contact" in clv
    assert "high_value_contacts" in clv


@pytest.mark.asyncio
async def test_health_score(analytics_manager):
    """Test health score calculation"""
    health = await analytics_manager.calculate_health_score("workspace-123")
    
    assert "overall_score" in health
    assert health["overall_score"] >= 0
    assert health["overall_score"] <= 100


@pytest.mark.asyncio
async def test_engagement_trends(analytics_manager):
    """Test engagement trend tracking"""
    trends = await analytics_manager.get_engagement_trends("workspace-123", days=30)
    
    assert "daily_counts" in trends
    assert "trend" in trends
    assert trends["trend"] in ["increasing", "decreasing", "stable", "insufficient_data"]


@pytest.mark.asyncio
async def test_top_contacts(analytics_manager):
    """Test top contacts ranking"""
    contacts = await analytics_manager.get_top_contacts("workspace-123", limit=5)
    
    assert isinstance(contacts, list)
    assert len(contacts) <= 5


@pytest.mark.asyncio
async def test_engagement_trend_calculation(analytics_manager):
    """Test trend calculation logic"""
    # Mock interactions with increasing trend
    mock_data = [
        {"occurred_at": (datetime.utcnow() - timedelta(days=i)).isoformat()}
        for i in range(30)
    ]
    
    analytics_manager.supabase.table().select().eq().gte().execute = MagicMock(
        return_value=MagicMock(data=mock_data)
    )
    
    trends = await analytics_manager.get_engagement_trends("workspace-123")
    assert len(trends["daily_counts"]) == 30
