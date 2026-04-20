#!/usr/bin/env python3
"""
Quick Backend API Test for 30-Phase Zenith Grade Super App
Tests key endpoints across all 30 phases to verify functionality
"""

import requests
import json
import time

# Backend URL
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class QuickAPITest:
    def __init__(self):
        self.token = None
        self.passed = 0
        self.failed = 0
        
    def test(self, name, url, method="GET", data=None, expected_status=[200]):
        """Test an endpoint"""
        if isinstance(expected_status, int):
            expected_status = [expected_status]
            
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        if data:
            headers['Content-Type'] = 'application/json'
            
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{url}", headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(f"{API_BASE}{url}", json=data, headers=headers, timeout=10)
            
            if response.status_code in expected_status:
                print(f"✅ {name}")
                self.passed += 1
                return True
            else:
                print(f"❌ {name} - Status: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ {name} - Error: {str(e)}")
            self.failed += 1
            return False
    
    def authenticate(self):
        """Get authentication token"""
        print("🔐 AUTHENTICATION")
        
        # Register user
        register_data = {
            "email": f"quicktest{int(time.time())}@test.com",
            "username": f"quicktest{int(time.time())}",
            "password": "TestPass123!"
        }
        
        try:
            response = requests.post(f"{API_BASE}/auth/register", json=register_data, timeout=10)
            if response.status_code in [200, 201]:
                data = response.json()
                self.token = data.get('token')
                print(f"✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def run_tests(self):
        """Run comprehensive tests"""
        print("🚀 QUICK BACKEND API TEST - ALL 30 PHASES")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            return
        
        print("\n📋 CORE INFRASTRUCTURE")
        self.test("Health Check", "/health")
        
        print("\n📋 PHASE 1-9: CORE FEATURES")
        self.test("Creators List", "/creators")
        self.test("Analytics Badges", "/badges")
        self.test("Code Models", "/code/models")
        self.test("Voice Models", "/voice/models")
        self.test("Image Models", "/media/image/models")
        self.test("Video Models", "/media/video/models")
        self.test("Audio Models", "/media/audio/models")
        
        print("\n📋 PHASE 10-20: ADVANCED FEATURES")
        self.test("3D Models", "/3d/models")
        self.test("Platform List", "/platforms/list")
        self.test("Workspaces", "/workspaces")
        self.test("AI Agents Create", "/agents/create", "POST", {
            "name": "Test Agent",
            "type": "creator",
            "model": "grok-4.3",
            "description": "Test agent"
        }, [200, 201])
        self.test("NFT Mint", "/nft/mint", "POST", {
            "content_url": "https://example.com/content.mp4",
            "metadata": {"title": "Test NFT"}
        }, [200, 201])
        self.test("AR Experience Create", "/ar/experience/create", "POST", {
            "name": "Test AR",
            "type": "face-filter"
        }, [200, 201])
        self.test("Video Project Create", "/video-editor/project/create", "POST", {
            "name": "Test Project",
            "resolution": "1080p",
            "fps": 30
        }, [200, 201])
        self.test("ML Dataset Create", "/ml/dataset/create", "POST", {
            "name": "Test Dataset",
            "type": "text"
        }, [200, 201])
        self.test("API Key Create", "/developer/keys/create", "POST", {
            "name": "Test Key",
            "permissions": ["read"]
        }, [200, 201])
        
        print("\n📋 PHASE 21-30: EXTENDED FEATURES")
        self.test("Gaming Leaderboard", "/gaming/leaderboard/create", "POST", {
            "name": "Test Board",
            "type": "points",
            "period": "weekly"
        }, [200, 201])
        self.test("E-commerce Product", "/ecommerce/products/create", "POST", {
            "name": "Test Product",
            "price": 29.99,
            "category": "digital"
        }, [200, 201])
        self.test("Health Metrics", "/health/metrics/log", "POST", {
            "metric": "heart_rate",
            "value": 72,
            "timestamp": int(time.time())
        }, [200, 201])
        self.test("Education Course", "/education/course/create", "POST", {
            "title": "Test Course",
            "description": "Test course",
            "duration": 60
        }, [200, 201])
        self.test("Finance Portfolio", "/finance/portfolio/add", "POST", {
            "symbol": "AAPL",
            "shares": 10,
            "price": 150.00
        }, [200, 201])
        self.test("Travel Planning", "/travel/trip/plan", "POST", {
            "destination": "Tokyo, Japan",
            "start_date": "2024-06-01",
            "end_date": "2024-06-07",
            "budget": 2000
        }, [200, 201])
        self.test("Smart Home Control", "/smarthome/device/control", "POST", {
            "device_id": "smart_light_01",
            "action": "turn_on",
            "parameters": {"brightness": 80}
        }, [200, 201])
        self.test("Legal Analysis", "/legal/contract/analyze", "POST", {
            "contract_text": "Test contract",
            "analysis_type": "risk_assessment"
        }, [200, 201])
        self.test("Sports Performance", "/sports/performance/log", "POST", {
            "sport": "running",
            "metric": "distance",
            "value": 5.2,
            "unit": "km",
            "timestamp": int(time.time())
        }, [200, 201])
        self.test("Carbon Calculation", "/environment/carbon/calculate", "POST", {
            "activity": "car_travel",
            "distance": 50,
            "fuel_type": "gasoline"
        }, [200, 201])
        
        print("\n" + "=" * 60)
        print("📊 QUICK TEST SUMMARY")
        print("=" * 60)
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Backend is production ready!")
        elif success_rate >= 75:
            print("✅ GOOD: Backend is mostly functional")
        elif success_rate >= 50:
            print("⚠️ FAIR: Backend has some issues")
        else:
            print("❌ POOR: Backend needs significant work")

if __name__ == "__main__":
    test = QuickAPITest()
    test.run_tests()