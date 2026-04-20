#!/usr/bin/env python3
"""
Sprint 2 Focused Testing - Issue Investigation
Testing specific failed cases from comprehensive test
"""

import requests
import json
import os
import tempfile
import time

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api"

class Sprint2FocusedTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        
    def setup_auth(self):
        """Setup authentication for testing"""
        print("🔐 Setting up authentication...")
        
        # Login to get token
        login_data = {
            "email": "sprint2tester@tiktok.com",
            "password": "Sprint2Test123!"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.user_id = data.get('userId')
                print(f"✅ Authentication successful, User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def create_test_image(self):
        """Create a simple test PNG image"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        # Simple 1x1 pixel PNG
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        temp_file.write(png_data)
        temp_file.close()
        return temp_file.name
    
    def test_image_upload_response_structure(self):
        """Test the image upload response structure issue"""
        print("\n🖼️ Testing Image Upload Response Structure...")
        
        test_file_path = self.create_test_image()
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'image': ('test_image.png', f, 'image/png')}
                response = requests.post(f"{BACKEND_URL}/upload/image", files=files, headers=self.get_headers())
                
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Response Structure: {json.dumps(data, indent=2)}")
                
                # Check if it has 'image' field instead of 'file'
                if 'image' in data:
                    print("✅ Image upload uses 'image' field (different from general upload)")
                    image_info = data['image']
                    required_fields = ['id', 'filename', 'url', 'size']
                    missing_fields = [field for field in required_fields if field not in image_info]
                    
                    if not missing_fields:
                        print("✅ All required fields present in image response")
                        return image_info
                    else:
                        print(f"❌ Missing fields: {missing_fields}")
                else:
                    print("❌ No 'image' field in response")
            else:
                print(f"❌ Upload failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
        
        return None
    
    def test_file_serving_issue(self):
        """Test file serving issue"""
        print("\n🌐 Testing File Serving Issue...")
        
        # First upload a file
        test_file_path = self.create_test_image()
        uploaded_file = None
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'image': ('serve_test.png', f, 'image/png')}
                response = requests.post(f"{BACKEND_URL}/upload/image", files=files, headers=self.get_headers())
                
            if response.status_code == 200:
                data = response.json()
                uploaded_file = data.get('image')
                
                if uploaded_file and 'url' in uploaded_file:
                    file_url = uploaded_file['url']
                    print(f"File URL from upload: {file_url}")
                    
                    # Test different URL formats
                    test_urls = [
                        f"{BACKEND_URL.replace('/api', '')}{file_url}",  # Full URL
                        f"{BACKEND_URL}{file_url.replace('/api', '')}",  # API prefix
                        f"https://zenith-dashboard-3.preview.emergentagent.com{file_url}"  # Direct domain
                    ]
                    
                    for test_url in test_urls:
                        print(f"\nTesting URL: {test_url}")
                        try:
                            serve_response = requests.get(test_url, headers=self.get_headers())
                            print(f"Status: {serve_response.status_code}")
                            if serve_response.status_code == 200:
                                print(f"✅ File served successfully from {test_url}")
                                print(f"Content-Type: {serve_response.headers.get('content-type')}")
                                print(f"Content-Length: {serve_response.headers.get('content-length')}")
                                break
                            else:
                                print(f"❌ Failed: {serve_response.text}")
                        except Exception as e:
                            print(f"❌ Error accessing {test_url}: {str(e)}")
                else:
                    print("❌ No URL in upload response")
            else:
                print(f"❌ Upload failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
    
    def test_upload_rate_limiting_timing(self):
        """Test upload rate limiting with correct timing"""
        print("\n⏱️ Testing Upload Rate Limiting (10 uploads per hour)...")
        
        # Create small test file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
        temp_file.write(b"Rate limit test")
        temp_file.close()
        
        success_count = 0
        rate_limited = False
        
        try:
            print("Making 11 rapid upload requests...")
            # Make 11 rapid upload requests
            for i in range(11):
                with open(temp_file.name, 'rb') as f:
                    files = {'file': (f'rate_test_{i}.txt', f, 'text/plain')}
                    response = requests.post(f"{BACKEND_URL}/upload", files=files, headers=self.get_headers())
                    
                print(f"Request {i+1}: Status {response.status_code}")
                
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    data = response.json()
                    print(f"Rate limited response: {json.dumps(data, indent=2)}")
                    if 'UPLOAD_RATE_LIMIT_EXCEEDED' in str(data):
                        rate_limited = True
                        print(f"✅ Rate limiting triggered after {success_count} uploads")
                        break
                else:
                    print(f"Unexpected status: {response.status_code}, Response: {response.text}")
                
                # Small delay between requests
                time.sleep(0.1)
            
            if not rate_limited:
                print(f"❌ No rate limiting detected after {success_count} uploads")
                print("Note: Upload rate limiter is set to 10 uploads per hour, not per 15 minutes")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        finally:
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
    
    def test_file_size_validation_issue(self):
        """Test file size validation issue"""
        print("\n📏 Testing File Size Validation Issue...")
        
        try:
            # Create a large file (11MB)
            large_content = b"x" * (11 * 1024 * 1024)  # 11MB
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            temp_file.write(large_content)
            temp_file.close()
            
            print(f"Created {len(large_content) / (1024*1024):.1f}MB test file")
            
            with open(temp_file.name, 'rb') as f:
                files = {'image': ('large_image.png', f, 'image/png')}
                response = requests.post(f"{BACKEND_URL}/upload/image", files=files, headers=self.get_headers())
                
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 400:
                data = response.json()
                if 'FILE_TOO_LARGE' in str(data):
                    print("✅ File size validation working correctly")
                else:
                    print("✅ File rejected for size (different error code)")
            elif response.status_code == 429:
                print("❌ Got rate limiting (429) instead of file size error (400)")
                print("This suggests the rate limiter is triggering before file size validation")
            else:
                print(f"❌ Unexpected response: {response.status_code}")
                
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    def run_focused_tests(self):
        """Run focused tests on failed cases"""
        print("🔍 Starting Sprint 2 Focused Testing...")
        print("=" * 50)
        
        if not self.setup_auth():
            print("❌ Authentication failed. Cannot proceed.")
            return
        
        # Test each failed case
        self.test_image_upload_response_structure()
        self.test_file_serving_issue()
        self.test_upload_rate_limiting_timing()
        self.test_file_size_validation_issue()
        
        print("\n🎉 Focused testing complete!")

if __name__ == "__main__":
    tester = Sprint2FocusedTester()
    tester.run_focused_tests()