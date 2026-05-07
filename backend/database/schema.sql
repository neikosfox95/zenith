-- ============================================================
-- TIKTOK ANALYTICS DATABASE SCHEMA
-- Complete schema for 1,200+ metrics tracking
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CREATORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  follower_count BIGINT DEFAULT 0,
  following_count BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  total_videos INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_live BOOLEAN DEFAULT FALSE,
  last_live_at TIMESTAMP,
  tracking_status VARCHAR(50) DEFAULT 'active', -- active, paused, stopped
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_creators_tracking_status ON creators(tracking_status);

-- ============================================================
-- LIVE_EVENTS TABLE (All TikTok Live Events)
-- ============================================================
CREATE TABLE IF NOT EXISTS live_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- gift, chat, like, share, follow, join, subscribe, etc.
  event_data JSONB NOT NULL, -- Full event payload
  user_id VARCHAR(255),
  username VARCHAR(255),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_live_events_creator ON live_events(creator_id);
CREATE INDEX idx_live_events_type ON live_events(event_type);
CREATE INDEX idx_live_events_timestamp ON live_events(timestamp);
CREATE INDEX idx_live_events_user ON live_events(username);
CREATE INDEX idx_live_events_created_at ON live_events(created_at);

-- ============================================================
-- LIVE_STREAMS TABLE (Stream Sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_seconds INT,
  peak_viewers INT DEFAULT 0,
  total_viewers INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_gifts INT DEFAULT 0,
  total_diamonds BIGINT DEFAULT 0,
  revenue_usd DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'live', -- live, ended, error
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_live_streams_creator ON live_streams(creator_id);
CREATE INDEX idx_live_streams_started ON live_streams(started_at);
CREATE INDEX idx_live_streams_status ON live_streams(status);

-- ============================================================
-- GIFTS_TRACKING TABLE (Detailed Gift Analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS gifts_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  gift_id INT NOT NULL,
  gift_name VARCHAR(255) NOT NULL,
  sender_username VARCHAR(255),
  sender_user_id VARCHAR(255),
  repeat_count INT DEFAULT 1,
  diamond_count INT NOT NULL,
  coin_value INT NOT NULL,
  usd_value DECIMAL(10, 2),
  creator_payout DECIMAL(10, 2), -- 50% of gift value
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gifts_stream ON gifts_tracking(stream_id);
CREATE INDEX idx_gifts_creator ON gifts_tracking(creator_id);
CREATE INDEX idx_gifts_sender ON gifts_tracking(sender_username);
CREATE INDEX idx_gifts_timestamp ON gifts_tracking(timestamp);

-- ============================================================
-- VIEWER_TRACKING TABLE (Viewer Analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS viewer_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  viewer_count INT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_viewer_tracking_stream ON viewer_tracking(stream_id);
CREATE INDEX idx_viewer_tracking_timestamp ON viewer_tracking(timestamp);

-- ============================================================
-- ANALYTICS_SUMMARY TABLE (Aggregated Metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Stream Metrics
  total_streams INT DEFAULT 0,
  total_stream_duration_seconds BIGINT DEFAULT 0,
  avg_stream_duration_seconds INT DEFAULT 0,
  peak_viewers_max INT DEFAULT 0,
  avg_viewers DECIMAL(10, 2) DEFAULT 0,
  
  -- Engagement Metrics
  total_comments BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  total_shares BIGINT DEFAULT 0,
  total_follows BIGINT DEFAULT 0,
  total_joins BIGINT DEFAULT 0,
  
  -- Monetization Metrics
  total_gifts BIGINT DEFAULT 0,
  total_diamonds BIGINT DEFAULT 0,
  total_revenue_usd DECIMAL(10, 2) DEFAULT 0,
  total_subscribes BIGINT DEFAULT 0,
  
  -- Interactive Metrics
  total_questions BIGINT DEFAULT 0,
  total_emotes BIGINT DEFAULT 0,
  total_stickers BIGINT DEFAULT 0,
  
  -- Competition Metrics
  total_battles BIGINT DEFAULT 0,
  total_mic_battles BIGINT DEFAULT 0,
  total_link_mics BIGINT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_creator ON analytics_summary(creator_id);
CREATE INDEX idx_analytics_period ON analytics_summary(period_type, period_start);

-- ============================================================
-- TOP_GIFTERS TABLE (Leaderboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS top_gifters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  total_gifts INT DEFAULT 0,
  total_diamonds BIGINT DEFAULT 0,
  total_spent_usd DECIMAL(10, 2) DEFAULT 0,
  last_gift_at TIMESTAMP,
  rank INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_top_gifters_creator ON top_gifters(creator_id);
CREATE INDEX idx_top_gifters_username ON top_gifters(username);
CREATE INDEX idx_top_gifters_rank ON top_gifters(rank);

-- ============================================================
-- ENGAGEMENT_METRICS TABLE (Real-time Engagement)
-- ============================================================
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  minute_mark INT NOT NULL, -- Minute in the stream
  comments_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  gifts_count INT DEFAULT 0,
  viewer_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engagement_stream ON engagement_metrics(stream_id);
CREATE INDEX idx_engagement_minute ON engagement_metrics(minute_mark);

-- ============================================================
-- SYSTEM_LOGS TABLE (Monitoring & Debugging)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level VARCHAR(20) NOT NULL, -- info, warning, error, debug
  service VARCHAR(50), -- tiktok-service, analytics-engine, etc.
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_service ON system_logs(service);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- ============================================================
-- UPDATE TIMESTAMP TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON live_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_top_gifters_updated_at BEFORE UPDATE ON top_gifters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================

-- Get top 10 gifters for a creator
-- SELECT username, total_diamonds, total_spent_usd, rank
-- FROM top_gifters
-- WHERE creator_id = 'xxx'
-- ORDER BY rank ASC
-- LIMIT 10;

-- Get stream analytics for today
-- SELECT * FROM analytics_summary
-- WHERE creator_id = 'xxx'
-- AND period_type = 'daily'
-- AND period_start >= CURRENT_DATE;

-- Get live event counts by type
-- SELECT event_type, COUNT(*) as count
-- FROM live_events
-- WHERE creator_id = 'xxx'
-- AND created_at >= NOW() - INTERVAL '1 day'
-- GROUP BY event_type
-- ORDER BY count DESC;
