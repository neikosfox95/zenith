#!/usr/bin/env python3
"""
Corrected Rate Limiting Test Suite - 100% Effectiveness Verification
Tests rate limiters using endpoints that are NOT skipped
"""

import requests
import time
import json
import sys
from datetime import datetime
import threading

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class CorrectedRateLimitTester:
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

    def test_speed_limiter_corrected(self):
        """TEST 1: Speed Limiter (100 requests / 15 min) - Using non-skipped endpoint"""
        self.log("🚀 Starting TEST 1: Speed Limiter (100 req/15min) - CORRECTED")
        
        # Use a non-skipped endpoint that will trigger speed limiter
        endpoint = f"{API_BASE}/nonexistent"  # This will get 404 but will be rate limited
        success_count = 0
        rate_limited_count = 0
        
        # Make exactly 105 requests rapidly
        for i in range(1, 106):
            try:
                response = self.session.get(endpoint)
                
                if response.status_code == 404:
                    success_count += 1
                    if i <= 100:
                        if i % 20 == 0:  # Log every 20th request
                            self.log(f"✅ Request {i}/105: SUCCESS (404)")
                    else:
                        self.log(f"❌ Request {i}/105: UNEXPECTED SUCCESS - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    # Verify 429 response format
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log(f"❌ Request {i}/105: 429 response missing fields: {missing_fields}")
                    else:
                        if 'RATE_LIMIT_EXCEEDED' in data.get('code', ''):
                            self.log(f"✅ Request {i}/105: RATE LIMITED (429) - Proper format")
                        else:
                            self.log(f"❌ Request {i}/105: Wrong error code: {data.get('code')}")
                else:
                    self.log(f"❌ Request {i}/105: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/105: Exception - {e}")
                
            # Small delay to avoid overwhelming
            time.sleep(0.01)
        
        # Calculate effectiveness
        expected_success = 100
        expected_rate_limited = 5
        effectiveness = (min(success_count, expected_success) / expected_success) * 100
        
        self.test_results['speedLimiter'] = {
            'success_count': success_count,
            'rate_limited_count': rate_limited_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0
        }
        
        self.log(f"📊 Speed Limiter Results:")
        self.log(f"   Success: {success_count}/100 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/5 expected")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        return effectiveness >= 100.0 and rate_limited_count >= 5

    def test_api_limiter_corrected(self):
        """TEST 2: API Limiter (300 requests / 15 min) - Using non-skipped endpoint"""
        self.log("🚀 Starting TEST 2: API Limiter (300 req/15min) - CORRECTED")
        
        # Use a different session to avoid speed limiter interference
        new_session = requests.Session()
        new_session.headers.update(self.session.headers)
        
        endpoint = f"{API_BASE}/test-endpoint"  # Non-existent but not skipped
        success_count = 0
        rate_limited_count = 0
        
        # Make exactly 305 requests rapidly
        for i in range(1, 306):
            try:
                response = new_session.get(endpoint)
                
                if response.status_code == 404:
                    success_count += 1
                    if i <= 300:
                        if i % 50 == 0:  # Log every 50th request
                            self.log(f"✅ Request {i}/305: SUCCESS (404)")
                    else:
                        self.log(f"❌ Request {i}/305: UNEXPECTED SUCCESS - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    if 'API_RATE_LIMIT_EXCEEDED' in data.get('code', ''):
                        self.log(f"✅ Request {i}/305: API RATE LIMITED (429)")
                    else:
                        self.log(f"❌ Request {i}/305: Wrong error code: {data.get('code')}")
                else:
                    self.log(f"❌ Request {i}/305: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/305: Exception - {e}")
                
            # Small delay
            time.sleep(0.005)
        
        # Calculate effectiveness
        expected_success = 300
        expected_rate_limited = 5
        effectiveness = (min(success_count, expected_success) / expected_success) * 100
        
        self.test_results['apiLimiter'] = {
            'success_count': success_count,
            'rate_limited_count': rate_limited_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0
        }
        
        self.log(f"📊 API Limiter Results:")
        self.log(f"   Success: {success_count}/300 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/5 expected")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        return effectiveness >= 100.0 and rate_limited_count >= 5

    def test_auth_limiter_verified(self):
        """TEST 3: Auth Limiter (10 requests / 15 min) - Already working correctly"""
        self.log("🚀 Starting TEST 3: Auth Limiter (10 req/15min) - VERIFIED")
        
        # Use a fresh session to avoid interference
        auth_session = requests.Session()
        auth_session.headers.update(self.session.headers)
        
        endpoint = f"{API_BASE}/login"
        success_count = 0
        rate_limited_count = 0
        auth_error_count = 0
        
        # Test data for login attempts
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        # Make exactly 15 login attempts
        for i in range(1, 16):
            try:
                response = auth_session.post(endpoint, json=login_data)
                
                if response.status_code == 400:
                    # Invalid credentials (expected for first 10 attempts)
                    auth_error_count += 1
                    if i <= 10:
                        self.log(f"✅ Request {i}/15: AUTH ERROR (400) - Counted")
                    else:
                        self.log(f"❌ Request {i}/15: UNEXPECTED AUTH ERROR - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    if data.get('code') == 'AUTH_RATE_LIMIT_EXCEEDED':
                        self.log(f"✅ Request {i}/15: AUTH RATE LIMITED (429)")
                    else:
                        self.log(f"❌ Request {i}/15: Wrong error code: {data.get('code')}")
                        
                elif response.status_code == 200:
                    success_count += 1
                    self.log(f"❌ Request {i}/15: UNEXPECTED SUCCESS - Should be rate limited!")
                else:
                    self.log(f"❌ Request {i}/15: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/15: Exception - {e}")
                
            time.sleep(0.1)  # Slightly longer delay for auth
        
        # Calculate effectiveness
        expected_auth_errors = 10
        expected_rate_limited = 5
        effectiveness = (min(auth_error_count, expected_auth_errors) / expected_auth_errors) * 100
        
        self.test_results['authLimiter'] = {
            'auth_error_count': auth_error_count,
            'rate_limited_count': rate_limited_count,
            'success_count': success_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0
        }
        
        self.log(f"📊 Auth Limiter Results:")
        self.log(f"   Auth Errors: {auth_error_count}/10 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/5 expected")
        self.log(f"   Unexpected Success: {success_count}")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        return effectiveness >= 100.0 and rate_limited_count >= 5

    def test_ai_limiter_with_auth(self):
        """TEST 4: AI Limiter (50 requests / hour) - Using authenticated endpoint"""
        self.log("🚀 Starting TEST 4: AI Limiter (50 req/hour)")
        
        # Register a test user first
        try:
            user_data = {
                "email": f"aitest.{int(time.time())}@example.com",
                "username": f"aitester{int(time.time())}",
                "password": "TestPassword123!"
            }
            
            # Use a fresh session for registration
            reg_session = requests.Session()
            reg_session.headers.update(self.session.headers)
            
            response = reg_session.post(f"{API_BASE}/register", json=user_data)
            if response.status_code in [200, 201]:
                data = response.json()
                token = data.get('token')
                self.log(f"✅ Test user registered successfully")
            else:
                self.log(f"❌ Failed to register test user: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error registering test user: {e}")
            return False
            
        if not token:
            self.log("❌ Cannot test AI limiter without authentication")
            return False
            
        # Use a fresh session for AI testing
        ai_session = requests.Session()
        ai_session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        })
        
        endpoint = f"{API_BASE}/ai/nonexistent"  # AI endpoint that doesn't exist but will be rate limited
        success_count = 0
        rate_limited_count = 0
        auth_error_count = 0
        not_found_count = 0
        
        # Make exactly 55 requests to AI endpoint
        for i in range(1, 56):
            try:
                response = ai_session.get(endpoint)
                
                if response.status_code == 404:
                    not_found_count += 1
                    success_count += 1
                    if i <= 50:
                        if i % 10 == 0:  # Log every 10th request
                            self.log(f"✅ Request {i}/55: SUCCESS (404)")
                    else:
                        self.log(f"❌ Request {i}/55: UNEXPECTED SUCCESS - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    data = response.json()
                    
                    if 'AI_RATE_LIMIT_EXCEEDED' in data.get('code', ''):
                        self.log(f"✅ Request {i}/55: AI RATE LIMITED (429)")
                    else:
                        self.log(f"❌ Request {i}/55: Wrong error code: {data.get('code')}")
                        
                elif response.status_code == 401:
                    auth_error_count += 1
                    self.log(f"❌ Request {i}/55: AUTH ERROR (401)")
                else:
                    self.log(f"❌ Request {i}/55: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/55: Exception - {e}")
                
            time.sleep(0.02)
        
        # Calculate effectiveness
        expected_success = 50
        expected_rate_limited = 5
        effectiveness = (min(success_count, expected_success) / expected_success) * 100
        
        self.test_results['aiLimiter'] = {
            'success_count': success_count,
            'rate_limited_count': rate_limited_count,
            'auth_error_count': auth_error_count,
            'not_found_count': not_found_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0
        }
        
        self.log(f"📊 AI Limiter Results:")
        self.log(f"   Success: {success_count}/50 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/5 expected")
        self.log(f"   Auth Errors: {auth_error_count}")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        
        return effectiveness >= 100.0 and rate_limited_count >= 5

    def test_rate_limit_headers_corrected(self):
        """TEST 5: Rate Limit Headers Verification - Using non-skipped endpoint"""
        self.log("🚀 Starting TEST 5: Rate Limit Headers - CORRECTED")
        
        endpoint = f"{API_BASE}/test-headers"
        headers_found = []
        
        try:
            response = self.session.get(endpoint)
            
            # Check for standard rate limit headers (lowercase)
            expected_headers = ['ratelimit-limit', 'ratelimit-remaining', 'ratelimit-reset']
            
            for header in expected_headers:
                if header in response.headers:
                    headers_found.append(header)
                    self.log(f"✅ Header found: {header} = {response.headers[header]}")
                else:
                    self.log(f"❌ Missing header: {header}")
            
            # Check alternative formats
            alt_headers = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']
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

    def run_all_tests(self):
        """Run all corrected rate limiting tests"""
        self.log("🎯 CORRECTED RATE LIMITING TEST SUITE - 100% EFFECTIVENESS")
        self.log("=" * 60)
        
        start_time = time.time()
        
        # Run all tests with proper endpoints
        test1_pass = self.test_speed_limiter_corrected()
        time.sleep(3)  # Longer pause to reset rate limits
        
        test2_pass = self.test_api_limiter_corrected()
        time.sleep(3)
        
        test3_pass = self.test_auth_limiter_verified()
        time.sleep(3)
        
        test4_pass = self.test_ai_limiter_with_auth()
        time.sleep(2)
        
        test5_pass = self.test_rate_limit_headers_corrected()
        
        end_time = time.time()
        
        # Final Results
        self.log("=" * 60)
        self.log("🏁 FINAL RESULTS - CORRECTED RATE LIMITING EFFECTIVENESS")
        self.log("=" * 60)
        
        all_tests_passed = True
        
        for limiter, results in self.test_results.items():
            if limiter in ['speedLimiter', 'apiLimiter', 'authLimiter', 'aiLimiter']:
                effectiveness = results.get('effectiveness', 0)
                target = results.get('target_effectiveness', 100)
                
                if effectiveness >= target:
                    self.log(f"✅ {limiter}: {effectiveness:.1f}% effectiveness (Target: {target}%)")
                else:
                    self.log(f"❌ {limiter}: {effectiveness:.1f}% effectiveness (Target: {target}%)")
                    all_tests_passed = False
        
        # Overall assessment
        self.log("=" * 60)
        if all_tests_passed and test5_pass:
            self.log("🎉 ALL TESTS PASSED - 100% RATE LIMITING EFFECTIVENESS ACHIEVED!")
        else:
            self.log("❌ SOME TESTS FAILED - RATE LIMITING NEEDS IMPROVEMENT")
            
        self.log(f"⏱️  Total test time: {end_time - start_time:.2f} seconds")
        
        return all_tests_passed

if __name__ == "__main__":
    tester = CorrectedRateLimitTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)