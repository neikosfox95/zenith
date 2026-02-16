import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        
    async def analyze_chat_sentiment(self, messages: list) -> dict:
        """Analyze sentiment of chat messages using Gemini AI"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="sentiment-analysis",
                system_message="You are an expert at analyzing social media chat sentiment. Provide concise sentiment analysis."
            ).with_model("gemini", "gemini-2.5-flash")
            
            chat_text = "\\n".join([f"{msg.get('sender', 'User')}: {msg.get('message', '')}" for msg in messages[-50:]])  # Last 50 messages
            
            user_message = UserMessage(
                text=f"Analyze the sentiment of these TikTok live stream chat messages. Provide: 1) Overall sentiment (positive/negative/neutral with %), 2) Key emotions detected, 3) Engagement level (high/medium/low). Messages:\\n{chat_text}"
            )
            
            response = await chat.send_message(user_message)
            return {
                "success": True,
                "analysis": response,
                "message_count": len(messages)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def predict_viral_potential(self, stream_data: dict) -> dict:
        """Predict if stream has viral potential"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="viral-prediction",
                system_message="You are a TikTok algorithm expert. Analyze stream data and predict viral potential."
            ).with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Analyze this TikTok live stream data and predict viral potential:
- Viewers: {stream_data.get('viewers', 0)}
- Peak Viewers: {stream_data.get('peak_viewers', 0)}
- Gifts: {stream_data.get('total_gifts', 0)}
- Duration: {stream_data.get('duration', 0)} minutes
- Engagement Rate: {stream_data.get('engagement_rate', 0)}%

Provide:
1) Viral potential score (0-100)
2) Key factors contributing to virality
3) Recommendations to increase viral potential
4) Predicted reach in next 24 hours"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "prediction": response,
                "stream_id": stream_data.get('stream_id')
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def generate_content_ideas(self, creator_data: dict) -> dict:
        """Generate content ideas based on creator performance"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="content-ideas",
                system_message="You are a TikTok content strategist. Generate creative content ideas."
            ).with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Generate 5 content ideas for this TikTok creator:
- Username: @{creator_data.get('username')}
- Average Viewers: {creator_data.get('avg_viewers', 0)}
- Top Gift Types: {creator_data.get('top_gifts', [])}
- Audience Engagement: {creator_data.get('engagement', 'medium')}

Provide:
1) Content idea title
2) Brief description
3) Estimated viral potential
4) Target audience
5) Best time to post"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "ideas": response,
                "creator": creator_data.get('username')
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def generate_hashtags(self, content_description: str) -> dict:
        """Generate optimized hashtags for content"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="hashtag-generator",
                system_message="You are a TikTok hashtag expert. Generate trending, relevant hashtags."
            ).with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Generate 15 optimized hashtags for this TikTok content: {content_description}

Include:
- 5 trending hashtags (high reach)
- 5 niche hashtags (targeted)
- 5 evergreen hashtags (consistent performance)

Format: comma-separated list with # symbol"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "hashtags": response,
                "content": content_description
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def analyze_competitor(self, competitor_data: dict) -> dict:
        """Analyze competitor performance"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="competitor-analysis",
                system_message="You are a competitive analysis expert for social media."
            ).with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Analyze this competitor's TikTok performance:
- Username: @{competitor_data.get('username')}
- Total Streams: {competitor_data.get('total_streams', 0)}
- Avg Viewers: {competitor_data.get('avg_viewers', 0)}
- Growth Rate: {competitor_data.get('growth_rate', 0)}%

Provide:
1) Strengths
2) Weaknesses
3) Opportunities to outperform
4) Strategic recommendations
5) Content gaps to exploit"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "analysis": response,
                "competitor": competitor_data.get('username')
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def optimize_stream_time(self, historical_data: list) -> dict:
        """Recommend optimal streaming times"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="time-optimization",
                system_message="You are a data analyst specializing in TikTok streaming optimization."
            ).with_model("gemini", "gemini-2.5-flash")
            
            data_summary = "\\n".join([
                f"Day: {d.get('day')}, Time: {d.get('time')}, Viewers: {d.get('viewers')}, Engagement: {d.get('engagement')}%"
                for d in historical_data[-30:]  # Last 30 streams
            ])
            
            prompt = f"""Based on this historical TikTok stream data, recommend optimal streaming times:

{data_summary}

Provide:
1) Best 3 time slots (with days and hours)
2) Reasoning for each recommendation
3) Expected viewer increase
4) Days to avoid
5) Seasonal considerations"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "recommendations": response,
                "data_points": len(historical_data)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def detect_trending_topics(self, recent_streams: list) -> dict:
        """Detect trending topics from recent streams"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="trend-detection",
                system_message="You are a trend analyst for TikTok content."
            ).with_model("gemini", "gemini-2.5-flash")
            
            topics_text = "\\n".join([
                f"Stream: {s.get('title', 'Untitled')}, Keywords: {s.get('keywords', [])}, Engagement: {s.get('engagement', 0)}"
                for s in recent_streams[-20:]
            ])
            
            prompt = f"""Analyze these recent TikTok streams and identify trending topics:

{topics_text}

Provide:
1) Top 5 trending topics
2) Trend momentum (rising/stable/declining)
3) Predicted longevity
4) Content recommendations for each trend
5) Hashtags to use"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "trends": response,
                "streams_analyzed": len(recent_streams)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def generate_stream_script(self, requirements: dict) -> dict:
        """Generate TikTok live stream script"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="script-generator",
                system_message="You are a TikTok live stream scriptwriter. Create engaging, authentic scripts."
            ).with_model("gemini", "gemini-2.5-flash")
            
            prompt = f"""Create a TikTok live stream script:
- Topic: {requirements.get('topic')}
- Duration: {requirements.get('duration', 30)} minutes
- Target Audience: {requirements.get('audience')}
- Goal: {requirements.get('goal', 'engagement')}
- Tone: {requirements.get('tone', 'casual')}

Include:
1) Opening hook (first 15 seconds)
2) Main content structure
3) Engagement prompts (3-5)
4) Gift solicitation tactics
5) Closing CTA"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "script": response,
                "topic": requirements.get('topic')
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

ai_service = AIService()
