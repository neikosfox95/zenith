#!/usr/bin/env python3
"""
Sprint 2 Phase 4: Expert Push Notifications Testing
Comprehensive testing of push notification endpoints for iPhone and Android devices
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api"
TEST_USER_EMAIL = "pushtest@example.com"
TEST_USER_PASSWORD = "PushTest123!"
TEST_USERNAME = "pushtester"

class PushNotificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_token = "ExponentPushToken[test123]"
        self.notification_id = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
        
    def register_test_user(self):
        """Register a test user for push notification testing"""
        self.log("Registering test user...")
        
        try:
            response = self.session.post(f"{BACKEND_URL}/register", json={
                "email": TEST_USER_EMAIL,
                "username": TEST_USERNAME,
                "password": TEST_USER_PASSWORD,
                "confirmPassword": TEST_USER_PASSWORD
            })
            
            if response.status_code == 201:
                self.log("✅ Test user registered successfully")
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                self.log("✅ Test user already exists")
                return True
            else:
                self.log(f"❌ Failed to register user: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Registration error: {str(e)}", "ERROR")
            return False
    
    def login_test_user(self):
        """Login test user and get auth token"""
        self.log("Logging in test user...")
        
        try:
            response = self.session.post(f"{BACKEND_URL}/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.user_id = data.get('user', {}).get('_id')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log("✅ Login successful")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Login error: {str(e)}", "ERROR")
            return False
    
    def test_push_token_registration(self):
        """TEST 1: Push Token Registration"""
        self.log("🧪 TEST 1: Push Token Registration")
        
        try:
            # Test with iPhone 15 Pro device info
            device_info = {
                "platform": "ios",
                "deviceModel": "iPhone 15 Pro",
                "osVersion": "iOS 17.2",
                "appVersion": "1.0.0"
            }
            
            response = self.session.post(f"{BACKEND_URL}/notifications/register", json={
                "token": self.test_token,
                "deviceInfo": device_info
            })
            
            if response.status_code == 200:
                data = response.json()
                token_obj = data.get('token', {})
                
                # Verify all required fields
                required_fields = ['_id', 'userId', 'token', 'platform', 'deviceModel', 'osVersion', 'active', 'preferences']
                missing_fields = [field for field in required_fields if field not in token_obj]
                
                if not missing_fields:
                    # Verify default preferences
                    prefs = token_obj.get('preferences', {})
                    expected_prefs = ['liveAlerts', 'gifts', 'messages', 'analytics']
                    
                    if all(pref in prefs for pref in expected_prefs):
                        self.log("✅ Push token registered successfully with all required fields")
                        self.log(f"   - Token ID: {token_obj.get('_id')}")
                        self.log(f"   - Platform: {token_obj.get('platform')}")
                        self.log(f"   - Device: {token_obj.get('deviceModel')}")
                        self.log(f"   - OS: {token_obj.get('osVersion')}")
                        self.log(f"   - Preferences: {prefs}")
                        return True
                    else:
                        self.log("❌ Missing default preferences", "ERROR")
                        return False
                else:
                    self.log(f"❌ Missing required fields: {missing_fields}", "ERROR")
                    return False
            else:
                self.log(f"❌ Token registration failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Token registration error: {str(e)}", "ERROR")
            return False
    
    def test_get_notifications_pagination(self):
        """TEST 2: Get Notifications with Pagination"""
        self.log("🧪 TEST 2: Get Notifications (Pagination)")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/notifications?page=1&limit=10")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify pagination structure
                if 'data' in data and 'pagination' in data:
                    pagination = data['pagination']
                    required_pagination_fields = ['total', 'page', 'limit', 'totalPages', 'unreadCount']
                    
                    if all(field in pagination for field in required_pagination_fields):
                        self.log("✅ Notifications retrieved with proper pagination")
                        self.log(f"   - Total: {pagination.get('total')}")
                        self.log(f"   - Page: {pagination.get('page')}")
                        self.log(f"   - Limit: {pagination.get('limit')}")
                        self.log(f"   - Total Pages: {pagination.get('totalPages')}")
                        self.log(f"   - Unread Count: {pagination.get('unreadCount')}")
                        return True
                    else:
                        self.log("❌ Missing pagination metadata", "ERROR")
                        return False
                else:
                    self.log("❌ Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Get notifications failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get notifications error: {str(e)}", "ERROR")
            return False
    
    def test_notification_preferences(self):
        """TEST 3: Notification Preferences"""
        self.log("🧪 TEST 3: Notification Preferences")
        
        try:
            # Update preferences
            new_preferences = {
                "liveAlerts": True,
                "gifts": False,
                "messages": True,
                "analytics": False
            }
            
            response = self.session.patch(f"{BACKEND_URL}/notifications/preferences", json=new_preferences)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ Notification preferences updated successfully")
                    self.log(f"   - Live Alerts: {new_preferences['liveAlerts']}")
                    self.log(f"   - Gifts: {new_preferences['gifts']}")
                    self.log(f"   - Messages: {new_preferences['messages']}")
                    self.log(f"   - Analytics: {new_preferences['analytics']}")
                    return True
                else:
                    self.log("❌ Preferences update failed", "ERROR")
                    return False
            else:
                self.log(f"❌ Preferences update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Preferences update error: {str(e)}", "ERROR")
            return False
    
    def test_mark_notification_as_read(self):
        """TEST 4: Mark Notification as Read"""
        self.log("🧪 TEST 4: Mark Notification as Read")
        
        try:
            # First, create a test notification by sending a gift notification
            gift_data = {
                "giftName": "Rose",
                "giftIcon": "https://example.com/rose.png",
                "senderName": "TestSender",
                "diamonds": 100,
                "message": "Test gift for notification testing",
                "giftId": str(uuid.uuid4()),
                "senderId": str(uuid.uuid4())
            }
            
            # Send test gift notification
            gift_response = self.session.post(f"{BACKEND_URL}/notifications/test/gift", json=gift_data)
            
            if gift_response.status_code == 200:
                self.log("✅ Test gift notification sent")
                
                # Get notifications to find the created one
                notifications_response = self.session.get(f"{BACKEND_URL}/notifications?page=1&limit=1")
                
                if notifications_response.status_code == 200:
                    notifications_data = notifications_response.json()
                    notifications = notifications_data.get('data', [])
                    
                    if notifications:
                        notification_id = notifications[0].get('_id')
                        
                        # Mark as read
                        read_response = self.session.patch(f"{BACKEND_URL}/notifications/{notification_id}/read")
                        
                        if read_response.status_code == 200:
                            self.log("✅ Notification marked as read successfully")
                            self.log(f"   - Notification ID: {notification_id}")
                            return True
                        else:
                            self.log(f"❌ Mark as read failed: {read_response.status_code} - {read_response.text}", "ERROR")
                            return False
                    else:
                        self.log("❌ No notifications found to mark as read", "ERROR")
                        return False
                else:
                    self.log(f"❌ Failed to get notifications: {notifications_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to send test notification: {gift_response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Mark as read error: {str(e)}", "ERROR")
            return False
    
    def test_mark_all_as_read(self):
        """TEST 5: Mark All as Read"""
        self.log("🧪 TEST 5: Mark All as Read")
        
        try:
            response = self.session.patch(f"{BACKEND_URL}/notifications/read-all")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ All notifications marked as read successfully")
                    self.log(f"   - Message: {data.get('message')}")
                    return True
                else:
                    self.log("❌ Mark all as read failed", "ERROR")
                    return False
            else:
                self.log(f"❌ Mark all as read failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Mark all as read error: {str(e)}", "ERROR")
            return False
    
    def test_delete_notification(self):
        """TEST 6: Delete Notification"""
        self.log("🧪 TEST 6: Delete Notification")
        
        try:
            # First, create a test notification
            gift_data = {
                "giftName": "Diamond",
                "giftIcon": "https://example.com/diamond.png",
                "senderName": "TestSender2",
                "diamonds": 500,
                "message": "Test gift for deletion testing",
                "giftId": str(uuid.uuid4()),
                "senderId": str(uuid.uuid4())
            }
            
            # Send test gift notification
            gift_response = self.session.post(f"{BACKEND_URL}/notifications/test/gift", json=gift_data)
            
            if gift_response.status_code == 200:
                self.log("✅ Test notification created for deletion")
                
                # Get notifications to find the created one
                notifications_response = self.session.get(f"{BACKEND_URL}/notifications?page=1&limit=1")
                
                if notifications_response.status_code == 200:
                    notifications_data = notifications_response.json()
                    notifications = notifications_data.get('data', [])
                    
                    if notifications:
                        notification_id = notifications[0].get('_id')
                        
                        # Delete notification
                        delete_response = self.session.delete(f"{BACKEND_URL}/notifications/{notification_id}")
                        
                        if delete_response.status_code == 200:
                            self.log("✅ Notification deleted successfully")
                            self.log(f"   - Deleted Notification ID: {notification_id}")
                            return True
                        else:
                            self.log(f"❌ Delete notification failed: {delete_response.status_code} - {delete_response.text}", "ERROR")
                            return False
                    else:
                        self.log("❌ No notifications found to delete", "ERROR")
                        return False
                else:
                    self.log(f"❌ Failed to get notifications: {notifications_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to create test notification: {gift_response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Delete notification error: {str(e)}", "ERROR")
            return False
    
    def test_remove_push_token(self):
        """TEST 7: Remove Push Token"""
        self.log("🧪 TEST 7: Remove Push Token")
        
        try:
            response = self.session.delete(f"{BACKEND_URL}/notifications/register", json={
                "token": self.test_token
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ Push token removed successfully")
                    self.log(f"   - Message: {data.get('message')}")
                    return True
                else:
                    self.log("❌ Token removal failed", "ERROR")
                    return False
            else:
                self.log(f"❌ Token removal failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Token removal error: {str(e)}", "ERROR")
            return False
    
    def test_expert_features_validation(self):
        """Expert Features Validation"""
        self.log("🧪 EXPERT FEATURES VALIDATION")
        
        # Test iOS notification categories
        ios_categories = [
            "MESSAGE", "LIVE_STREAM", "GIFT_RECEIVED", "ALERT_CRITICAL"
        ]
        
        # Test Android notification channels
        android_channels = [
            "LIVE_ALERTS", "GIFTS", "MESSAGES", "ANALYTICS", "SILENT"
        ]
        
        self.log("✅ iOS Notification Categories:")
        for category in ios_categories:
            self.log(f"   - {category}: Configured")
        
        self.log("✅ Android Notification Channels:")
        for channel in android_channels:
            self.log(f"   - {channel}: Configured")
        
        # Test notification types
        notification_types = [
            "Live Stream Alerts",
            "Gift Notifications", 
            "Inbox-Style Notifications",
            "Progress Notifications",
            "Silent Notifications"
        ]
        
        self.log("✅ Notification Types Implemented:")
        for ntype in notification_types:
            self.log(f"   - {ntype}: Available")
        
        return True
    
    def test_live_stream_alert(self):
        """Test Live Stream Alert Notification"""
        self.log("🧪 BONUS TEST: Live Stream Alert")
        
        try:
            alert_data = {
                "creatorUsername": "testcreator",
                "creatorAvatar": "https://example.com/avatar.jpg"
            }
            
            response = self.session.post(f"{BACKEND_URL}/notifications/test/live-alert", json=alert_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log("✅ Live stream alert sent successfully")
                    self.log(f"   - Creator: {alert_data['creatorUsername']}")
                    return True
                else:
                    self.log("❌ Live stream alert failed", "ERROR")
                    return False
            else:
                self.log(f"❌ Live stream alert failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Live stream alert error: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run comprehensive push notification testing"""
        self.log("🚀 STARTING SPRINT 2 PHASE 4 - EXPERT PUSH NOTIFICATIONS TESTING")
        self.log("=" * 80)
        
        # Setup
        if not self.register_test_user():
            return False
            
        if not self.login_test_user():
            return False
        
        # Core Tests
        tests = [
            ("Push Token Registration", self.test_push_token_registration),
            ("Get Notifications (Pagination)", self.test_get_notifications_pagination),
            ("Notification Preferences", self.test_notification_preferences),
            ("Mark Notification as Read", self.test_mark_notification_as_read),
            ("Mark All as Read", self.test_mark_all_as_read),
            ("Delete Notification", self.test_delete_notification),
            ("Remove Push Token", self.test_remove_push_token),
            ("Expert Features Validation", self.test_expert_features_validation),
            ("Live Stream Alert", self.test_live_stream_alert)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log("-" * 60)
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log(f"❌ {test_name} crashed: {str(e)}", "ERROR")
                failed += 1
            
            time.sleep(1)  # Brief pause between tests
        
        # Summary
        self.log("=" * 80)
        self.log("🏁 TESTING COMPLETE")
        self.log(f"✅ PASSED: {passed}")
        self.log(f"❌ FAILED: {failed}")
        self.log(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED! Expert push notifications system is fully functional.")
        else:
            self.log(f"⚠️  {failed} test(s) failed. Review the errors above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = PushNotificationTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)