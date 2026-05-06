# TikTok Live Service

Standalone microservice for monitoring TikTok live streams.

## Features
- ✅ WebSocket connection to TikTok
- ✅ Automatic reconnection with exponential backoff
- ✅ Event publishing to message bus
- ✅ Circuit breaker protection
- ✅ Health monitoring
- ✅ Stats tracking

## API Endpoints

### POST /connect
Start monitoring a creator
```json
{
  "username": "darkskully"
}
```

### POST /disconnect
Stop monitoring
```json
{
  "username": "darkskully"
}
```

### GET /connections
List all active connections

### GET /stats/:username
Get stats for specific creator

### GET /health
Health check

## Events Published

All events are published to Redis Streams on `tiktok.events` stream:

- `gift` - Gift received
- `comment` - Comment posted
- `like` - Like received
- `share` - Stream shared
- `follow` - New follower
- `connection` - Connection status change
- `error` - Error occurred

## Configuration

Environment variables:
- `TIKTOK_SERVICE_PORT` - Port (default: 8010)
- `REDIS_URL` - Redis connection URL
- `DEFAULT_TIKTOK_CREATOR` - Auto-connect creator

## Running

```bash
npm install
npm start
```
