#!/usr/bin/env python3
"""
FINAL RATE LIMITING TEST - 100% EFFECTIVENESS VALIDATION
Tests the resolved rate limiting conflicts with exact specifications from review request
"""

import requests
import time
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import threading

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class RateLimitTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'RateLimit-Tester/1.0'
        })
        self.test_results = {}
        self.lock = threading.Lock()
        
    def log(self, message):
        """Thread-safe logging"""
        with self.lock:
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{timestamp}] {message}")
            
    def register_test_user(self):
        """Register a test user for authentication tests"""
        try:
            user_data = {
                "email": "ratelimit.test@example.com",
                "username": "ratelimittester",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(f"{API_BASE}/register", json=user_data)
            if response.status_code in [200, 201]:
                data = response.json()
                self.log(f"✅ Test user registered successfully")
                return data.get('token')
            elif response.status_code == 400 and "already exists" in response.text:
                # User exists, try to login
                login_data = {"email": user_data["email"], "password": user_data["password"]}
                login_response = self.session.post(f"{API_BASE}/login", json=login_data)
                if login_response.status_code == 200:
                    data = login_response.json()
                    self.log(f"✅ Test user logged in successfully")
                    return data.get('token')
            
            self.log(f"❌ Failed to register/login test user: {response.status_code}")
            return None
        except Exception as e:
            self.log(f"❌ Error registering test user: {e}")
            return None

    def test_api_limiter_300_requests(self):
        """TEST 1: API Limiter (300 requests / 15 min on /api/*) - 100% effectiveness"""
        self.log("🚀 Starting TEST 1: API Limiter (300 req/15min)")
        
        # Use an endpoint that should be rate limited (not health which is skipped)
        endpoint = f"{API_BASE}/badges"  # This endpoint should be rate limited
        success_count = 0
        rate_limited_count = 0
        auth_error_count = 0
        
        # Make exactly 301 requests rapidly
        for i in range(1, 302):
            try:
                response = self.session.get(endpoint)
                
                if response.status_code == 200:
                    success_count += 1
                    if i <= 300:
                        if i % 50 == 0:  # Log every 50th request
                            self.log(f"✅ Request {i}/301: SUCCESS (200)")
                    else:
                        self.log(f"❌ Request {i}/301: UNEXPECTED SUCCESS - Should be rate limited!")
                        
                elif response.status_code == 401:
                    # Auth error (expected for this endpoint)
                    auth_error_count += 1
                    if i <= 300:
                        if i % 50 == 0:  # Log every 50th request
                            self.log(f"✅ Request {i}/301: AUTH ERROR (401) - Counted")
                    else:
                        self.log(f"❌ Request {i}/301: UNEXPECTED AUTH ERROR - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    # Verify 429 response format
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log(f"❌ Request {i}/301: 429 response missing fields: {missing_fields}")
                    else:
                        if data.get('code') == 'API_RATE_LIMIT_EXCEEDED':
                            self.log(f"✅ Request {i}/301: API RATE LIMITED (429) - Proper format")
                        else:
                            self.log(f"❌ Request {i}/301: Wrong error code: {data.get('code')}")
                else:
                    self.log(f"❌ Request {i}/301: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/301: Exception - {e}")
                
            # Small delay to avoid overwhelming
            time.sleep(0.005)
        
        # Calculate effectiveness - EXACTLY 300/300 allowed, 301st blocked
        # Count both success and auth errors as "allowed" requests since they went through rate limiter
        allowed_requests = success_count + auth_error_count
        effectiveness = (allowed_requests / 300) * 100 if allowed_requests <= 300 else 0
        
        self.test_results['apiLimiter'] = {
            'success_count': success_count,
            'auth_error_count': auth_error_count,
            'rate_limited_count': rate_limited_count,
            'allowed_requests': allowed_requests,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0,
            'expected_allowed': 300,
            'expected_blocked': 1
        }
        
        self.log(f"📊 API Limiter Results:")
        self.log(f"   Success: {success_count}")
        self.log(f"   Auth Errors: {auth_error_count}")
        self.log(f"   Total Allowed: {allowed_requests}/300 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/1 expected")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        # 100% effectiveness means exactly 300 allowed, 301st blocked
        return allowed_requests == 300 and rate_limited_count >= 1

    def test_auth_limiter_10_requests(self):
        """TEST 2: Auth Limiter (10 requests / 15 min on /api/login) - 100% effectiveness"""
        self.log("🚀 Starting TEST 2: Auth Limiter (10 req/15min)")
        
        endpoint = f"{API_BASE}/login"
        success_count = 0
        rate_limited_count = 0
        auth_error_count = 0
        
        # Test data for login attempts (invalid credentials)
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        # Make exactly 11 login attempts
        for i in range(1, 12):
            try:
                response = self.session.post(endpoint, json=login_data)
                
                if response.status_code in [400, 401]:
                    # Invalid credentials (expected for first 10 attempts)
                    auth_error_count += 1
                    if i <= 10:
                        self.log(f"✅ Request {i}/11: AUTH ERROR ({response.status_code}) - Counted")
                    else:
                        self.log(f"❌ Request {i}/11: UNEXPECTED AUTH ERROR - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    # Verify 429 response format
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log(f"❌ Request {i}/11: 429 response missing fields: {missing_fields}")
                    else:
                        if data.get('code') == 'AUTH_RATE_LIMIT_EXCEEDED':
                            self.log(f"✅ Request {i}/11: AUTH RATE LIMITED (429) - Proper format")
                        else:
                            self.log(f"❌ Request {i}/11: Wrong error code: {data.get('code')}")
                        
                elif response.status_code == 200:
                    success_count += 1
                    self.log(f"❌ Request {i}/11: UNEXPECTED SUCCESS - Should be rate limited!")
                else:
                    self.log(f"❌ Request {i}/11: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/11: Exception - {e}")
                
            time.sleep(0.1)  # Slightly longer delay for auth
        
        # Calculate effectiveness - EXACTLY 10/10 allowed, 11th blocked
        effectiveness = (auth_error_count / 10) * 100 if auth_error_count <= 10 else 0
        
        self.test_results['authLimiter'] = {
            'auth_error_count': auth_error_count,
            'rate_limited_count': rate_limited_count,
            'success_count': success_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0,
            'expected_auth_errors': 10,
            'expected_blocked': 1
        }
        
        self.log(f"📊 Auth Limiter Results:")
        self.log(f"   Auth Errors: {auth_error_count}/10 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/1 expected")
        self.log(f"   Unexpected Success: {success_count}")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        # 100% effectiveness means exactly 10 allowed, 11th blocked
        return auth_error_count == 10 and rate_limited_count >= 1

    def test_ai_limiter_50_requests(self):
        """TEST 3: AI Limiter (50 requests / hour on AI endpoints) - 100% effectiveness"""
        self.log("🚀 Starting TEST 3: AI Limiter (50 req/hour)")
        
        # Get auth token first
        token = self.register_test_user()
        if not token:
            self.log("❌ Cannot test AI limiter without authentication")
            return False
            
        headers = {'Authorization': f'Bearer {token}'}
        endpoint = f"{API_BASE}/media/image/generate"  # AI endpoint that requires auth
        success_count = 0
        rate_limited_count = 0
        auth_error_count = 0
        
        # Test data for AI generation
        ai_data = {
            "prompt": "A beautiful sunset",
            "model": "nano-banana-2"
        }
        
        # Make exactly 51 requests to AI endpoint
        for i in range(1, 52):
            try:
                response = self.session.post(endpoint, json=ai_data, headers=headers)
                
                if response.status_code == 200:
                    success_count += 1
                    if i <= 50:
                        if i % 10 == 0:  # Log every 10th request
                            self.log(f"✅ Request {i}/51: SUCCESS (200)")
                    else:
                        self.log(f"❌ Request {i}/51: UNEXPECTED SUCCESS - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    # Verify 429 response format
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log(f"❌ Request {i}/51: 429 response missing fields: {missing_fields}")
                    else:
                        if data.get('code') == 'AI_RATE_LIMIT_EXCEEDED':
                            self.log(f"✅ Request {i}/51: AI RATE LIMITED (429) - Proper format")
                        else:
                            self.log(f"❌ Request {i}/51: Wrong error code: {data.get('code')}")
                        
                elif response.status_code == 401:
                    auth_error_count += 1
                    self.log(f"❌ Request {i}/51: AUTH ERROR (401)")
                else:
                    self.log(f"❌ Request {i}/51: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/51: Exception - {e}")
                
            time.sleep(0.02)
        
        # Calculate effectiveness - EXACTLY 50/50 allowed, 51st blocked
        effectiveness = (success_count / 50) * 100 if success_count <= 50 else 0
        
        self.test_results['aiLimiter'] = {
            'success_count': success_count,
            'rate_limited_count': rate_limited_count,
            'auth_error_count': auth_error_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0,
            'expected_success': 50,
            'expected_blocked': 1
        }
        
        self.log(f"📊 AI Limiter Results:")
        self.log(f"   Success: {success_count}/50 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/1 expected")
        self.log(f"   Auth Errors: {auth_error_count}")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        # 100% effectiveness means exactly 50 allowed, 51st blocked
        return success_count == 50 and rate_limited_count >= 1

    def test_independent_operation(self):
        """TEST 4: Independent Operation Verification"""
        self.log("🚀 Starting TEST 4: Independent Operation Verification")
        
        # First, make 300 requests to /api/badges (apiLimiter) - not health which is skipped
        self.log("   Phase 1: Testing apiLimiter independence...")
        endpoint_api = f"{API_BASE}/badges"
        api_success_count = 0
        api_auth_error_count = 0
        
        for i in range(1, 301):
            try:
                response = self.session.get(endpoint_api)
                if response.status_code == 200:
                    api_success_count += 1
                    if i % 100 == 0:
                        self.log(f"   ✅ API Request {i}/300: SUCCESS")
                elif response.status_code == 401:
                    api_auth_error_count += 1
                    if i % 100 == 0:
                        self.log(f"   ✅ API Request {i}/300: AUTH ERROR (counted)")
                elif response.status_code == 429:
                    self.log(f"   ❌ API Request {i}/300: UNEXPECTED RATE LIMIT")
                    break
            except Exception as e:
                self.log(f"   ❌ API Request {i}/300: Exception - {e}")
            time.sleep(0.005)
        
        # Then, make 10 requests to /api/login (authLimiter) - should work independently
        self.log("   Phase 2: Testing authLimiter independence...")
        endpoint_login = f"{API_BASE}/login"
        auth_attempt_count = 0
        login_data = {"email": "test@example.com", "password": "wrongpassword"}
        
        for i in range(1, 11):
            try:
                response = self.session.post(endpoint_login, json=login_data)
                if response.status_code in [400, 401]:
                    auth_attempt_count += 1
                    self.log(f"   ✅ Auth Request {i}/10: AUTH ERROR (independent counter)")
                elif response.status_code == 429:
                    self.log(f"   ❌ Auth Request {i}/10: UNEXPECTED RATE LIMIT")
                    break
            except Exception as e:
                self.log(f"   ❌ Auth Request {i}/10: Exception - {e}")
            time.sleep(0.1)
        
        # Calculate independence effectiveness
        api_allowed = api_success_count + api_auth_error_count
        api_effectiveness = (api_allowed / 300) * 100
        auth_effectiveness = (auth_attempt_count / 10) * 100
        
        self.test_results['independence'] = {
            'api_success_count': api_success_count,
            'api_auth_error_count': api_auth_error_count,
            'api_allowed': api_allowed,
            'auth_attempt_count': auth_attempt_count,
            'api_effectiveness': api_effectiveness,
            'auth_effectiveness': auth_effectiveness,
            'independent_operation': api_effectiveness >= 100 and auth_effectiveness >= 100
        }
        
        self.log(f"📊 Independence Test Results:")
        self.log(f"   API Limiter: {api_allowed}/300 requests allowed ({api_effectiveness:.1f}%)")
        self.log(f"   Auth Limiter: {auth_attempt_count}/10 requests succeeded ({auth_effectiveness:.1f}%)")
        
        return api_effectiveness >= 100 and auth_effectiveness >= 100

    def test_rate_limit_headers(self):
        """TEST 5: Rate Limit Headers Verification"""
        self.log("🚀 Starting TEST 5: Rate Limit Headers")
        
        endpoint = f"{API_BASE}/health"
        headers_found = []
        
        try:
            response = self.session.get(endpoint)
            
            # Check for standard rate limit headers
            expected_headers = ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
            
            for header in expected_headers:
                if header in response.headers:
                    headers_found.append(header)
                    self.log(f"✅ Header found: {header} = {response.headers[header]}")
                else:
                    self.log(f"❌ Missing header: {header}")
            
            # Check X-RateLimit headers (alternative format)
            alt_headers = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
            for header in alt_headers:
                if header in response.headers:
                    headers_found.append(header)
                    self.log(f"✅ Alt header found: {header} = {response.headers[header]}")
                    
        except Exception as e:
            self.log(f"❌ Error testing headers: {e}")
            
        self.test_results['headers'] = {
            'headers_found': headers_found,
            'total_found': len(headers_found)
        }
        
        return len(headers_found) >= 3

    def test_429_response_format(self):
        """TEST 6: 429 Response Format Verification"""
        self.log("🚀 Starting TEST 6: 429 Response Format")
        
        # Force a 429 by making many requests quickly
        endpoint = f"{API_BASE}/login"
        login_data = {"email": "test@example.com", "password": "wrong"}
        
        format_valid = False
        
        # Make requests until we get a 429
        for i in range(15):
            try:
                response = self.session.post(endpoint, json=login_data)
                
                if response.status_code == 429:
                    data = response.json()
                    
                    # Verify required fields
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log(f"✅ 429 Response format valid:")
                        self.log(f"   error: {data.get('error')}")
                        self.log(f"   message: {data.get('message')}")
                        self.log(f"   code: {data.get('code')}")
                        self.log(f"   retryAfter: {data.get('retryAfter')}")
                        self.log(f"   timestamp: {data.get('timestamp')}")
                        format_valid = True
                        break
                    else:
                        self.log(f"❌ 429 Response missing fields: {missing_fields}")
                        break
                        
            except Exception as e:
                self.log(f"❌ Error testing 429 format: {e}")
                
            time.sleep(0.1)
        
        if not format_valid:
            self.log("❌ Could not verify 429 response format")
            
        self.test_results['response_format'] = {
            'format_valid': format_valid
        }
        
        return format_valid

    def run_all_tests(self):
        """Run all rate limiting tests according to review request specifications"""
        self.log("🎯 FINAL RATE LIMITING TEST - 100% EFFECTIVENESS VALIDATION")
        self.log("=" * 70)
        self.log("Testing resolved rate limiting conflicts with exact specifications")
        self.log("=" * 70)
        
        start_time = time.time()
        
        # Run the exact tests specified in the review request
        self.log("\n🔥 CRITICAL FIXES APPLIED:")
        self.log("   ✅ Removed global speedLimiter")
        self.log("   ✅ Route-specific limiters only")
        self.log("   ✅ Proper middleware ordering")
        self.log("   ✅ No overlapping limiters")
        
        # TEST 1: API Limiter (300 requests / 15 min)
        test1_pass = self.test_api_limiter_300_requests()
        time.sleep(2)
        
        # TEST 2: Auth Limiter (10 requests / 15 min)
        test2_pass = self.test_auth_limiter_10_requests()
        time.sleep(2)
        
        # TEST 3: AI Limiter (50 requests / hour)
        test3_pass = self.test_ai_limiter_50_requests()
        time.sleep(2)
        
        # TEST 4: Independent Operation Verification
        test4_pass = self.test_independent_operation()
        time.sleep(1)
        
        # TEST 5: 429 Response Validation
        test5_pass = self.test_429_response_format()
        
        end_time = time.time()
        
        # Final Results
        self.log("=" * 70)
        self.log("🏁 FINAL RESULTS - 100% EFFECTIVENESS VALIDATION")
        self.log("=" * 70)
        
        all_tests_passed = True
        
        # Check each test result
        tests = [
            ("TEST 1: API Limiter (300 req/15min)", test1_pass, "apiLimiter"),
            ("TEST 2: Auth Limiter (10 req/15min)", test2_pass, "authLimiter"),
            ("TEST 3: AI Limiter (50 req/hour)", test3_pass, "aiLimiter"),
            ("TEST 4: Independent Operation", test4_pass, "independence"),
            ("TEST 5: 429 Response Format", test5_pass, "response_format")
        ]
        
        for test_name, passed, result_key in tests:
            if passed:
                self.log(f"✅ {test_name}: PASSED")
                if result_key in self.test_results:
                    effectiveness = self.test_results[result_key].get('effectiveness', 100)
                    self.log(f"   Effectiveness: {effectiveness:.1f}%")
            else:
                self.log(f"❌ {test_name}: FAILED")
                all_tests_passed = False
                if result_key in self.test_results:
                    effectiveness = self.test_results[result_key].get('effectiveness', 0)
                    self.log(f"   Effectiveness: {effectiveness:.1f}%")
        
        # Overall assessment
        self.log("=" * 70)
        if all_tests_passed:
            self.log("🎉 ALL TESTS PASSED - 100% RATE LIMITING EFFECTIVENESS ACHIEVED!")
            self.log("🚀 TARGET METRICS ACHIEVED:")
            self.log("   ✅ apiLimiter: 100% effectiveness (not 24.7%)")
            self.log("   ✅ authLimiter: 100% effectiveness (not 0%)")
            self.log("   ✅ aiLimiter: 100% effectiveness (testable now)")
            self.log("   ✅ Independent operation without conflicts")
            self.log("   ✅ Consistent 429 responses")
        else:
            self.log("❌ SOME TESTS FAILED - RATE LIMITING NEEDS IMPROVEMENT")
            self.log("🔧 Issues found that require fixing:")
            for test_name, passed, result_key in tests:
                if not passed:
                    self.log(f"   ❌ {test_name}")
            
        self.log(f"⏱️  Total test time: {end_time - start_time:.2f} seconds")
        
        return all_tests_passed

if __name__ == "__main__":
    tester = RateLimitTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)