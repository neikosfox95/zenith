import { ObjectId } from 'mongodb';
import geoip from 'geoip-lite';

/**
 * Geographic Analytics Service
 * Track and analyze viewer locations with interactive maps
 */
export class GeographicAnalytics {
  constructor(private db: any) {}

  /**
   * Get real-time viewer location map data
   */
  async getViewerLocationMap(streamId: string): Promise<any> {
    try {
      // Get all viewers for current stream
      const viewers = await this.db.collection('stream_viewers')
        .find({ stream_id: new ObjectId(streamId) })
        .toArray();

      const locationData: any[] = [];
      const countryCounts: Map<string, number> = new Map();
      const cityCounts: Map<string, number> = new Map();

      for (const viewer of viewers) {
        const geo = this.getGeoFromIP(viewer.ip_address);
        
        if (geo) {
          locationData.push({
            lat: geo.ll[0],
            lng: geo.ll[1],
            country: geo.country,
            city: geo.city,
            viewer_id: viewer.viewer_id,
            join_time: viewer.join_time
          });

          // Count by country
          const countryCount = countryCounts.get(geo.country) || 0;
          countryCounts.set(geo.country, countryCount + 1);

          // Count by city
          const cityKey = `${geo.city}, ${geo.country}`;
          const cityCount = cityCounts.get(cityKey) || 0;
          cityCounts.set(cityKey, cityCount + 1);
        }
      }

      return {
        success: true,
        total_viewers: viewers.length,
        mapped_viewers: locationData.length,
        locations: locationData,
        top_countries: Array.from(countryCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([country, count]) => ({ country, count })),
        top_cities: Array.from(cityCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([city, count]) => ({ city, count })),
        heatmap_data: this.generateHeatmapData(locationData)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get geolocation from IP address
   */
  private getGeoFromIP(ip: string): any {
    return geoip.lookup(ip);
  }

  /**
   * Generate heatmap data for visualization
   */
  private generateHeatmapData(locations: any[]): any[] {
    // Group nearby locations for heatmap intensity
    const heatmap: any[] = [];
    const gridSize = 1; // 1 degree grid

    const grid: Map<string, number> = new Map();

    for (const loc of locations) {
      const gridLat = Math.floor(loc.lat / gridSize) * gridSize;
      const gridLng = Math.floor(loc.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      const count = grid.get(key) || 0;
      grid.set(key, count + 1);
    }

    for (const [key, intensity] of grid.entries()) {
      const [lat, lng] = key.split(',').map(Number);
      heatmap.push({
        lat: lat + gridSize / 2,
        lng: lng + gridSize / 2,
        intensity: intensity
      });
    }

    return heatmap;
  }

  /**
   * Get geographic analytics for creator
   */
  async getGeographicAnalytics(creatorId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const streams = await this.db.collection('live_streams')
        .find({
          creator_id: new ObjectId(creatorId),
          start_time: { $gte: startDate }
        })
        .toArray();

      const streamIds = streams.map(s => s._id);

      const viewers = await this.db.collection('stream_viewers')
        .find({ stream_id: { $in: streamIds } })
        .toArray();

      // Analyze geographic distribution
      const countryStats: Map<string, any> = new Map();
      const timezoneStats: Map<string, number> = new Map();

      for (const viewer of viewers) {
        const geo = this.getGeoFromIP(viewer.ip_address);
        
        if (geo) {
          // Country stats
          if (!countryStats.has(geo.country)) {
            countryStats.set(geo.country, {
              country: geo.country,
              viewers: 0,
              total_watch_time: 0,
              engagement_rate: 0
            });
          }
          const stats = countryStats.get(geo.country);
          stats.viewers++;
          stats.total_watch_time += viewer.watch_time || 0;

          // Timezone stats
          const tz = geo.timezone || 'Unknown';
          const tzCount = timezoneStats.get(tz) || 0;
          timezoneStats.set(tz, tzCount + 1);
        }
      }

      return {
        success: true,
        period_days: days,
        total_streams: streams.length,
        total_viewers: viewers.length,
        unique_countries: countryStats.size,
        country_breakdown: Array.from(countryStats.values())
          .sort((a, b) => b.viewers - a.viewers),
        timezone_distribution: Array.from(timezoneStats.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([tz, count]) => ({ timezone: tz, viewers: count })),
        recommendations: this.generateGeoRecommendations(countryStats)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate geographic recommendations
   */
  private generateGeoRecommendations(countryStats: Map<string, any>): string[] {
    const recommendations: string[] = [];
    const countries = Array.from(countryStats.values()).sort((a, b) => b.viewers - a.viewers);

    if (countries.length > 0) {
      const topCountry = countries[0];
      recommendations.push(`Focus on ${topCountry.country} - your largest audience`);
      
      if (countries.length > 1) {
        const secondCountry = countries[1];
        recommendations.push(`Expand in ${secondCountry.country} - growing market`);
      }

      // Check for underperforming regions
      const avgWatchTime = countries.reduce((sum, c) => sum + c.total_watch_time, 0) / countries.length;
      const underperforming = countries.filter(c => c.total_watch_time < avgWatchTime * 0.5);
      
      if (underperforming.length > 0) {
        recommendations.push(`Improve engagement in ${underperforming[0].country}`);
      }
    }

    return recommendations;
  }
}

/**
 * Fan Club & Super Fan Management
 */
export class FanClubManager {
  constructor(private db: any) {}

  /**
   * Initialize fan profile
   */
  async initializeFan(userId: string, creatorId: string): Promise<any> {
    try {
      const existingFan = await this.db.collection('fan_profiles').findOne({
        user_id: new ObjectId(userId),
        creator_id: new ObjectId(creatorId)
      });

      if (existingFan) {
        return { success: true, fan: existingFan };
      }

      const fanProfile = {
        user_id: new ObjectId(userId),
        creator_id: new ObjectId(creatorId),
        level: 1,
        points: 0,
        total_gifts_value: 0,
        total_gifts_count: 0,
        engagement_score: 0,
        join_date: new Date(),
        last_active: new Date(),
        badges: ['new_fan'],
        perks: [],
        subscription_tier: null,
        vip_status: false,
        league: 'bronze',
        streak_days: 0
      };

      await this.db.collection('fan_profiles').insertOne(fanProfile);

      return { success: true, fan: fanProfile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update fan level based on activity
   */
  async updateFanLevel(fanId: string, newPoints: number, giftValue: number = 0): Promise<any> {
    try {
      const fan = await this.db.collection('fan_profiles').findOne({ _id: new ObjectId(fanId) });
      
      if (!fan) {
        return { success: false, error: 'Fan not found' };
      }

      const totalPoints = fan.points + newPoints;
      const newLevel = this.calculateLevel(totalPoints);
      const leveledUp = newLevel > fan.level;

      const update: any = {
        points: totalPoints,
        level: newLevel,
        last_active: new Date()
      };

      if (giftValue > 0) {
        update.total_gifts_value = fan.total_gifts_value + giftValue;
        update.total_gifts_count = fan.total_gifts_count + 1;
      }

      // Check for super fan status
      if (newLevel >= 10 || update.total_gifts_value >= 1000) {
        update.vip_status = true;
        if (!fan.badges.includes('super_fan')) {
          update.badges = [...fan.badges, 'super_fan'];
        }
      }

      await this.db.collection('fan_profiles').updateOne(
        { _id: new ObjectId(fanId) },
        { $set: update }
      );

      return {
        success: true,
        leveled_up: leveledUp,
        new_level: newLevel,
        total_points: totalPoints,
        badges_earned: leveledUp ? this.getBadgesForLevel(newLevel) : []
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate fan level from points
   */
  private calculateLevel(points: number): number {
    // Level formula: sqrt(points / 100)
    return Math.min(Math.floor(Math.sqrt(points / 100)) + 1, 100);
  }

  /**
   * Get badges for specific level
   */
  private getBadgesForLevel(level: number): string[] {
    const badges: string[] = [];
    
    if (level >= 5) badges.push('dedicated_fan');
    if (level >= 10) badges.push('super_fan');
    if (level >= 20) badges.push('elite_supporter');
    if (level >= 50) badges.push('legendary_fan');
    if (level >= 100) badges.push('hall_of_fame');

    return badges;
  }

  /**
   * Identify super fans
   */
  async identifySuperFans(creatorId: string, limit: number = 50): Promise<any> {
    try {
      const superFans = await this.db.collection('fan_profiles')
        .find({ creator_id: new ObjectId(creatorId) })
        .sort({ total_gifts_value: -1, level: -1 })
        .limit(limit)
        .toArray();

      return {
        success: true,
        super_fans: superFans,
        total_super_fans: superFans.length,
        total_value: superFans.reduce((sum, fan) => sum + fan.total_gifts_value, 0),
        average_level: superFans.reduce((sum, fan) => sum + fan.level, 0) / superFans.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get fan leaderboard
   */
  async getFanLeaderboard(
    creatorId: string,
    type: 'gifts' | 'engagement' | 'loyalty' | 'level',
    period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'monthly'
  ): Promise<any> {
    try {
      let sortField = 'total_gifts_value';
      if (type === 'engagement') sortField = 'engagement_score';
      if (type === 'loyalty') sortField = 'streak_days';
      if (type === 'level') sortField = 'level';

      const dateFilter = this.getDateFilter(period);
      
      const leaderboard = await this.db.collection('fan_profiles')
        .find({
          creator_id: new ObjectId(creatorId),
          ...dateFilter
        })
        .sort({ [sortField]: -1 })
        .limit(100)
        .toArray();

      return {
        success: true,
        type: type,
        period: period,
        leaderboard: leaderboard.map((fan, index) => ({
          rank: index + 1,
          fan_id: fan._id,
          user_id: fan.user_id,
          level: fan.level,
          points: fan.points,
          value: fan[sortField],
          badges: fan.badges,
          vip_status: fan.vip_status
        })),
        total_participants: leaderboard.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get date filter for period
   */
  private getDateFilter(period: string): any {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { last_active: { $gte: today } };
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { last_active: { $gte: weekAgo } };
      case 'monthly':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { last_active: { $gte: monthAgo } };
      default:
        return {};
    }
  }

  /**
   * Assign fan to league
   */
  async assignLeague(fanId: string): Promise<any> {
    try {
      const fan = await this.db.collection('fan_profiles').findOne({ _id: new ObjectId(fanId) });
      
      if (!fan) {
        return { success: false, error: 'Fan not found' };
      }

      const league = this.determineLeague(fan.level, fan.total_gifts_value);

      await this.db.collection('fan_profiles').updateOne(
        { _id: new ObjectId(fanId) },
        { $set: { league: league } }
      );

      return {
        success: true,
        league: league,
        requirements: this.getLeagueRequirements(league)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Determine league based on stats
   */
  private determineLeague(level: number, totalGifts: number): string {
    if (level >= 50 || totalGifts >= 5000) return 'diamond';
    if (level >= 30 || totalGifts >= 2000) return 'platinum';
    if (level >= 20 || totalGifts >= 1000) return 'gold';
    if (level >= 10 || totalGifts >= 500) return 'silver';
    return 'bronze';
  }

  /**
   * Get league requirements
   */
  private getLeagueRequirements(league: string): any {
    const requirements = {
      bronze: { min_level: 1, min_gifts: 0 },
      silver: { min_level: 10, min_gifts: 500 },
      gold: { min_level: 20, min_gifts: 1000 },
      platinum: { min_level: 30, min_gifts: 2000 },
      diamond: { min_level: 50, min_gifts: 5000 }
    };

    return requirements[league] || requirements.bronze;
  }
}

export default {
  GeographicAnalytics,
  FanClubManager
};
