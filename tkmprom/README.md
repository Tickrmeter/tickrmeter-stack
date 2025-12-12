# TickrMeter MQTT to Prometheus Exporter (tkmprom)

## Overview

This project implements a high-performance MQTT to Prometheus metrics exporter specifically designed for monitoring TickrMeter device fleet performance and backend system health.

**Scale Requirements:**
- ~1000 MQTT messages per second
- ~8000 online devices
- Real-time symbol performance tracking
- Backend performance identification

## Architecture

### Language Choice: **Go**
- High-performance concurrent message processing
- Excellent MQTT and Prometheus client libraries
- Low memory footprint (~100-200MB for 8000 devices)
- Single binary deployment
- Built-in JSON parsing

### Core Components

1. **MQTT Subscriber** - Connects to MQTT broker, handles reconnection
2. **Message Parser** - Parses JSON payloads, extracts metrics
3. **Device State Manager** - Tracks device states with concurrent access
4. **Symbol Performance Tracker** - Correlates requests/responses, calculates latencies
5. **Request Correlator** - Matches stock update requests with responses
6. **Prometheus Exporter** - Serves metrics on HTTP endpoint
7. **Cleanup Manager** - Periodic cleanup of stale data

## Key Metrics

### Device Health Metrics
```go
// Device status and firmware distribution
tickrmeter_devices_online_total{firmware_version, iv, flash_id}
tickrmeter_device_battery_level{device_id, firmware_version}
tickrmeter_device_charging_status{device_id}
tickrmeter_device_uptime_seconds{device_id}
tickrmeter_device_wifi_lost_count{device_id}
tickrmeter_device_vin_level{device_id}
tickrmeter_device_boot_count{device_id}
tickrmeter_device_last_seen_timestamp{device_id}
```

### Stock Update Performance Metrics
```go
// Request/Response tracking
tickrmeter_stock_update_requests_total{device_id, symbol}
tickrmeter_stock_update_responses_total{device_id, symbol}
tickrmeter_stock_update_latency_seconds{device_id, symbol}

// Symbol-based backend performance identification
tickrmeter_stock_update_slowest_symbol_seconds{symbol}  // Slowest symbol globally
tickrmeter_stock_update_timeout_total{symbol}          // Timeouts per symbol
tickrmeter_stock_update_avg_latency_seconds{symbol}    // Average latency per symbol
tickrmeter_stock_update_p95_latency_seconds{symbol}    // 95th percentile per symbol
tickrmeter_symbol_response_rate{symbol}                // Success rate per symbol
tickrmeter_symbol_avg_response_time{symbol}           // Average response time
tickrmeter_slowest_symbols_ranking{symbol, rank}      // Top 10 slowest symbols
```

### Firmware Distribution Metrics
```go
tickrmeter_devices_by_firmware_total{firmware_version, iv}
tickrmeter_devices_by_charging_state_total{charging_state}
tickrmeter_devices_by_flash_id_total{flash_id}
```

## MQTT Message Types

Based on analysis of mqtt.cpp and mqttlogs.log:

1. **STOCKPRICEUPDATE** - Stock update requests from devices
   ```json
   {"type":"UPDATE","device":"08A6F792DD5C","symbol":"AAPL"}
   ```

2. **Device responses (by deviceID)** - Stock data responses to devices
   ```json
   {"symbol":"BTC","price":"$118593","type":"UPDATE",...}
   ```

3. **DEVICESTATUS_RES** - Device heartbeat/status messages
   ```json
   {"status":"online","firmware_version":"62p","device":"EC6260314DD0","battery":"78",...}
   ```

4. **TICKRMETERBOOT** - Device boot notifications
   ```json
   {"type":"BOOT","device":"4022D8E2FB0C"}
   ```

5. **DEVICE_BOOTED** - Device ready notifications
   ```json
   {"type":"BOOT","device":"4022D8E2FB0C"}
   ```

6. **HTTPSTREAMSTOCKS** - HTTP stream requests for stock data
   ```json
   {"device":"4022D8ECC94C","params":{...}}
   ```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [x] Project structure setup
- [ ] MQTT client with automatic reconnection
- [ ] Basic device state management
- [ ] Prometheus metrics exporter
- [ ] Configuration management
- [ ] Basic logging

### Phase 2: Stock Performance Tracking (Week 2)  
- [ ] Request/response correlation system
- [ ] Symbol-based latency tracking
- [ ] Timeout detection and counting
- [ ] Percentile calculations (P95, P99)
- [ ] Slowest symbol identification

### Phase 3: Advanced Analytics (Week 3)
- [ ] Historical trending
- [ ] Backend performance ranking
- [ ] Anomaly detection for symbols
- [ ] Dashboard optimization
- [ ] Performance tuning

## Data Structures

```go
type StockUpdateTracker struct {
    DeviceID    string
    Symbol      string
    RequestTime time.Time
    Timeout     time.Duration
}

type SymbolStats struct {
    TotalRequests   int64
    TotalResponses  int64
    TotalLatency    time.Duration
    MaxLatency      time.Duration
    Timeouts        int64
    LastUpdate      time.Time
    LatencyBuckets  []time.Duration // For percentile calculation
}

type DeviceState struct {
    DeviceID        string
    FirmwareVersion string
    InnerVersion    string
    FlashID         string
    Battery         int
    IsCharging      bool
    VinLevel        int
    Uptime          int
    WifiLostCount   int
    LastSeen        time.Time
    BootCount       int
}

type RequestTracker struct {
    mu       sync.RWMutex
    requests map[string]*StockUpdateTracker  // key: deviceID+symbol
    timeout  time.Duration
}

type SymbolPerformanceTracker struct {
    mu    sync.RWMutex
    stats map[string]*SymbolStats
}
```

## Configuration

```yaml
mqtt:
  broker: "tcp://your-broker:1883"
  username: "username"
  password: "password"
  client_id: "mqtt2prometheus"
  
monitoring:
  request_timeout: 30s
  device_timeout: 300s
  cleanup_interval: 60s
  max_latency_samples: 1000
  
prometheus:
  port: 9090
  path: "/metrics"
  
performance:
  buffer_size: 1000
  workers: 10
```

## Performance Optimizations

### Memory Management
- Periodic cleanup of old requests (every 60s)
- Limit latency bucket size to prevent memory bloat (max 1000 samples)
- Efficient map operations with read/write mutexes

### Concurrent Processing
- Separate goroutines for different concerns:
  - MQTT message processing
  - Device state management
  - Symbol statistics calculation
  - Prometheus metric serving
  - Periodic cleanup

### Expected Performance
- **Memory Usage**: ~100-200MB for 8000 devices
- **CPU Usage**: ~5-10% on modern hardware
- **Throughput**: Easily handles 1000+ messages/sec
- **Latency**: Sub-millisecond metric updates

## Expected Grafana Dashboards

### Backend Performance Dashboard
1. **Slowest Symbols** - Bar chart showing top 10 slowest symbols by average response time
2. **Symbol Timeout Rate** - Heat map of timeout rates per symbol  
3. **Symbol Response Time Distribution** - Histogram of response times per symbol
4. **Backend Performance Over Time** - Time series showing symbol performance trends

### Device Health Dashboard
1. **Online Device Count** - Time series by firmware version
2. **Battery Distribution** - Histogram of battery levels
3. **Charging Status** - Pie chart of charging vs non-charging devices
4. **Firmware Distribution** - Pie chart of firmware versions
5. **Device Uptime** - Histogram of device uptimes
6. **WiFi Connectivity Issues** - Devices with high wifi lost count

## Deployment

### Build and Run
```bash
# Build single binary
go build -o tkmprom ./cmd/tkmprom

# Run with config
./tkmprom -config config.yaml

# Docker deployment
docker build -t tkmprom .
docker run -p 9090:9090 -v ./config.yaml:/config.yaml tkmprom
```

### Systemd Service
```ini
[Unit]
Description=TickrMeter MQTT to Prometheus Exporter
After=network.target

[Service]
Type=simple
User=tkmprom
ExecStart=/usr/local/bin/tkmprom -config /etc/tkmprom/config.yaml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Monitoring Focus

### Primary Objectives
1. **Identify slow backends** by tracking symbol-specific response times
2. **Monitor device health** across firmware versions and hardware variants
3. **Track system performance** under load
4. **Detect anomalies** in stock update patterns

### Key Success Metrics
- Symbol-level latency percentiles (P95, P99)
- Backend timeout rates by symbol
- Device distribution across firmware versions
- System throughput and capacity utilization

## Next Steps

1. Set up Go project structure in `tkmprom/`
2. Implement core MQTT client and device state tracking
3. Add stock request/response correlation
4. Implement Prometheus metrics export
5. Create Grafana dashboard templates
6. Performance testing and optimization

## Files Structure
```
tkmprom/
├── README.md                 # This file
├── IMPLEMENTATION.md          # Detailed implementation guide
├── cmd/
│   └── tkmprom/
│       └── main.go           # Application entry point
├── internal/
│   ├── config/               # Configuration management
│   ├── mqtt/                 # MQTT client and message handling
│   ├── metrics/              # Prometheus metrics
│   ├── tracker/              # Request/response correlation
│   └── device/               # Device state management
├── configs/
│   └── config.yaml           # Sample configuration
├── docker/
│   └── Dockerfile           # Container build
└── docs/
    └── grafana/             # Dashboard templates
```
