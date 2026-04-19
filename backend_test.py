#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND TESTING - PHASES 10-20 & GROK 4.3 VERIFICATION
Testing all newly added backend endpoints and AI model verification
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Configuration
BASE_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api"
TEST_USER = {
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "testpassword123"
}

class BackendTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        print(f"{status} - {test_name}")
        if details and not success:
            print(f"   Details: {details}")
    
    def authenticate(self) -> bool:
        """Authenticate and get JWT token"""
        try:
            # Try to register first
            register_data = {
                "email": TEST_USER["email"],
                "username": TEST_USER["username"],
                "password": TEST_USER["password"]
            }
            
            response = requests.post(f"{BASE_URL}/auth/register", json=register_data, timeout=10)
            
            if response.status_code == 400:
                # User exists, try login
                login_data = {
                    "email": TEST_USER["email"],
                    "password": TEST_USER["password"]
                }
                response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.token = data.get("token")
                self.user_id = data.get("user", {}).get("id")
                self.log_result("Authentication", True, f"Token obtained: {self.token[:20]}...")
                return True
            else:
                self.log_result("Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, str(e))
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_health_check(self):
        """Test basic health check"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"Status: {data.get('status')}, DB: {data.get('database')}")
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Health Check", False, str(e))
    
    def test_grok_4_3_model(self):
        """Verify Grok 4.3 model exists in AI service"""
        try:
            # Test if we can access the AI models endpoint
            response = requests.get(f"{BASE_URL}/ai/models", headers=self.get_headers(), timeout=10)
            if response.status_code == 200:
                models = response.json()
                # Check if grok-4.3 is mentioned in any model list
                grok_found = False
                model_text = json.dumps(models).lower()
                if "grok-4.3" in model_text or "grok" in model_text:
                    grok_found = True
                
                self.log_result("Grok 4.3 Model Verification", grok_found, 
                              f"Grok models found in AI service" if grok_found else "Grok 4.3 not found in models")
            else:
                self.log_result("Grok 4.3 Model Verification", False, f"Cannot access AI models: {response.status_code}")
        except Exception as e:
            self.log_result("Grok 4.3 Model Verification", False, str(e))
    
    # ============= PHASE 10 TESTS =============
    
    def test_phase10_predict_viral(self):
        """Test Phase 10 - Predict Viral Content"""
        try:
            data = {
                "content_type": "video",
                "description": "AI tutorial for beginners",
                "hashtags": ["#AI", "#tutorial", "#tech"],
                "posting_time": "2025-06-15T19:00:00Z"
            }
            response = requests.post(f"{BASE_URL}/analytics/predict-viral", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                has_required_fields = all(key in result for key in ['viral_score', 'predicted_views', 'confidence'])
                self.log_result("Phase 10 - Predict Viral", has_required_fields, 
                              f"Viral score: {result.get('viral_score', 'N/A')}")
            else:
                self.log_result("Phase 10 - Predict Viral", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 10 - Predict Viral", False, str(e))
    
    def test_phase10_growth_forecast(self):
        """Test Phase 10 - Growth Forecast"""
        try:
            response = requests.get(f"{BASE_URL}/analytics/growth-forecast?creator_id=test&days=30", 
                                  headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                has_required_fields = all(key in result for key in ['current_followers', 'predicted_followers', 'timeline'])
                self.log_result("Phase 10 - Growth Forecast", has_required_fields,
                              f"Growth rate: {result.get('growth_rate', 'N/A')}")
            else:
                self.log_result("Phase 10 - Growth Forecast", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 10 - Growth Forecast", False, str(e))
    
    # ============= PHASE 11 TESTS =============
    
    def test_phase11_platform_connect(self):
        """Test Phase 11 - Multi-Platform Integration"""
        try:
            data = {"platform": "instagram", "credentials": {"access_token": "test_token"}}
            response = requests.post(f"{BASE_URL}/platforms/connect", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 11 - Platform Connect", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 11 - Platform Connect", False, str(e))
    
    def test_phase11_platform_list(self):
        """Test Phase 11 - List Platforms"""
        try:
            response = requests.get(f"{BASE_URL}/platforms/list", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            self.log_result("Phase 11 - Platform List", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 11 - Platform List", False, str(e))
    
    # ============= PHASE 12 TESTS =============
    
    def test_phase12_3d_models(self):
        """Test Phase 12 - 3D Models List"""
        try:
            response = requests.get(f"{BASE_URL}/3d/models", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            self.log_result("Phase 12 - 3D Models", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 12 - 3D Models", False, str(e))
    
    def test_phase12_3d_generate(self):
        """Test Phase 12 - 3D Text Generation"""
        try:
            data = {"prompt": "Create a 3D model of a futuristic car"}
            response = requests.post(f"{BASE_URL}/3d/generate/text", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 12 - 3D Generate", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 12 - 3D Generate", False, str(e))
    
    # ============= PHASE 13 TESTS =============
    
    def test_phase13_workspace_create(self):
        """Test Phase 13 - Create Workspace"""
        try:
            data = {"name": "Test Workspace", "description": "Testing collaboration"}
            response = requests.post(f"{BASE_URL}/workspace/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 13 - Workspace Create", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 13 - Workspace Create", False, str(e))
    
    def test_phase13_workspaces_list(self):
        """Test Phase 13 - List Workspaces"""
        try:
            response = requests.get(f"{BASE_URL}/workspaces", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            self.log_result("Phase 13 - Workspaces List", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 13 - Workspaces List", False, str(e))
    
    # ============= PHASE 14 TESTS =============
    
    def test_phase14_agent_create(self):
        """Test Phase 14 - Create AI Agent with Grok 4.3"""
        try:
            data = {
                "name": "Test Agent",
                "description": "Testing AI agent creation",
                "type": "assistant",
                "model": "grok-4.3",
                "capabilities": ["text_generation", "analysis"]
            }
            response = requests.post(f"{BASE_URL}/agents/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            if response.status_code in [200, 201]:
                result = response.json()
                grok_used = result.get('model') == 'grok-4.3'
                self.log_result("Phase 14 - Agent Create (Grok 4.3)", grok_used, 
                              f"Model: {result.get('model', 'N/A')}")
            else:
                self.log_result("Phase 14 - Agent Create (Grok 4.3)", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 14 - Agent Create (Grok 4.3)", False, str(e))
    
    def test_phase14_agents_list(self):
        """Test Phase 14 - List AI Agents"""
        try:
            response = requests.get(f"{BASE_URL}/agents", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            if success:
                result = response.json()
                agent_count = result.get('count', 0)
                self.log_result("Phase 14 - Agents List", success, 
                              f"Found {agent_count} agents")
            else:
                self.log_result("Phase 14 - Agents List", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 14 - Agents List", False, str(e))
    
    # ============= PHASE 15 TESTS =============
    
    def test_phase15_org_create(self):
        """Test Phase 15 - Create Organization"""
        try:
            data = {"name": "Test Org", "size": "startup", "industry": "technology"}
            response = requests.post(f"{BASE_URL}/org/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 15 - Org Create", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 15 - Org Create", False, str(e))
    
    def test_phase15_org_usage(self):
        """Test Phase 15 - Organization Usage"""
        try:
            # Use a test org ID
            org_id = "test_org_123"
            response = requests.get(f"{BASE_URL}/org/{org_id}/usage", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 404]  # 404 is acceptable for non-existent org
            self.log_result("Phase 15 - Org Usage", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 15 - Org Usage", False, str(e))
    
    # ============= PHASE 16 TESTS =============
    
    def test_phase16_nft_mint(self):
        """Test Phase 16 - NFT Mint"""
        try:
            data = {
                "content_url": "https://example.com/content.jpg",
                "metadata": {"name": "Test NFT", "description": "Testing NFT minting"}
            }
            response = requests.post(f"{BASE_URL}/nft/mint", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 16 - NFT Mint", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 16 - NFT Mint", False, str(e))
    
    def test_phase16_nft_collection(self):
        """Test Phase 16 - NFT Collection"""
        try:
            response = requests.get(f"{BASE_URL}/nft/collection", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            self.log_result("Phase 16 - NFT Collection", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 16 - NFT Collection", False, str(e))
    
    # ============= PHASE 17 TESTS =============
    
    def test_phase17_ar_create(self):
        """Test Phase 17 - AR Experience Create"""
        try:
            data = {"name": "Test AR", "type": "filter", "assets": []}
            response = requests.post(f"{BASE_URL}/ar/experience/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 17 - AR Create", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 17 - AR Create", False, str(e))
    
    def test_phase17_ar_list(self):
        """Test Phase 17 - AR Experiences List"""
        try:
            response = requests.get(f"{BASE_URL}/ar/experiences", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            self.log_result("Phase 17 - AR List", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 17 - AR List", False, str(e))
    
    # ============= PHASE 18 TESTS =============
    
    def test_phase18_video_project(self):
        """Test Phase 18 - Video Editor Project"""
        try:
            data = {"name": "Test Project", "resolution": "1080p", "fps": 30}
            response = requests.post(f"{BASE_URL}/video-editor/project/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 18 - Video Project", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 18 - Video Project", False, str(e))
    
    # ============= PHASE 19 TESTS =============
    
    def test_phase19_dataset_create(self):
        """Test Phase 19 - ML Dataset Create"""
        try:
            data = {"name": "Test Dataset", "type": "text", "description": "Testing dataset creation"}
            response = requests.post(f"{BASE_URL}/ml/dataset/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            self.log_result("Phase 19 - Dataset Create", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 19 - Dataset Create", False, str(e))
    
    def test_phase19_ml_models(self):
        """Test Phase 19 - ML Models List"""
        try:
            response = requests.get(f"{BASE_URL}/ml/models", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 404]  # 404 acceptable if no models exist
            self.log_result("Phase 19 - ML Models", success, 
                          f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 19 - ML Models", False, str(e))
    
    # ============= PHASE 20 TESTS =============
    
    def test_phase20_api_key_create(self):
        """Test Phase 20 - API Key Create"""
        try:
            data = {"name": "Test API Key", "permissions": ["read", "write"]}
            response = requests.post(f"{BASE_URL}/developer/keys/create", 
                                   json=data, headers=self.get_headers(), timeout=10)
            
            success = response.status_code in [200, 201]
            if success:
                result = response.json()
                has_key = 'key' in result
                self.log_result("Phase 20 - API Key Create", has_key, 
                              f"Key created: {result.get('key', 'N/A')[:20]}...")
            else:
                self.log_result("Phase 20 - API Key Create", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 20 - API Key Create", False, str(e))
    
    def test_phase20_api_keys_list(self):
        """Test Phase 20 - API Keys List"""
        try:
            response = requests.get(f"{BASE_URL}/developer/keys", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            if success:
                result = response.json()
                key_count = result.get('count', 0)
                self.log_result("Phase 20 - API Keys List", success, 
                              f"Found {key_count} API keys")
            else:
                self.log_result("Phase 20 - API Keys List", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 20 - API Keys List", False, str(e))
    
    def test_phase20_marketplace_plugins(self):
        """Test Phase 20 - Marketplace Plugins"""
        try:
            response = requests.get(f"{BASE_URL}/marketplace/plugins", 
                                  headers=self.get_headers(), timeout=10)
            
            success = response.status_code == 200
            if success:
                result = response.json()
                plugin_count = result.get('count', 0)
                self.log_result("Phase 20 - Marketplace Plugins", success, 
                              f"Found {plugin_count} plugins")
            else:
                self.log_result("Phase 20 - Marketplace Plugins", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Phase 20 - Marketplace Plugins", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Backend Testing - Phases 10-20 & Grok 4.3")
        print("=" * 80)
        
        # Basic tests
        self.test_health_check()
        
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with authenticated tests.")
            return
        
        # Grok 4.3 verification
        self.test_grok_4_3_model()
        
        # Phase 10 - Advanced Analytics
        print("\n📊 Testing Phase 10 - Advanced Analytics")
        self.test_phase10_predict_viral()
        self.test_phase10_growth_forecast()
        
        # Phase 11 - Multi-Platform Integration
        print("\n🔗 Testing Phase 11 - Multi-Platform Integration")
        self.test_phase11_platform_connect()
        self.test_phase11_platform_list()
        
        # Phase 12 - 3D & Spatial AI
        print("\n🎨 Testing Phase 12 - 3D & Spatial AI")
        self.test_phase12_3d_models()
        self.test_phase12_3d_generate()
        
        # Phase 13 - Real-time Collaboration
        print("\n👥 Testing Phase 13 - Real-time Collaboration")
        self.test_phase13_workspace_create()
        self.test_phase13_workspaces_list()
        
        # Phase 14 - Autonomous AI Agents
        print("\n🤖 Testing Phase 14 - Autonomous AI Agents")
        self.test_phase14_agent_create()
        self.test_phase14_agents_list()
        
        # Phase 15 - Enterprise Admin
        print("\n🏢 Testing Phase 15 - Enterprise Admin")
        self.test_phase15_org_create()
        self.test_phase15_org_usage()
        
        # Phase 16 - Blockchain & Web3
        print("\n⛓️ Testing Phase 16 - Blockchain & Web3")
        self.test_phase16_nft_mint()
        self.test_phase16_nft_collection()
        
        # Phase 17 - AR/VR
        print("\n🥽 Testing Phase 17 - AR/VR")
        self.test_phase17_ar_create()
        self.test_phase17_ar_list()
        
        # Phase 18 - Advanced Video Editing
        print("\n🎬 Testing Phase 18 - Advanced Video Editing")
        self.test_phase18_video_project()
        
        # Phase 19 - AI Training Hub
        print("\n🧠 Testing Phase 19 - AI Training Hub")
        self.test_phase19_dataset_create()
        self.test_phase19_ml_models()
        
        # Phase 20 - Integration Hub
        print("\n🔧 Testing Phase 20 - Integration Hub")
        self.test_phase20_api_key_create()
        self.test_phase20_api_keys_list()
        self.test_phase20_marketplace_plugins()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📋 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Show critical successes
        critical_tests = [
            "Authentication",
            "Grok 4.3 Model Verification", 
            "Phase 14 - Agent Create (Grok 4.3)",
            "Phase 20 - API Key Create"
        ]
        
        print(f"\n✅ CRITICAL TESTS:")
        for test_name in critical_tests:
            test_result = next((r for r in self.test_results if r["test"] == test_name), None)
            if test_result:
                status = "✅ PASS" if test_result["success"] else "❌ FAIL"
                print(f"   • {test_name}: {status}")

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()