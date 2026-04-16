#!/usr/bin/env python3
"""
AI Service CLI for TikTok Live Monitor
Callable from Node.js backend for AI-powered features
"""

import os
import json
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
except ImportError:
    print(json.dumps({"error": "emergentintegrations not installed"}))
    sys.exit(1)


async def generate_stream_summary(stream_data):
    """Generate AI summary of a live stream using Gemini"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"stream-summary-{stream_data.get('stream_id', 'unknown')}",
            system_message="You are an expert analyst for TikTok live streams. Provide concise, insightful summaries in 2-3 sentences."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Analyze this TikTok live stream and provide a brief summary:

Duration: {stream_data.get('duration', 0)} minutes
Peak Viewers: {stream_data.get('peak_viewers', 0)}
Total Gifts: {stream_data.get('total_gifts', 0)}
Revenue: ${stream_data.get('total_revenue', 0)}
Chat Messages: {stream_data.get('total_chats', 0)}

Provide 2-3 sentences highlighting key metrics and performance."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return {"summary": response.strip()}
    except Exception as e:
        return {"summary": f"Stream lasted {stream_data.get('duration', 0)} minutes with {stream_data.get('peak_viewers', 0)} peak viewers.", "error": str(e)}


async def analyze_sentiment(data):
    """Analyze sentiment of chat messages using Gemini"""
    messages = data.get('messages', [])
    if not messages:
        return {"overall": "neutral", "score": 0, "analysis": "No messages"}
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="sentiment-analysis",
            system_message="Analyze sentiment and respond with ONLY valid JSON."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        sample = messages[:30]
        messages_text = "\n".join([f"- {msg}" for msg in sample])
        
        prompt = f"""Analyze sentiment of these TikTok chat messages:

{messages_text}

Respond ONLY with JSON (no markdown):
{{"overall": "positive/negative/neutral", "score": <-1 to 1>, "analysis": "<one sentence>"}}"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        cleaned = response.strip().replace('```json', '').replace('```', '').strip()
        return json.loads(cleaned)
    except Exception as e:
        return {"overall": "neutral", "score": 0, "analysis": "Analysis unavailable"}


async def generate_content_recommendations(creator_data):
    """Generate content recommendations using Gemini"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommendations-{creator_data.get('creator_id', 'unknown')}",
            system_message="You are a TikTok growth strategist. Provide 3 specific, actionable content ideas."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Based on this creator's data, suggest 3 specific content ideas:

Average Viewers: {creator_data.get('avg_viewers', 0)}
Total Streams: {creator_data.get('total_streams', 0)}
Engagement Rate: {creator_data.get('engagement_rate', 0)}%
Best Time: {creator_data.get('best_time', 'N/A')}
Trend: {creator_data.get('trend', 'stable')}

Provide exactly 3 numbered, actionable ideas."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        return {"recommendations": response.strip()}
    except Exception as e:
        return {"recommendations": "1. Stream consistently\n2. Engage with viewers\n3. Analyze your metrics"}


async def main():
    """Main CLI handler"""
    # Read JSON input from stdin
    input_data = sys.stdin.read()
    
    try:
        request = json.loads(input_data)
        method = request.get('method')
        data = request.get('data', {})
        
        if method == 'generate_stream_summary':
            result = await generate_stream_summary(data)
        elif method == 'analyze_sentiment':
            result = await analyze_sentiment(data)
        elif method == 'generate_content_recommendations':
            result = await generate_content_recommendations(data)
        else:
            result = {"error": f"Unknown method: {method}"}
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    asyncio.run(main())
