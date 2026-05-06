#!/usr/bin/env python3
"""
Sprint 2 Phase 5 & 6 Testing - AI Studio + Socket.IO
Testing real AI integration and Socket.IO functionality
"""

import requests
import json
import time

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api"

class Sprint2Phase5And6Tester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} - {test_name}"
        if details:
            result += f": {details}"
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
    def setup_auth(self):
        """Setup authentication for testing"""
        print("\n🔐 Setting up authentication...")
        
        # Register test user
        register_data = {
            "email": "aistudiotester@tiktok.com",
            "username": "aistudiotester",
            "password": "AIStudio123!"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/register", json=register_data)
            if response.status_code in [200, 201]:
                self.log_result("User Registration", True, "Test user created successfully")
            elif response.status_code == 400 and "already exists" in response.text:
                self.log_result("User Registration", True, "Test user already exists")
            else:
                self.log_result("User Registration", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("User Registration", False, f"Error: {str(e)}")
            return False
            
        # Login to get token
        login_data = {
            "email": "aistudiotester@tiktok.com",
            "password": "AIStudio123!"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.user_id = data.get('userId')
                self.log_result("User Login", True, f"Token obtained, User ID: {self.user_id}")
                return True
            else:
                self.log_result("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("User Login", False, f"Error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_ai_studio_text_generation_gpt55(self):
        """Test 1: AI Studio Text Generation with GPT-5.5"""
        print("\n🤖 Testing AI Studio Text Generation (GPT-5.5)...")
        
        try:
            payload = {
                "model": "gpt-5.5",
                "messages": [{"role": "user", "content": "Say hello"}]
            }
            
            response = requests.post(
                f"{BACKEND_URL}/ai-studio/text/generate",
                json=payload,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                # Check if response has expected structure
                if 'content' in data or 'response' in data or 'text' in data:
                    # Check if it's a real AI response (not mock)
                    response_text = str(data)
                    if 'mock' in response_text.lower() or 'placeholder' in response_text.lower():
                        self.log_result("AI Studio GPT-5.5 Text Generation", False, 
                                      "Response appears to be MOCKED, not real AI integration")
                    else:
                        self.log_result("AI Studio GPT-5.5 Text Generation", True, 
                                      f"Real AI response received: {str(data)[:100]}...")
                else:
                    self.log_result("AI Studio GPT-5.5 Text Generation", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("AI Studio GPT-5.5 Text Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("AI Studio GPT-5.5 Text Generation", False, f"Error: {str(e)}")
    
    def test_ai_studio_text_generation_claude(self):
        """Test 2: AI Studio Text Generation with Claude Opus 4.7"""
        print("\n🤖 Testing AI Studio Text Generation (Claude Opus 4.7)...")
        
        try:
            payload = {
                "model": "claude-opus-4.7",
                "messages": [{"role": "user", "content": "What is 2+2?"}]
            }
            
            response = requests.post(
                f"{BACKEND_URL}/ai-studio/text/generate",
                json=payload,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                # Check if response has expected structure
                if 'content' in data or 'response' in data or 'text' in data:
                    # Check if it's a real AI response (not mock)
                    response_text = str(data)
                    if 'mock' in response_text.lower() or 'placeholder' in response_text.lower():
                        self.log_result("AI Studio Claude Text Generation", False, 
                                      "Response appears to be MOCKED, not real AI integration")
                    else:
                        self.log_result("AI Studio Claude Text Generation", True, 
                                      f"Real AI response received: {str(data)[:100]}...")
                else:
                    self.log_result("AI Studio Claude Text Generation", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("AI Studio Claude Text Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("AI Studio Claude Text Generation", False, f"Error: {str(e)}")
    
    def test_ai_studio_image_generation(self):
        """Test 3: AI Studio Image Generation with GPT-Image-1.5"""
        print("\n🎨 Testing AI Studio Image Generation (GPT-Image-1.5)...")
        
        try:
            payload = {
                "model": "gpt-image-1.5",
                "prompt": "A sunset",
                "size": "1024x1024"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/ai-studio/image/generate",
                json=payload,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response keys: {list(data.keys())}")
                
                # Check if response has image data
                if 'image' in data or 'image_url' in data or 'url' in data or 'data' in data:
                    # Check if it's a real image (base64 or URL)
                    response_text = str(data)
                    if 'mock' in response_text.lower() or 'placeholder' in response_text.lower():
                        self.log_result("AI Studio Image Generation", False, 
                                      "Response appears to be MOCKED, not real AI integration")
                    elif 'base64' in response_text or 'data:image' in response_text or 'http' in response_text:
                        self.log_result("AI Studio Image Generation", True, 
                                      "Real image data received (base64 or URL)")
                    else:
                        self.log_result("AI Studio Image Generation", False, 
                                      f"No valid image data found: {str(data)[:200]}...")
                else:
                    self.log_result("AI Studio Image Generation", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("AI Studio Image Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("AI Studio Image Generation", False, f"Error: {str(e)}")
    
    def test_socketio_health(self):
        """Test 4: Socket.IO Health Check"""
        print("\n🔌 Testing Socket.IO Health Check...")
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/socket-test/health",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                # Check if Socket.IO is running
                if 'status' in data or 'socketio' in data or 'healthy' in data:
                    self.log_result("Socket.IO Health Check", True, 
                                  f"Socket.IO is running: {data}")
                else:
                    self.log_result("Socket.IO Health Check", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("Socket.IO Health Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Socket.IO Health Check", False, f"Error: {str(e)}")
    
    def test_socketio_stats(self):
        """Test 5: Socket.IO Statistics"""
        print("\n📊 Testing Socket.IO Statistics...")
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/socket-test/stats",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                # Check if stats are returned
                if 'connections' in data or 'clients' in data or 'stats' in data:
                    self.log_result("Socket.IO Statistics", True, 
                                  f"Statistics retrieved: {data}")
                else:
                    self.log_result("Socket.IO Statistics", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("Socket.IO Statistics", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Socket.IO Statistics", False, f"Error: {str(e)}")
    
    def test_socketio_broadcast(self):
        """Test 6: Socket.IO Broadcast"""
        print("\n📡 Testing Socket.IO Broadcast...")
        
        try:
            payload = {
                "event": "test",
                "data": {"message": "Hello"}
            }
            
            response = requests.post(
                f"{BACKEND_URL}/socket-test/broadcast",
                json=payload,
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                # Check if broadcast was successful
                if 'success' in data or 'broadcasted' in data or 'sent' in data:
                    self.log_result("Socket.IO Broadcast", True, 
                                  f"Broadcast successful: {data}")
                else:
                    self.log_result("Socket.IO Broadcast", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("Socket.IO Broadcast", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Socket.IO Broadcast", False, f"Error: {str(e)}")
    
    def test_socketio_load_test(self):
        """Test 7: Socket.IO Load Test"""
        print("\n⚡ Testing Socket.IO Load Test (50 connections)...")
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/socket-test/load-test?count=50",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                
                # Check if load test was successful
                if 'success' in data or 'completed' in data or 'results' in data:
                    self.log_result("Socket.IO Load Test", True, 
                                  f"Load test completed: {data}")
                else:
                    self.log_result("Socket.IO Load Test", False, 
                                  f"Unexpected response structure: {data}")
            else:
                self.log_result("Socket.IO Load Test", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Socket.IO Load Test", False, f"Error: {str(e)}")
    
    def test_python_microservice_health(self):
        """Test 8: Python AI Microservice Health Check"""
        print("\n🐍 Testing Python AI Microservice Health Check...")
        
        try:
            # Try localhost:8002 first
            response = requests.get("http://localhost:8002/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)}")
                self.log_result("Python Microservice Health", True, 
                              f"Python microservice is running: {data}")
            else:
                self.log_result("Python Microservice Health", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except requests.exceptions.ConnectionError:
            self.log_result("Python Microservice Health", False, 
                          "Connection refused - Python microservice not running on localhost:8002")
        except Exception as e:
            self.log_result("Python Microservice Health", False, f"Error: {str(e)}")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("📊 TEST SUMMARY - Sprint 2 Phase 5 & 6")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\nTotal Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "="*80)
    
    def run_all_tests(self):
        """Run all tests"""
        print("="*80)
        print("🚀 Starting Sprint 2 Phase 5 & 6 Testing")
        print("   AI Studio + Socket.IO Real Integration Testing")
        print("="*80)
        
        # Setup authentication
        if not self.setup_auth():
            print("\n❌ Authentication setup failed. Cannot proceed with tests.")
            return
        
        # Run all tests
        self.test_ai_studio_text_generation_gpt55()
        self.test_ai_studio_text_generation_claude()
        self.test_ai_studio_image_generation()
        self.test_socketio_health()
        self.test_socketio_stats()
        self.test_socketio_broadcast()
        self.test_socketio_load_test()
        self.test_python_microservice_health()
        
        # Print summary
        self.print_summary()

if __name__ == "__main__":
    tester = Sprint2Phase5And6Tester()
    tester.run_all_tests()
