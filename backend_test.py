#!/usr/bin/env python3
"""
Comprehensive backend test suite for TikTok Live Monitor with Advanced Fan Club Features.
Tests all API endpoints as specified in the review request.
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001"
API_BASE_URL = f"{BASE_URL}/api"

# Test data
TEST_USER = {
    "email": f"test_{int(time.time())}@example.com",
    "username": f"testuser_{int(time.time())}",
    "password": "password123"
}

TEST_CREATOR = {
    "tiktok_username": "darkskully"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    print(f"{color}{message}{Colors.END}")

def log_success(message):
    log(f"✅ {message}", Colors.GREEN)

def log_error(message):
    log(f"❌ {message}", Colors.RED)

def log_warning(message):
    log(f"⚠️  {message}", Colors.YELLOW)

def log_info(message):
    log(f"ℹ️  {message}", Colors.BLUE)

def make_request(method, url, **kwargs):
    """Make HTTP request with error handling"""
    try:
        response = requests.request(method, url, timeout=30, **kwargs)
        return response
    except requests.exceptions.RequestException as e:
        log_error(f"Request failed: {e}")
        return None

def test_health_check():
    """Test 1: Health Check Endpoint"""
    log_info("Testing health check endpoint...")
    
    response = make_request("GET", f"{API_BASE_URL}/health")
    
    if not response:
        return False
    
    if response.status_code == 200:
        data = response.json()
        if data.get("status") == "ok" and data.get("database") == "connected":
            log_success(f"Health check passed - Status: {data['status']}, Database: {data['database']}")
            return True
        else:
            log_error(f"Health check data invalid: {data}")
            return False
    else:
        log_error(f"Health check failed - Status: {response.status_code}, Body: {response.text}")
        return False

def test_user_registration():
    """Test 2: User Registration"""
    log_info("Testing user registration...")
    
    response = make_request("POST", f"{API_BASE_URL}/auth/register", 
                          json=TEST_USER)
    
    if not response:
        return False, None
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data and "user" in data:
            log_success(f"Registration successful - User ID: {data['user']['id']}")
            return True, data["token"]
        else:
            log_error(f"Registration response missing token/user: {data}")
            return False, None
    else:
        log_error(f"Registration failed - Status: {response.status_code}, Body: {response.text}")
        return False, None

def test_user_login(token):
    """Test 3: User Login"""
    log_info("Testing user login...")
    
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    response = make_request("POST", f"{API_BASE_URL}/auth/login", 
                          json=login_data)
    
    if not response:
        return False, token
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data and "user" in data:
            log_success(f"Login successful - User: {data['user']['username']}")
            return True, data["token"]
        else:
            log_error(f"Login response missing token/user: {data}")
            return False, token
    else:
        log_error(f"Login failed - Status: {response.status_code}, Body: {response.text}")
        return False, token

def test_add_creator(token):
    """Test 4: Add Creator"""
    log_info("Testing add creator...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = make_request("POST", f"{API_BASE_URL}/creators",
                          json=TEST_CREATOR, headers=headers)
    
    if not response:
        return False, None
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success") and "creator" in data:
            creator_id = str(data["creator"]["_id"])
            log_success(f"Creator added successfully - ID: {creator_id}")
            return True, creator_id
        else:
            log_error(f"Add creator response invalid: {data}")
            return False, None
    else:
        log_error(f"Add creator failed - Status: {response.status_code}, Body: {response.text}")
        return False, None

def test_get_creators(token):
    """Test 5: Get Creators List"""
    log_info("Testing get creators list...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = make_request("GET", f"{API_BASE_URL}/creators", headers=headers)
    
    if not response:
        return False
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            log_success(f"Retrieved {len(data)} creators")
            return True
        else:
            log_error(f"Creators response not a list: {data}")
            return False
    else:
        log_error(f"Get creators failed - Status: {response.status_code}, Body: {response.text}")
        return False

def test_fan_club_endpoints(token, creator_id):
    """Test 6-10: Fan Club Endpoints"""
    log_info("Testing fan club endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    fan_endpoints = [
        ("fans", f"{API_BASE_URL}/creators/{creator_id}/fans"),
        ("superfans", f"{API_BASE_URL}/creators/{creator_id}/superfans"),
        ("fanclub stats", f"{API_BASE_URL}/creators/{creator_id}/fanclub/stats"),
        ("diamonds leaderboard", f"{API_BASE_URL}/creators/{creator_id}/leaderboard?type=diamonds"),
        ("gifts leaderboard", f"{API_BASE_URL}/creators/{creator_id}/leaderboard?type=gifts"),
        ("chats leaderboard", f"{API_BASE_URL}/creators/{creator_id}/leaderboard?type=chats")
    ]
    
    results = []
    
    for endpoint_name, url in fan_endpoints:
        response = make_request("GET", url, headers=headers)
        
        if not response:
            results.append(False)
            continue
            
        if response.status_code == 200:
            data = response.json()
            # For fan endpoints, empty arrays are expected initially
            if isinstance(data, list) or isinstance(data, dict):
                log_success(f"{endpoint_name} endpoint working - Response type: {type(data).__name__}")
                results.append(True)
            else:
                log_error(f"{endpoint_name} endpoint returned invalid data: {data}")
                results.append(False)
        else:
            log_error(f"{endpoint_name} endpoint failed - Status: {response.status_code}, Body: {response.text}")
            results.append(False)
    
    return all(results)

def test_badges_endpoint(token):
    """Test 11: Badges Endpoint"""
    log_info("Testing badges endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = make_request("GET", f"{API_BASE_URL}/badges", headers=headers)
    
    if not response:
        return False
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            log_success(f"Badges endpoint working - Found {len(data)} badge definitions")
            # Log first few badges for verification
            for badge in data[:3]:
                if "name" in badge and "description" in badge:
                    log_info(f"  Badge: {badge['name']} - {badge['description']}")
            return True
        else:
            log_error(f"Badges endpoint returned invalid data: {data}")
            return False
    else:
        log_error(f"Badges endpoint failed - Status: {response.status_code}, Body: {response.text}")
        return False

def test_socket_io_connection():
    """Test 12: Socket.IO Connection"""
    log_info("Testing Socket.IO connection...")
    
    try:
        import socketio
        sio = socketio.SimpleClient(logger=False, engineio_logger=False)
        
        # Try to connect with timeout
        sio.connect(BASE_URL, wait_timeout=10)
        
        if sio.connected:
            log_success("Socket.IO connection successful")
            sio.disconnect()
            return True
        else:
            log_error("Socket.IO connection failed - not connected")
            return False
            
    except ImportError:
        log_warning("Socket.IO test skipped - python-socketio not installed")
        log_info("Attempting HTTP test to Socket.IO endpoint...")
        
        # Fallback: Test if Socket.IO endpoint responds
        response = make_request("GET", f"{BASE_URL}/socket.io/", timeout=5)
        
        if response and response.status_code in [200, 400, 426]:  # 426 = Upgrade Required, 400 = Transport unknown (both expected for Socket.IO)
            log_success(f"Socket.IO endpoint accessible - Status: {response.status_code}")
            return True
        else:
            log_error(f"Socket.IO endpoint not accessible - Status: {response.status_code if response else 'No response'}")
            return False
            
    except Exception as e:
        log_error(f"Socket.IO connection failed: {e}")
        return False

def test_authentication_required_endpoints():
    """Test 13: Verify endpoints require authentication"""
    log_info("Testing authentication requirements...")
    
    protected_endpoints = [
        f"{API_BASE_URL}/creators",
        f"{API_BASE_URL}/creators/test_id/fans",
        f"{API_BASE_URL}/badges"
    ]
    
    results = []
    for endpoint in protected_endpoints:
        response = make_request("GET", endpoint)
        
        if response and response.status_code == 401:
            log_success(f"Authentication properly required for {endpoint}")
            results.append(True)
        elif response:
            log_error(f"Authentication not required for {endpoint} - Status: {response.status_code}")
            results.append(False)
        else:
            log_error(f"Could not test authentication for {endpoint}")
            results.append(False)
    
    return all(results)

def run_all_tests():
    """Run all backend tests"""
    log(f"\n{Colors.BOLD}🚀 Starting TikTok Live Monitor Backend Tests{Colors.END}")
    log(f"{Colors.BOLD}{'=' * 60}{Colors.END}")
    
    test_results = []
    token = None
    creator_id = None
    
    # Test 1: Health Check
    test_results.append(test_health_check())
    
    # Test 2-3: Authentication Flow
    success, token = test_user_registration()
    test_results.append(success)
    
    if token:
        success, token = test_user_login(token)
        test_results.append(success)
    else:
        log_error("Skipping login test - registration failed")
        test_results.append(False)
    
    # Test 4-5: Creator Management
    if token:
        success, creator_id = test_add_creator(token)
        test_results.append(success)
        
        test_results.append(test_get_creators(token))
    else:
        log_error("Skipping creator tests - authentication failed")
        test_results.extend([False, False])
    
    # Test 6-10: Fan Club Endpoints
    if token and creator_id:
        test_results.append(test_fan_club_endpoints(token, creator_id))
    else:
        log_error("Skipping fan club tests - missing token or creator_id")
        test_results.append(False)
    
    # Test 11: Badges
    if token:
        test_results.append(test_badges_endpoint(token))
    else:
        log_error("Skipping badges test - no authentication token")
        test_results.append(False)
    
    # Test 12: Socket.IO
    test_results.append(test_socket_io_connection())
    
    # Test 13: Authentication Requirements
    test_results.append(test_authentication_required_endpoints())
    
    # Summary
    log(f"\n{Colors.BOLD}📊 Test Results Summary{Colors.END}")
    log(f"{Colors.BOLD}{'=' * 60}{Colors.END}")
    
    passed = sum(test_results)
    total = len(test_results)
    
    log(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        log_success("🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        failed = total - passed
        log_error(f"❌ {failed} test(s) failed. Backend needs attention.")
        return False

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        log_warning("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Unexpected error during testing: {e}")
        sys.exit(1)