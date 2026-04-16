#!/usr/bin/env python3
"""
AI Service for TikTok Live Monitor
Provides AI-powered features using Gemini via emergentintegrations
"""

import os
import json
import asyncio
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')

class AIService:
    """AI service for advanced features using Gemini"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
        
    async def generate_stream_summary(self, stream_data):
        """Generate AI summary of a live stream"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"stream-summary-{stream_data.get('stream_id', 'unknown')}",
            system_message="You are an expert analyst for TikTok live streams. Provide concise, insightful summaries."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Analyze this TikTok live stream and provide a brief summary:

Stream Duration: {stream_data.get('duration', 'N/A')} minutes
Peak Viewers: {stream_data.get('peak_viewers', 0)}
Total Gifts Received: {stream_data.get('total_gifts', 0)}
Total Revenue: ${stream_data.get('total_revenue', 0)}
Chat Messages: {stream_data.get('total_chats', 0)}

Provide a 2-3 sentence professional summary highlighting the key performance metrics."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return response.strip()
    
    async def analyze_sentiment(self, chat_messages):
        """Analyze sentiment of chat messages"""
        if not chat_messages or len(chat_messages) == 0:
            return {"overall": "neutral", "score": 0, "analysis": "No messages to analyze"}
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id="sentiment-analysis",
            system_message="You are a sentiment analysis expert. Analyze chat messages and return sentiment in JSON format."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        # Take sample of messages
        sample_messages = chat_messages[:50] if len(chat_messages) > 50 else chat_messages
        messages_text = "\n".join([f"- {msg}" for msg in sample_messages])
        
        prompt = f"""Analyze the sentiment of these chat messages from a TikTok live stream:

{messages_text}

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{{"overall": "positive/negative/neutral", "score": <number from -1 to 1>, "analysis": "<one sentence summary>"}}"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        try:
            # Clean response and parse JSON
            cleaned = response.strip().replace('```json', '').replace('```', '').strip()
            return json.loads(cleaned)
        except:
            return {"overall": "neutral", "score": 0, "analysis": response[:100]}
    
    async def generate_content_recommendations(self, creator_data):
        """Generate content recommendations based on creator performance"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"recommendations-{creator_data.get('creator_id', 'unknown')}",
            system_message="You are a TikTok growth strategist. Provide actionable content recommendations."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Based on this TikTok creator's performance data, suggest 3 specific content ideas:

Creator Stats:
- Average Viewers: {creator_data.get('avg_viewers', 0)}
- Total Streams: {creator_data.get('total_streams', 0)}
- Engagement Rate: {creator_data.get('engagement_rate', 0)}%
- Top performing time: {creator_data.get('best_time', 'N/A')}
- Recent trend: {creator_data.get('trend', 'stable')}

Provide exactly 3 specific, actionable content ideas in a numbered list."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return response.strip()
    
    async def detect_spam_content(self, text):
        """Detect if content is spam using AI"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id="spam-detection",
            system_message="You are a content moderation AI. Detect spam, scams, and inappropriate content."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Is this message spam, scam, or inappropriate? Respond with ONLY a JSON object:

Message: "{text}"

Format: {{"is_spam": true/false, "confidence": <0-1>, "reason": "<brief reason>"}}"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        try:
            cleaned = response.strip().replace('```json', '').replace('```', '').strip()
            return json.loads(cleaned)
        except:
            return {"is_spam": False, "confidence": 0.5, "reason": "Analysis inconclusive"}
    
    async def predict_stream_success(self, historical_data):
        """Predict next stream success based on historical data"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id="stream-prediction",
            system_message="You are a data scientist specializing in live streaming analytics and predictions."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Based on these historical stream performance metrics, predict the next stream's performance:

Recent Streams (last 5):
{json.dumps(historical_data, indent=2)}

Respond with ONLY a JSON object:
{{"predicted_viewers": <number>, "predicted_revenue": <number>, "confidence": <0-1>, "recommendation": "<one sentence tip>"}}"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        try:
            cleaned = response.strip().replace('```json', '').replace('```', '').strip()
            return json.loads(cleaned)
        except:
            return {"predicted_viewers": 0, "predicted_revenue": 0, "confidence": 0.5, "recommendation": "Insufficient data"}
    
    async def generate_highlight_description(self, highlight_data):
        """Generate engaging description for stream highlight"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id="highlight-description",
            system_message="You are a social media content creator who writes engaging, short descriptions."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Write a catchy 1-2 sentence description for this stream highlight:

Event: {highlight_data.get('event_type', 'special moment')}
Context: {highlight_data.get('context', 'during live stream')}
Impact: {highlight_data.get('impact', 'high engagement')}

Make it exciting and shareable!"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return response.strip()


async def main():
    """Test the AI service"""
    service = AIService()
    
    # Test stream summary
    test_stream = {
        'stream_id': 'test123',
        'duration': 120,
        'peak_viewers': 1500,
        'total_gifts': 45,
        'total_revenue': 250,
        'total_chats': 890
    }
    
    print("Testing Stream Summary:")
    summary = await service.generate_stream_summary(test_stream)
    print(f"Summary: {summary}\n")
    
    print("AI Service is ready!")

if __name__ == "__main__":
    asyncio.run(main())
