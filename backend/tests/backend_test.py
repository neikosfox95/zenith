"""Backend regression tests for Zenith TikTok analytics API (MongoDB-backed).

Covers:
- Creators routes (/api/creators/*)
- Analytics routes (/api/analytics/*)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://zenith-dashboard-3.preview.emergentagent.com").rstrip("/")
TIMEOUT = 30


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Creators ----------------
class TestCreators:
    def test_list_creators_returns_seeded(self, api):
        r = api.get(f"{BASE_URL}/api/creators/list", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        creators = body.get("creators") or body.get("data") or []
        usernames = {c.get("username") for c in creators}
        assert "darkskully" in usernames
        assert "streamerqueen" in usernames

    def test_add_creator_idempotent(self, api):
        r = api.post(f"{BASE_URL}/api/creators/add", json={"username": "testuser123"}, timeout=TIMEOUT)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body.get("success") is True

    def test_get_single_creator(self, api):
        r = api.get(f"{BASE_URL}/api/creators/testuser123", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        creator = body.get("creator") or body.get("data") or {}
        assert creator.get("username") == "testuser123"

    def test_remove_creator(self, api):
        r = api.post(f"{BASE_URL}/api/creators/remove", json={"username": "testuser123"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_status(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/status", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_creators_list(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creators", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_creator_overview(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/darkskully", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        data = body.get("data") or body
        assert data.get("creator") is not None
        # currentStream should be present (seeded live)
        assert "currentStream" in data or "stream" in data

    def test_creator_events(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/darkskully/events", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        events = body.get("events") or body.get("data") or []
        assert len(events) >= 1

    def test_top_gifters(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/darkskully/top-gifters", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        gifters = body.get("gifters") or body.get("data") or body.get("topGifters") or []
        assert len(gifters) >= 1

    def test_recent_gifts(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/darkskully/recent-gifts", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_viewer_trends(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/darkskully/viewer-trends", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        trends = body.get("trends") or body.get("data") or []
        assert len(trends) >= 1

    def test_streams(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/darkskully/streams", timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

    def test_nonexistent_creator_returns_404(self, api):
        r = api.get(f"{BASE_URL}/api/analytics/creator/nonexistent_xyz/events", timeout=TIMEOUT)
        assert r.status_code == 404, f"Expected 404 got {r.status_code}: {r.text}"
