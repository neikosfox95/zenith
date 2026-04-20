#!/usr/bin/env python3
"""
Sprint 2 Comprehensive Testing - Phases 1, 2 & 3
Testing backend APIs for pagination, search, and file upload functionality
"""

import requests
import json
import os
import tempfile
import time
from io import BytesIO

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api"

class Sprint2Tester:
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
            "email": "sprint2tester@tiktok.com",
            "username": "sprint2tester",
            "password": "Sprint2Test123!"
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
            "email": "sprint2tester@tiktok.com",
            "password": "Sprint2Test123!"
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
    
    def test_phase1_database_indexing(self):
        """Test Phase 1: Database Indexing (Already tested, just verify)"""
        print("\n📊 Testing Phase 1: Database Indexing...")
        
        try:
            # Test a simple query to verify indexes are working
            response = requests.get(f"{BACKEND_URL}/creators?page=1&limit=5", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                if 'pagination' in data:
                    self.log_result("Database Indexing Verification", True, "Pagination query executed successfully")
                else:
                    self.log_result("Database Indexing Verification", False, "No pagination structure in response")
            else:
                self.log_result("Database Indexing Verification", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Database Indexing Verification", False, f"Error: {str(e)}")
    
    def test_phase2_pagination_basic(self):
        """Test Phase 2: Basic Pagination on /api/creators"""
        print("\n📄 Testing Phase 2: Basic Pagination...")
        
        # Test 1: Basic pagination with page=1&limit=10
        try:
            response = requests.get(f"{BACKEND_URL}/creators?page=1&limit=10", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                pagination = data.get('pagination', {})
                
                # Check pagination structure
                required_fields = ['total', 'page', 'limit', 'totalPages', 'hasNextPage', 'hasPrevPage', 'nextPage', 'prevPage']
                missing_fields = [field for field in required_fields if field not in pagination]
                
                if not missing_fields:
                    self.log_result("Basic Pagination Structure", True, f"All required fields present: {list(pagination.keys())}")
                else:
                    self.log_result("Basic Pagination Structure", False, f"Missing fields: {missing_fields}")
                    
                # Verify pagination values
                if pagination.get('page') == 1 and pagination.get('limit') == 10:
                    self.log_result("Pagination Parameters", True, f"Page: {pagination['page']}, Limit: {pagination['limit']}")
                else:
                    self.log_result("Pagination Parameters", False, f"Expected page=1, limit=10, got page={pagination.get('page')}, limit={pagination.get('limit')}")
            else:
                self.log_result("Basic Pagination", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Basic Pagination", False, f"Error: {str(e)}")
        
        # Test 2: Different page and limit values
        test_cases = [
            {"page": 2, "limit": 5},
            {"page": 1, "limit": 20}
        ]
        
        for case in test_cases:
            try:
                response = requests.get(f"{BACKEND_URL}/creators?page={case['page']}&limit={case['limit']}", headers=self.get_headers())
                if response.status_code == 200:
                    data = response.json()
                    pagination = data.get('pagination', {})
                    if pagination.get('page') == case['page'] and pagination.get('limit') == case['limit']:
                        self.log_result(f"Pagination page={case['page']}, limit={case['limit']}", True, "Parameters correctly applied")
                    else:
                        self.log_result(f"Pagination page={case['page']}, limit={case['limit']}", False, f"Got page={pagination.get('page')}, limit={pagination.get('limit')}")
                else:
                    self.log_result(f"Pagination page={case['page']}, limit={case['limit']}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f"Pagination page={case['page']}, limit={case['limit']}", False, f"Error: {str(e)}")
    
    def test_phase2_sorting(self):
        """Test Phase 2: Sorting functionality"""
        print("\n🔄 Testing Phase 2: Sorting...")
        
        # Test ascending sort
        try:
            response = requests.get(f"{BACKEND_URL}/creators?sortBy=tiktok_username&sortOrder=asc", headers=self.get_headers())
            if response.status_code == 200:
                self.log_result("Sorting (Ascending)", True, "sortBy=tiktok_username&sortOrder=asc executed")
            else:
                self.log_result("Sorting (Ascending)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Sorting (Ascending)", False, f"Error: {str(e)}")
        
        # Test descending sort with "-" prefix
        try:
            response = requests.get(f"{BACKEND_URL}/creators?sortBy=-created_at", headers=self.get_headers())
            if response.status_code == 200:
                self.log_result("Sorting (Descending with - prefix)", True, "sortBy=-created_at executed")
            else:
                self.log_result("Sorting (Descending with - prefix)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Sorting (Descending with - prefix)", False, f"Error: {str(e)}")
    
    def test_phase2_search_filtering(self):
        """Test Phase 2: Search filtering"""
        print("\n🔍 Testing Phase 2: Search Filtering...")
        
        # Test search parameter
        try:
            response = requests.get(f"{BACKEND_URL}/creators?search=darkskully", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                self.log_result("Search Filtering", True, f"Search query executed, found {len(data.get('data', []))} results")
            else:
                self.log_result("Search Filtering", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Search Filtering", False, f"Error: {str(e)}")
        
        # Test status filter
        try:
            response = requests.get(f"{BACKEND_URL}/creators?status=active", headers=self.get_headers())
            if response.status_code == 200:
                self.log_result("Status Filtering", True, "status=active filter executed")
            else:
                self.log_result("Status Filtering", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Status Filtering", False, f"Error: {str(e)}")
    
    def test_phase2_advanced_search(self):
        """Test Phase 2: Advanced search endpoint"""
        print("\n🔍 Testing Phase 2: Advanced Search Endpoint...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/search/creators?search=test&page=1", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                if 'pagination' in data:
                    self.log_result("Advanced Search Endpoint", True, "Advanced search with pagination working")
                else:
                    self.log_result("Advanced Search Endpoint", False, "No pagination in advanced search response")
            else:
                self.log_result("Advanced Search Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Advanced Search Endpoint", False, f"Error: {str(e)}")
    
    def create_test_file(self, filename, content, mimetype="text/plain"):
        """Create a test file for upload testing"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=filename)
        if mimetype.startswith('image/'):
            # Create a simple 1x1 pixel PNG
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            temp_file.write(png_data)
        else:
            temp_file.write(content.encode() if isinstance(content, str) else content)
        temp_file.close()
        return temp_file.name
    
    def test_phase3_general_upload(self):
        """Test Phase 3: General file upload"""
        print("\n📁 Testing Phase 3: General File Upload...")
        
        # Create test file
        test_file_path = self.create_test_file(".txt", "This is a test file for Sprint 2 upload testing.")
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'file': ('test_upload.txt', f, 'text/plain')}
                response = requests.post(f"{BACKEND_URL}/upload", files=files, headers=self.get_headers())
                
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'file' in data:
                    file_info = data['file']
                    required_fields = ['id', 'filename', 'originalName', 'size', 'mimetype', 'fileType', 'url']
                    missing_fields = [field for field in required_fields if field not in file_info]
                    
                    if not missing_fields:
                        self.log_result("General File Upload", True, f"File uploaded successfully: {file_info.get('filename')}")
                        # Store file info for later tests
                        self.uploaded_file = file_info
                    else:
                        self.log_result("General File Upload", False, f"Missing fields in response: {missing_fields}")
                else:
                    self.log_result("General File Upload", False, f"Invalid response structure: {data}")
            else:
                self.log_result("General File Upload", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("General File Upload", False, f"Error: {str(e)}")
        finally:
            # Clean up test file
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
    
    def test_phase3_image_upload(self):
        """Test Phase 3: Image upload"""
        print("\n🖼️ Testing Phase 3: Image Upload...")
        
        # Create test image file
        test_file_path = self.create_test_file(".png", "", "image/png")
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'image': ('test_image.png', f, 'image/png')}
                response = requests.post(f"{BACKEND_URL}/upload/image", files=files, headers=self.get_headers())
                
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'file' in data:
                    self.log_result("Image Upload", True, f"Image uploaded successfully: {data['file'].get('filename')}")
                    self.uploaded_image = data['file']
                else:
                    self.log_result("Image Upload", False, f"Invalid response structure: {data}")
            else:
                self.log_result("Image Upload", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Image Upload", False, f"Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
        
        # Test non-image file rejection
        test_file_path = self.create_test_file(".txt", "This is not an image")
        try:
            with open(test_file_path, 'rb') as f:
                files = {'image': ('not_image.txt', f, 'text/plain')}
                response = requests.post(f"{BACKEND_URL}/upload/image", files=files, headers=self.get_headers())
                
            if response.status_code == 400:
                self.log_result("Image Upload Validation", True, "Non-image file correctly rejected")
            else:
                self.log_result("Image Upload Validation", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("Image Upload Validation", False, f"Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
    
    def test_phase3_upload_rate_limiting(self):
        """Test Phase 3: Upload rate limiting"""
        print("\n⏱️ Testing Phase 3: Upload Rate Limiting...")
        
        # Create small test file
        test_file_path = self.create_test_file(".txt", "Rate limit test")
        
        success_count = 0
        rate_limited = False
        
        try:
            # Make 11 rapid upload requests
            for i in range(11):
                with open(test_file_path, 'rb') as f:
                    files = {'file': (f'rate_test_{i}.txt', f, 'text/plain')}
                    response = requests.post(f"{BACKEND_URL}/upload", files=files, headers=self.get_headers())
                    
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    data = response.json()
                    if 'UPLOAD_RATE_LIMIT_EXCEEDED' in str(data):
                        rate_limited = True
                        break
                
                # Small delay between requests
                time.sleep(0.1)
            
            if rate_limited:
                self.log_result("Upload Rate Limiting", True, f"{success_count} uploads succeeded before rate limiting")
            else:
                self.log_result("Upload Rate Limiting", False, f"All {success_count} uploads succeeded, no rate limiting detected")
                
        except Exception as e:
            self.log_result("Upload Rate Limiting", False, f"Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
    
    def test_phase3_list_uploads(self):
        """Test Phase 3: List uploaded files"""
        print("\n📋 Testing Phase 3: List Uploaded Files...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/uploads?page=1&limit=10", headers=self.get_headers())
            if response.status_code == 200:
                data = response.json()
                if 'pagination' in data and 'data' in data:
                    self.log_result("List Uploads", True, f"Found {len(data['data'])} uploaded files with pagination")
                    
                    # Check if files have URLs
                    files_with_urls = [f for f in data['data'] if 'url' in f]
                    if files_with_urls:
                        self.log_result("Upload URLs", True, f"{len(files_with_urls)} files have URLs")
                    else:
                        self.log_result("Upload URLs", False, "No files have URLs in response")
                else:
                    self.log_result("List Uploads", False, f"Invalid response structure: {data}")
            else:
                self.log_result("List Uploads", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("List Uploads", False, f"Error: {str(e)}")
    
    def test_phase3_serve_files(self):
        """Test Phase 3: Serve uploaded files"""
        print("\n🌐 Testing Phase 3: Serve Uploaded Files...")
        
        # First upload a file to test serving
        test_file_path = self.create_test_file(".txt", "File serving test content")
        uploaded_file = None
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'file': ('serve_test.txt', f, 'text/plain')}
                response = requests.post(f"{BACKEND_URL}/upload", files=files, headers=self.get_headers())
                
            if response.status_code == 200:
                uploaded_file = response.json().get('file')
                
                if uploaded_file and 'url' in uploaded_file:
                    # Test serving the file
                    file_url = uploaded_file['url']
                    # Convert relative URL to full URL
                    if file_url.startswith('/api/'):
                        file_url = BACKEND_URL.replace('/api', '') + file_url
                    
                    serve_response = requests.get(file_url, headers=self.get_headers())
                    if serve_response.status_code == 200:
                        self.log_result("Serve Uploaded File", True, f"File served successfully from {file_url}")
                    else:
                        self.log_result("Serve Uploaded File", False, f"File serving failed: {serve_response.status_code}")
                else:
                    self.log_result("Serve Uploaded File", False, "No URL in upload response")
            else:
                self.log_result("Serve Uploaded File", False, f"Upload failed: {response.status_code}")
                
        except Exception as e:
            self.log_result("Serve Uploaded File", False, f"Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
    
    def test_phase3_delete_files(self):
        """Test Phase 3: Delete uploaded files"""
        print("\n🗑️ Testing Phase 3: Delete Uploaded Files...")
        
        # First upload a file to delete
        test_file_path = self.create_test_file(".txt", "File to be deleted")
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'file': ('delete_test.txt', f, 'text/plain')}
                response = requests.post(f"{BACKEND_URL}/upload", files=files, headers=self.get_headers())
                
            if response.status_code == 200:
                uploaded_file = response.json().get('file')
                file_id = uploaded_file.get('id')
                
                if file_id:
                    # Delete the file
                    delete_response = requests.delete(f"{BACKEND_URL}/uploads/{file_id}", headers=self.get_headers())
                    if delete_response.status_code == 200:
                        self.log_result("Delete Uploaded File", True, f"File {file_id} deleted successfully")
                    else:
                        self.log_result("Delete Uploaded File", False, f"Delete failed: {delete_response.status_code}")
                else:
                    self.log_result("Delete Uploaded File", False, "No file ID in upload response")
            else:
                self.log_result("Delete Uploaded File", False, f"Upload failed: {response.status_code}")
                
        except Exception as e:
            self.log_result("Delete Uploaded File", False, f"Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
    
    def test_phase3_file_validation(self):
        """Test Phase 3: File type and size validation"""
        print("\n✅ Testing Phase 3: File Validation...")
        
        # Test invalid file type
        test_file_path = self.create_test_file(".exe", "This is an executable file")
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'file': ('malicious.exe', f, 'application/x-executable')}
                response = requests.post(f"{BACKEND_URL}/upload", files=files, headers=self.get_headers())
                
            if response.status_code == 400:
                self.log_result("File Type Validation", True, "Invalid file type correctly rejected")
            else:
                self.log_result("File Type Validation", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("File Type Validation", False, f"Error: {str(e)}")
        finally:
            if os.path.exists(test_file_path):
                os.unlink(test_file_path)
        
        # Test file size limit (create a large file)
        try:
            large_content = "x" * (11 * 1024 * 1024)  # 11MB file (over 10MB image limit)
            large_file_path = self.create_test_file(".png", large_content, "image/png")
            
            with open(large_file_path, 'rb') as f:
                files = {'image': ('large_image.png', f, 'image/png')}
                response = requests.post(f"{BACKEND_URL}/upload/image", files=files, headers=self.get_headers())
                
            if response.status_code == 400:
                data = response.json()
                if 'FILE_TOO_LARGE' in str(data):
                    self.log_result("File Size Validation", True, "Large file correctly rejected with FILE_TOO_LARGE")
                else:
                    self.log_result("File Size Validation", True, "Large file rejected (different error code)")
            else:
                self.log_result("File Size Validation", False, f"Expected 400, got {response.status_code}")
                
            if os.path.exists(large_file_path):
                os.unlink(large_file_path)
                
        except Exception as e:
            self.log_result("File Size Validation", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Sprint 2 tests"""
        print("🚀 Starting Sprint 2 Comprehensive Testing...")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_auth():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return
        
        # Phase 1: Database Indexing (verification only)
        self.test_phase1_database_indexing()
        
        # Phase 2: Pagination & Advanced Search
        self.test_phase2_pagination_basic()
        self.test_phase2_sorting()
        self.test_phase2_search_filtering()
        self.test_phase2_advanced_search()
        
        # Phase 3: File Upload System
        self.test_phase3_general_upload()
        self.test_phase3_image_upload()
        self.test_phase3_upload_rate_limiting()
        self.test_phase3_list_uploads()
        self.test_phase3_serve_files()
        self.test_phase3_delete_files()
        self.test_phase3_file_validation()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 SPRINT 2 TESTING SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎉 Sprint 2 Testing Complete!")

if __name__ == "__main__":
    tester = Sprint2Tester()
    tester.run_all_tests()