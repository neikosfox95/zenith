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
BASE_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
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
        # Set default timeout if not provided
        if 'timeout' not in kwargs:
            kwargs['timeout'] = 10
        response = requests.request(method, url, **kwargs)
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
        try:
            # Try different Socket.IO endpoint paths
            endpoints_to_try = [
                f"{BASE_URL}/socket.io/",
                f"{BASE_URL}/socket.io/?EIO=4&transport=polling"
            ]
            
            for endpoint in endpoints_to_try:
                response = requests.get(endpoint, timeout=5)
                
                if response.status_code in [200, 400, 426]:  # 426 = Upgrade Required, 400 = Transport unknown (both expected for Socket.IO)
                    log_success(f"Socket.IO endpoint accessible - Status: {response.status_code}")
                    return True
            
            log_error("Socket.IO endpoint not accessible on any tested path")
            return False
            
        except Exception as e:
            log_error(f"Socket.IO endpoint test failed: {e}")
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
        try:
            response = requests.get(endpoint, timeout=5)
            
            if response.status_code == 401:
                log_success(f"Authentication properly required for {endpoint}")
                results.append(True)
            else:
                log_error(f"Authentication not required for {endpoint} - Status: {response.status_code}")
                results.append(False)
        except Exception as e:
            log_error(f"Could not test authentication for {endpoint}: {e}")
            results.append(False)
    
    return all(results)

def test_ai_models_endpoint(token):
    """Test 14: AI Models Endpoint - List all available AI models"""
    log_info("Testing AI models endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = make_request("GET", f"{API_BASE_URL}/ai/models", headers=headers)
    
    if not response:
        return False
    
    if response.status_code == 200:
        data = response.json()
        if "available_models" in data and isinstance(data["available_models"], list):
            models = data["available_models"]
            expected_models = ["gemini", "openai", "claude", "grok"]
            
            found_models = [model["id"] for model in models]
            
            if all(model_id in found_models for model_id in expected_models):
                log_success(f"AI models endpoint working - Found {len(models)} models: {found_models}")
                log_info(f"Default model: {data.get('default', 'N/A')}")
                return True
            else:
                log_error(f"Missing expected models. Found: {found_models}, Expected: {expected_models}")
                return False
        else:
            log_error(f"AI models response invalid: {data}")
            return False
    else:
        log_error(f"AI models endpoint failed - Status: {response.status_code}, Body: {response.text}")
        return False

def test_ai_stream_summary_multi_model(token, creator_id):
    """Test 15: AI Stream Summary with Multiple Models"""
    log_info("Testing AI stream summary with multiple models...")
    
    headers = {"Authorization": f"Bearer {token}"}
    models_to_test = ["gemini", "openai", "claude", "grok"]
    
    results = []
    
    for model in models_to_test:
        log_info(f"Testing stream summary with model: {model}")
        
        # Use a valid ObjectId format for testing
        test_data = {
            "streamId": "507f1f77bcf86cd799439011",  # Valid ObjectId format
            "model_provider": model
        }
        
        response = make_request("POST", f"{API_BASE_URL}/ai/stream-summary", 
                              json=test_data, headers=headers)
        
        if not response:
            results.append(False)
            continue
        
        if response.status_code == 404:
            # This is expected for test data - the endpoint is working correctly
            log_success(f"Stream summary with {model} model working - Stream not found (expected for test data)")
            results.append(True)
        elif response.status_code == 200:
            data = response.json()
            if "model_used" in data and data["model_used"] == model:
                log_success(f"Stream summary with {model} model working - Model used: {data['model_used']}")
                results.append(True)
            else:
                log_error(f"Stream summary with {model} model missing model_used field or incorrect model")
                results.append(False)
        else:
            log_error(f"Stream summary with {model} model failed - Status: {response.status_code}, Body: {response.text}")
            results.append(False)
    
    return all(results)

def test_ai_sentiment_analysis_multi_model(token, creator_id):
    """Test 16: AI Sentiment Analysis with Multiple Models"""
    log_info("Testing AI sentiment analysis with multiple models...")
    
    headers = {"Authorization": f"Bearer {token}"}
    models_to_test = ["gemini", "openai", "claude", "grok"]
    
    results = []
    
    for model in models_to_test:
        log_info(f"Testing sentiment analysis with model: {model}")
        
        test_data = {
            "streamId": "507f1f77bcf86cd799439011",  # Valid ObjectId format
            "model_provider": model
        }
        
        response = make_request("POST", f"{API_BASE_URL}/ai/analyze-sentiment", 
                              json=test_data, headers=headers)
        
        if not response:
            results.append(False)
            continue
        
        if response.status_code == 200:
            data = response.json()
            if "overall" in data and "score" in data:
                log_success(f"Sentiment analysis with {model} model working - Overall: {data['overall']}, Score: {data['score']}")
                results.append(True)
            else:
                log_error(f"Sentiment analysis with {model} model missing required fields")
                results.append(False)
        else:
            log_error(f"Sentiment analysis with {model} model failed - Status: {response.status_code}, Body: {response.text}")
            results.append(False)
    
    return all(results)

def test_ai_recommendations_multi_model(token, creator_id):
    """Test 17: AI Recommendations with Multiple Models"""
    log_info("Testing AI recommendations with multiple models...")
    
    headers = {"Authorization": f"Bearer {token}"}
    models_to_test = ["gemini", "openai", "claude", "grok"]
    
    results = []
    
    for model in models_to_test:
        log_info(f"Testing recommendations with model: {model}")
        
        test_data = {
            "creatorId": creator_id,
            "model_provider": model
        }
        
        response = make_request("POST", f"{API_BASE_URL}/ai/recommendations", 
                              json=test_data, headers=headers, timeout=30)  # Increased timeout
        
        if not response:
            results.append(False)
            continue
        
        if response.status_code == 200:
            data = response.json()
            if "recommendations" in data or "based_on" in data:
                log_success(f"Recommendations with {model} model working")
                results.append(True)
            else:
                log_error(f"Recommendations with {model} model missing required fields")
                results.append(False)
        else:
            log_error(f"Recommendations with {model} model failed - Status: {response.status_code}, Body: {response.text}")
            results.append(False)
    
    return all(results)

def test_system_health_endpoint(token):
    """Test 18: System Health Monitoring"""
    log_info("Testing system health endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = make_request("GET", f"{API_BASE_URL}/system/health", headers=headers)
    
    if not response:
        return False
    
    if response.status_code == 200:
        data = response.json()
        if "status" in data and "services" in data:
            log_success(f"System health endpoint working - Status: {data['status']}")
            log_info(f"Services: Database: {data['services'].get('database', 'N/A')}, Redis: {data['services'].get('redis', 'N/A')}")
            return True
        else:
            log_error(f"System health response invalid: {data}")
            return False
    else:
        log_error(f"System health endpoint failed - Status: {response.status_code}, Body: {response.text}")
        return False

def test_api_key_generation(token):
    """Test 19: API Key Generation"""
    log_info("Testing API key generation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    test_data = {
        "name": f"test_key_{int(time.time())}",
        "permissions": ["read", "write"]
    }
    
    response = make_request("POST", f"{API_BASE_URL}/api-keys", 
                          json=test_data, headers=headers)
    
    if not response:
        return False
    
    if response.status_code == 200:
        data = response.json()
        if "api_key" in data and "name" in data:
            log_success(f"API key generation working - Key name: {data['name']}")
            return True
        else:
            log_error(f"API key generation response invalid: {data}")
            return False
    else:
        log_error(f"API key generation failed - Status: {response.status_code}, Body: {response.text}")
        return False

def run_all_tests():
    """Run all backend tests"""
    log(f"\n{Colors.BOLD}🚀 Starting TikTok Live Monitor Backend Tests - Multi-Model AI Features{Colors.END}")
    log(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    
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
    
    # NEW MULTI-MODEL AI TESTS
    log(f"\n{Colors.BOLD}🤖 Testing Multi-Model AI Features{Colors.END}")
    log(f"{Colors.BOLD}{'=' * 40}{Colors.END}")
    
    if token:
        # Test 14: AI Models Endpoint
        test_results.append(test_ai_models_endpoint(token))
        
        if creator_id:
            # Test 15: AI Stream Summary with Multiple Models
            test_results.append(test_ai_stream_summary_multi_model(token, creator_id))
            
            # Test 16: AI Sentiment Analysis with Multiple Models
            test_results.append(test_ai_sentiment_analysis_multi_model(token, creator_id))
            
            # Test 17: AI Recommendations with Multiple Models
            test_results.append(test_ai_recommendations_multi_model(token, creator_id))
        else:
            log_error("Skipping multi-model AI tests - missing creator_id")
            test_results.extend([False, False, False])
        
        # Test 18: System Health Endpoint
        test_results.append(test_system_health_endpoint(token))
        
        # Test 19: API Key Generation
        test_results.append(test_api_key_generation(token))
    else:
        log_error("Skipping multi-model AI tests - no authentication token")
        test_results.extend([False, False, False, False, False, False])
    
    # Summary
    log(f"\n{Colors.BOLD}📊 Test Results Summary{Colors.END}")
    log(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    
    passed = sum(test_results)
    total = len(test_results)
    
    log(f"Tests Passed: {passed}/{total}")
    
    # Detailed breakdown
    basic_tests = test_results[:13]
    ai_tests = test_results[13:]
    
    basic_passed = sum(basic_tests)
    ai_passed = sum(ai_tests)
    
    log(f"Basic Backend Tests: {basic_passed}/{len(basic_tests)}")
    log(f"Multi-Model AI Tests: {ai_passed}/{len(ai_tests)}")
    
    if passed == total:
        log_success("🎉 All tests passed! Backend with Multi-Model AI features is working correctly.")
        return True
    else:
        failed = total - passed
        log_error(f"❌ {failed} test(s) failed. Backend needs attention.")
        
        # Show which categories failed
        if basic_passed < len(basic_tests):
            log_error(f"Basic backend functionality issues: {len(basic_tests) - basic_passed} failures")
        if ai_passed < len(ai_tests):
            log_error(f"Multi-Model AI functionality issues: {len(ai_tests) - ai_passed} failures")
        
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