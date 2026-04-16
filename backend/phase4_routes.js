// ============= PHASE 4: AI & MACHINE LEARNING FEATURES =============

import natural from 'natural';
import Sentiment from 'sentiment';
import compromise from 'compromise';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sentiment = new Sentiment();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Helper to call Python AI service
async function callAIService(method, data) {
  return new Promise((resolve, reject) => {
    const aiServicePath = join(__dirname, 'ai_service_cli.py');
    const python = spawn('/root/.venv/bin/python3', [aiServicePath]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error(`AI Service error: ${errorOutput}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          // If parsing fails, return raw output
          resolve({ result: output.trim() });
        }
      }
    });
    
    // Send data to Python script via stdin
    python.stdin.write(JSON.stringify({ method, data }));
    python.stdin.end();
  });
}

export function setupPhase4Routes(app, db, io, authenticateToken, ObjectId) {

// ============= AI-POWERED CONTENT MODERATION =============

// Content moderation rules
const MODERATION_RULES = {
  profanity: ['badword1', 'badword2'], // Add actual profanity list
  spam: {
    maxRepeatedChars: 5,
    maxEmojis: 10,
    maxCapsPercentage: 70
  },
  toxicity: {
    threshold: 0.7
  }
};

// Moderate content
async function moderateContent(text) {
  const results = {
    flagged: false,
    reasons: [],
    score: 0
  };

  // Check profanity
  const lowerText = text.toLowerCase();
  for (const word of MODERATION_RULES.profanity) {
    if (lowerText.includes(word)) {
      results.flagged = true;
      results.reasons.push('profanity');
      results.score += 0.3;
      break;
    }
  }

  // Check spam patterns
  const repeatedChars = /(.)\1{4,}/g;
  if (repeatedChars.test(text)) {
    results.flagged = true;
    results.reasons.push('repeated_characters');
    results.score += 0.2;
  }

  // Check excessive caps
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const capsPercentage = (capsCount / text.length) * 100;
  if (capsPercentage > MODERATION_RULES.spam.maxCapsPercentage) {
    results.flagged = true;
    results.reasons.push('excessive_caps');
    results.score += 0.2;
  }

  // Sentiment-based toxicity
  const sentimentResult = sentiment.analyze(text);
  if (sentimentResult.score < -3) {
    results.flagged = true;
    results.reasons.push('negative_sentiment');
    results.score += 0.3;
  }

  return results;
}

// Moderate chat message API
app.post('/api/ai/moderate', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await moderateContent(text);
    res.json(result);
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ error: 'Failed to moderate content' });
  }
});

// ============= PREDICTIVE ANALYTICS =============

// Predict stream performance
async function predictStreamPerformance(creatorId) {
  try {
    // Get historical data
    const streams = await db.collection('live_streams')
      .find({ creator_id: new ObjectId(creatorId) })
      .sort({ start_time: -1 })
      .limit(10)
      .toArray();

    if (streams.length < 3) {
      return { confidence: 'low', message: 'Insufficient data for prediction' };
    }

    // Calculate averages
    const avgViewers = streams.reduce((sum, s) => sum + (s.peak_viewers || 0), 0) / streams.length;
    const avgRevenue = streams.reduce((sum, s) => sum + (s.total_gifts_value || 0), 0) / streams.length;
    const avgDuration = streams.reduce((sum, s) => {
      if (s.end_time) {
        return sum + (s.end_time - s.start_time) / 1000 / 60;
      }
      return sum;
    }, 0) / streams.length;

    // Trend analysis
    const recentStreams = streams.slice(0, 3);
    const recentAvgViewers = recentStreams.reduce((sum, s) => sum + (s.peak_viewers || 0), 0) / 3;
    const trend = recentAvgViewers > avgViewers ? 'increasing' : 'decreasing';

    // Prediction
    const prediction = {
      predicted_viewers: Math.round(recentAvgViewers * (trend === 'increasing' ? 1.1 : 0.9)),
      predicted_revenue: Math.round(avgRevenue * (trend === 'increasing' ? 1.15 : 0.85)),
      predicted_duration: Math.round(avgDuration),
      confidence: streams.length >= 5 ? 'high' : 'medium',
      trend,
      factors: {
        historical_avg_viewers: Math.round(avgViewers),
        historical_avg_revenue: Math.round(avgRevenue),
        recent_performance: trend
      }
    };

    return prediction;
  } catch (error) {
    console.error('Prediction error:', error);
    return null;
  }
}

// Get stream predictions
app.get('/api/ai/predict/:creatorId', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const prediction = await predictStreamPerformance(creatorId);
    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// ============= RECOMMENDATION ENGINE =============

// Generate recommendations
async function generateRecommendations(userId, type = 'creators') {
  try {
    if (type === 'creators') {
      // Get user's current creators
      const userCreators = await db.collection('user_creators')
        .find({ user_id: new ObjectId(userId) })
        .toArray();

      const currentCreatorIds = userCreators.map(uc => uc.creator_id);

      // Find similar creators based on performance
      const recommendations = await db.collection('creators')
        .find({ 
          _id: { $nin: currentCreatorIds },
          performance_score: { $gte: 50 }
        })
        .sort({ performance_score: -1 })
        .limit(10)
        .toArray();

      return recommendations.map(c => ({
        ...c,
        reason: 'High performance score',
        match_score: c.performance_score
      }));
    }

    return [];
  } catch (error) {
    console.error('Recommendation error:', error);
    return [];
  }
}

// Get recommendations API
app.get('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { type = 'creators' } = req.query;
    
    const recommendations = await generateRecommendations(userId, type);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============= NATURAL LANGUAGE PROCESSING =============

// Extract keywords from text
function extractKeywords(text) {
  const doc = compromise(text);
  
  return {
    topics: doc.topics().out('array'),
    people: doc.people().out('array'),
    places: doc.places().out('array'),
    organizations: doc.organizations().out('array'),
    hashtags: (text.match(/#\w+/g) || []),
    mentions: (text.match(/@\w+/g) || [])
  };
}

// Analyze chat messages for insights
app.post('/api/ai/analyze-text', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    const keywords = extractKeywords(text);
    const sentimentResult = sentiment.analyze(text);
    
    res.json({
      keywords,
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative
      }
    });
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// ============= ANOMALY DETECTION =============

// Detect anomalies in metrics
async function detectAnomalies(creatorId, metric = 'viewers') {
  try {
    const streams = await db.collection('live_streams')
      .find({ creator_id: new ObjectId(creatorId) })
      .sort({ start_time: -1 })
      .limit(20)
      .toArray();

    if (streams.length < 5) {
      return { anomalies: [], message: 'Insufficient data' };
    }

    // Get metric values
    const values = streams.map(s => {
      if (metric === 'viewers') return s.peak_viewers || 0;
      if (metric === 'revenue') return s.total_gifts_value || 0;
      return 0;
    });

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies (values > 2 standard deviations from mean)
    const anomalies = [];
    streams.forEach((stream, index) => {
      const value = values[index];
      const zScore = (value - mean) / stdDev;
      
      if (Math.abs(zScore) > 2) {
        anomalies.push({
          stream_id: stream._id,
          date: stream.start_time,
          value,
          z_score: zScore.toFixed(2),
          type: zScore > 0 ? 'spike' : 'drop'
        });
      }
    });

    return {
      anomalies,
      statistics: {
        mean: Math.round(mean),
        std_dev: Math.round(stdDev),
        threshold: Math.round(mean + 2 * stdDev)
      }
    };
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return { anomalies: [], error: error.message };
  }
}

// Detect anomalies API
app.get('/api/ai/anomalies/:creatorId', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { metric = 'viewers' } = req.query;
    
    const result = await detectAnomalies(creatorId, metric);
    res.json(result);
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// ============= TREND PREDICTION =============

// Predict trending topics
async function predictTrends() {
  try {
    // Analyze recent chat messages
    const recentChats = await db.collection('chat_messages')
      .find({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      .toArray();

    if (recentChats.length === 0) {
      return { trends: [], message: 'No recent data' };
    }

    // Extract keywords
    const allText = recentChats.map(c => c.message).join(' ');
    const keywords = extractKeywords(allText);

    // Count keyword frequencies
    const keywordCounts = {};
    [...keywords.topics, ...keywords.hashtags].forEach(kw => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });

    // Sort by frequency
    const trends = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, mentions: count }));

    return { trends, total_messages: recentChats.length };
  } catch (error) {
    console.error('Trend prediction error:', error);
    return { trends: [], error: error.message };
  }
}

// Get trending topics API
app.get('/api/ai/trends', authenticateToken, async (req, res) => {
  try {
    const trends = await predictTrends();
    res.json(trends);
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// ============= SMART INSIGHTS =============

// Generate AI insights
async function generateInsights(creatorId) {
  try {
    const [prediction, anomalies, performance] = await Promise.all([
      predictStreamPerformance(creatorId),
      detectAnomalies(creatorId, 'viewers'),
      db.collection('creators').findOne({ _id: new ObjectId(creatorId) })
    ]);

    const insights = [];

    // Performance insights
    if (prediction && prediction.trend === 'increasing') {
      insights.push({
        type: 'positive',
        category: 'performance',
        message: `Your streams are trending up! ${prediction.predicted_viewers} viewers predicted next stream.`,
        action: 'Keep up the great content!'
      });
    } else if (prediction && prediction.trend === 'decreasing') {
      insights.push({
        type: 'warning',
        category: 'performance',
        message: 'Viewership trending down. Time to refresh your content.',
        action: 'Try new content formats or stream at different times.'
      });
    }

    // Anomaly insights
    if (anomalies.anomalies && anomalies.anomalies.length > 0) {
      const recentSpikes = anomalies.anomalies.filter(a => a.type === 'spike').slice(0, 1);
      if (recentSpikes.length > 0) {
        insights.push({
          type: 'info',
          category: 'anomaly',
          message: `You had an exceptional stream with ${recentSpikes[0].value} viewers!`,
          action: 'Analyze what made that stream special and replicate it.'
        });
      }
    }

    // Score insights
    if (performance && performance.performance_score) {
      if (performance.performance_score > 70) {
        insights.push({
          type: 'positive',
          category: 'score',
          message: `Excellent performance score: ${performance.performance_score}/100`,
          action: 'You\'re doing great! Consider monetization strategies.'
        });
      } else if (performance.performance_score < 30) {
        insights.push({
          type: 'warning',
          category: 'score',
          message: `Performance score needs improvement: ${performance.performance_score}/100`,
          action: 'Focus on increasing engagement and stream frequency.'
        });
      }
    }

    return insights;
  } catch (error) {
    console.error('Insights generation error:', error);
    return [];
  }
}

// Get AI insights API
app.get('/api/ai/insights/:creatorId', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const insights = await generateInsights(creatorId);
    res.json(insights);
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ============= GEMINI-POWERED AI FEATURES =============

// Generate AI-powered stream summary using Gemini
app.post('/api/ai/stream-summary', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.body;
    
    const stream = await db.collection('live_streams').findOne({ _id: new ObjectId(streamId) });
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    const [giftCount, chatCount] = await Promise.all([
      db.collection('gifts').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('chat_messages').countDocuments({ stream_id: new ObjectId(streamId) })
    ]);
    
    const duration = stream.end_time ? 
      Math.floor((stream.end_time - stream.start_time) / 1000 / 60) : 
      Math.floor((new Date() - stream.start_time) / 1000 / 60);
    
    const streamData = {
      stream_id: streamId,
      duration,
      peak_viewers: stream.peak_viewers || 0,
      total_gifts: giftCount,
      total_revenue: stream.total_gifts_value || 0,
      total_chats: chatCount
    };
    
    // Call Python AI service for Gemini-powered summary
    const result = await callAIService('generate_stream_summary', streamData);
    
    res.json({ 
      summary: result.summary || result.result,
      metrics: streamData,
      generated_by: 'Gemini 3 Flash'
    });
  } catch (error) {
    console.error('AI Summary error:', error);
    res.status(500).json({ error: 'Failed to generate AI summary' });
  }
});

// AI-powered chat sentiment analysis using Gemini
app.post('/api/ai/analyze-sentiment', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.body;
    
    const messages = await db.collection('chat_messages')
      .find({ stream_id: new ObjectId(streamId) })
      .limit(100)
      .toArray();
    
    if (messages.length === 0) {
      return res.json({
        overall: 'neutral',
        score: 0,
        analysis: 'No messages to analyze',
        message_count: 0
      });
    }
    
    const messageTexts = messages.map(m => m.message);
    
    // Call Python AI service for Gemini-powered sentiment analysis
    const result = await callAIService('analyze_sentiment', { messages: messageTexts });
    
    res.json({
      ...result,
      message_count: messages.length,
      generated_by: 'Gemini 3 Flash'
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// AI content recommendations using Gemini
app.post('/api/ai/recommendations', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.body;
    
    const [streams, performance, giftPatterns] = await Promise.all([
      db.collection('live_streams')
        .find({ creator_id: new ObjectId(creatorId) })
        .sort({ start_time: -1 })
        .limit(10)
        .toArray(),
      db.collection('creators').findOne({ _id: new ObjectId(creatorId) }),
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: {
          _id: { $hour: '$timestamp' },
          total: { $sum: '$total_value' }
        } },
        { $sort: { total: -1 } },
        { $limit: 1 }
      ]).toArray()
    ]);
    
    const avgViewers = streams.reduce((sum, s) => sum + (s.peak_viewers || 0), 0) / (streams.length || 1);
    const trend = streams.length >= 3 && streams[0].peak_viewers > avgViewers ? 'increasing' : 'stable';
    const bestTime = giftPatterns[0]?._id || 'N/A';
    
    const creatorData = {
      creator_id: creatorId,
      avg_viewers: Math.round(avgViewers),
      total_streams: streams.length,
      engagement_rate: performance?.engagement_rate || 0,
      best_time: `${bestTime}:00`,
      trend
    };
    
    // Call Python AI service for Gemini-powered recommendations
    const result = await callAIService('generate_content_recommendations', creatorData);
    
    res.json({
      recommendations: result.recommendations || result.result,
      based_on: creatorData,
      generated_by: 'Gemini 3 Flash'
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ============= AUTOMATED SUGGESTIONS =============

// Get optimization suggestions
app.get('/api/ai/suggestions/:creatorId', authenticateToken, async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    const [giftPatterns, performance, recentStreams] = await Promise.all([
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: {
          _id: { $hour: '$timestamp' },
          total: { $sum: '$total_value' },
          count: { $sum: 1 }
        } },
        { $sort: { total: -1 } },
        { $limit: 3 }
      ]).toArray(),
      db.collection('creators').findOne({ _id: new ObjectId(creatorId) }),
      db.collection('live_streams')
        .find({ creator_id: new ObjectId(creatorId) })
        .sort({ start_time: -1 })
        .limit(5)
        .toArray()
    ]);

    const suggestions = [];

    // Best time to stream
    if (giftPatterns.length > 0) {
      suggestions.push({
        category: 'timing',
        title: 'Optimal Stream Time',
        suggestion: `Stream at ${giftPatterns[0]._id}:00 for maximum revenue`,
        impact: 'high',
        data: { best_hour: giftPatterns[0]._id, avg_revenue: giftPatterns[0].total }
      });
    }

    // Stream frequency
    if (recentStreams.length < 3) {
      suggestions.push({
        category: 'frequency',
        title: 'Stream More Often',
        suggestion: 'Increase stream frequency to 3-4 times per week',
        impact: 'high',
        data: { current_frequency: recentStreams.length }
      });
    }

    // Performance improvements
    if (performance && performance.performance_score < 50) {
      suggestions.push({
        category: 'engagement',
        title: 'Boost Engagement',
        suggestion: 'Interact more with chat and encourage gifts',
        impact: 'medium',
        data: { current_score: performance.performance_score }
      });
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

console.log('✅ Phase 4 (AI & ML) routes loaded');

}
