# Implementation Guide - TickrMeter MQTT to Prometheus Exporter

## Project Setup

### 1. Initialize Go Module
```bash
cd tkmprom
go mod init github.com/tickrmeter/tkmprom
```

### 2. Required Dependencies
```bash
# MQTT client
go get github.com/eclipse/paho.mqtt.golang

# Prometheus client
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp

# Configuration
go get gopkg.in/yaml.v3

# Logging
go get github.com/sirupsen/logrus

# Testing
go get github.com/stretchr/testify
```

## Core Implementation Details

### 1. MQTT Message Processing

#### Request/Response Correlation Strategy
```go
// Key insight: Correlate STOCKPRICEUPDATE requests with device-specific responses
// Example correlation:
// Request:  Topic="STOCKPRICEUPDATE" Payload={"type":"UPDATE","device":"142B2FEB7A10","symbol":"AAPL"}
// Response: Topic="142B2FEB7A10" Payload={"symbol":"AAPL","price":"$229.97",...}

type RequestCorrelator struct {
    mu           sync.RWMutex
    pendingReqs  map[string]*PendingRequest  // key: deviceID:symbol
    timeoutDur   time.Duration
}

type PendingRequest struct {
    DeviceID    string
    Symbol      string
    Timestamp   time.Time
    Timer       *time.Timer  // For automatic cleanup
}
```

#### MQTT Topic Subscription Strategy
```go
topics := []string{
    "STOCKPRICEUPDATE",     // Stock update requests
    "DEVICESTATUS_RES",     // Device heartbeats
    "TICKRMETERBOOT",       // Device boot events
    "DEVICE_BOOTED",        // Device ready events
    "HTTPSTREAMSTOCKS",     // HTTP stream requests
    "+",                    // All device-specific topics (responses)
}
```

### 2. Symbol Performance Calculation

#### Latency Percentile Calculation
```go
type LatencyCalculator struct {
    samples []time.Duration
    sorted  bool
    maxSize int
}

func (lc *LatencyCalculator) AddSample(latency time.Duration) {
    if len(lc.samples) >= lc.maxSize {
        // Remove oldest 10% to prevent memory bloat
        removeCount := lc.maxSize / 10
        lc.samples = lc.samples[removeCount:]
    }
    lc.samples = append(lc.samples, latency)
    lc.sorted = false
}

func (lc *LatencyCalculator) P95() time.Duration {
    if !lc.sorted {
        sort.Slice(lc.samples, func(i, j int) bool {
            return lc.samples[i] < lc.samples[j]
        })
        lc.sorted = true
    }
    
    if len(lc.samples) == 0 {
        return 0
    }
    
    index := int(float64(len(lc.samples)) * 0.95)
    if index >= len(lc.samples) {
        index = len(lc.samples) - 1
    }
    
    return lc.samples[index]
}
```

### 3. Prometheus Metrics Definition

```go
var (
    // Device metrics
    devicesOnline = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "tickrmeter_devices_online_total",
            Help: "Number of online TickrMeter devices",
        },
        []string{"firmware_version", "inner_version", "flash_id"},
    )

    deviceBattery = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "tickrmeter_device_battery_level",
            Help: "Battery level of TickrMeter device (0-100)",
        },
        []string{"device_id", "firmware_version"},
    )

    // Stock performance metrics
    stockUpdateRequests = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "tickrmeter_stock_update_requests_total",
            Help: "Total number of stock update requests",
        },
        []string{"device_id", "symbol"},
    )

    stockUpdateLatency = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "tickrmeter_stock_update_latency_seconds",
            Help:    "Stock update latency in seconds",
            Buckets: []float64{0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0},
        },
        []string{"device_id", "symbol"},
    )

    symbolAvgLatency = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "tickrmeter_symbol_avg_latency_seconds",
            Help: "Average response time per symbol",
        },
        []string{"symbol"},
    )

    symbolTimeouts = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "tickrmeter_symbol_timeout_total",
            Help: "Total timeouts per symbol",
        },
        []string{"symbol"},
    )
)
```

### 4. Concurrent Processing Architecture

```go
func main() {
    // Start background goroutines
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // MQTT message processing
    go mqttProcessor.Start(ctx)

    // Device state management
    go deviceManager.Start(ctx)

    // Symbol statistics calculation
    go symbolTracker.Start(ctx)

    // Periodic cleanup
    go cleanupManager.Start(ctx)

    // Prometheus HTTP server
    go prometheusServer.Start(ctx)

    // Wait for shutdown signal
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
    <-sigChan

    log.Info("Shutting down...")
    cancel()
    time.Sleep(2 * time.Second) // Grace period
}
```

## Critical Implementation Notes

### 1. Request Timeout Handling
```go
func (rt *RequestTracker) TrackRequest(deviceID, symbol string) {
    key := deviceID + ":" + symbol
    
    rt.mu.Lock()
    defer rt.mu.Unlock()
    
    // Cancel previous timer if exists
    if existing, ok := rt.requests[key]; ok {
        existing.Timer.Stop()
    }
    
    // Create new request with timeout timer
    req := &PendingRequest{
        DeviceID:  deviceID,
        Symbol:    symbol,
        Timestamp: time.Now(),
    }
    
    // Auto-cleanup on timeout
    req.Timer = time.AfterFunc(rt.timeoutDur, func() {
        rt.handleTimeout(key, req)
    })
    
    rt.requests[key] = req
}

func (rt *RequestTracker) handleTimeout(key string, req *PendingRequest) {
    rt.mu.Lock()
    defer rt.mu.Unlock()
    
    // Check if request still exists (might have been completed)
    if current, exists := rt.requests[key]; exists && current == req {
        delete(rt.requests, key)
        
        // Record timeout metric
        symbolTimeouts.WithLabelValues(req.Symbol).Inc()
        
        log.WithFields(logrus.Fields{
            "device": req.DeviceID,
            "symbol": req.Symbol,
            "duration": time.Since(req.Timestamp),
        }).Warn("Stock update request timed out")
    }
}
```

### 2. Symbol Performance Ranking
```go
type SymbolRanking struct {
    Symbol      string
    AvgLatency  time.Duration
    TimeoutRate float64
    RequestCount int64
}

func (st *SymbolTracker) GetSlowestSymbols(limit int) []SymbolRanking {
    st.mu.RLock()
    defer st.mu.RUnlock()
    
    var rankings []SymbolRanking
    
    for symbol, stats := range st.symbolStats {
        if stats.TotalRequests < 10 { // Skip symbols with too few requests
            continue
        }
        
        avgLatency := time.Duration(0)
        if stats.TotalResponses > 0 {
            avgLatency = time.Duration(stats.TotalLatency.Nanoseconds() / stats.TotalResponses)
        }
        
        timeoutRate := float64(stats.Timeouts) / float64(stats.TotalRequests)
        
        rankings = append(rankings, SymbolRanking{
            Symbol:       symbol,
            AvgLatency:   avgLatency,
            TimeoutRate:  timeoutRate,
            RequestCount: stats.TotalRequests,
        })
    }
    
    // Sort by combined score (latency + timeout rate)
    sort.Slice(rankings, func(i, j int) bool {
        scoreI := rankings[i].AvgLatency.Seconds() + rankings[i].TimeoutRate*10
        scoreJ := rankings[j].AvgLatency.Seconds() + rankings[j].TimeoutRate*10
        return scoreI > scoreJ
    })
    
    if len(rankings) > limit {
        rankings = rankings[:limit]
    }
    
    return rankings
}
```

### 3. Memory Optimization Strategies

#### Device State Cleanup
```go
func (dm *DeviceManager) cleanupStaleDevices() {
    dm.mu.Lock()
    defer dm.mu.Unlock()
    
    cutoff := time.Now().Add(-dm.deviceTimeout)
    
    for deviceID, state := range dm.devices {
        if state.LastSeen.Before(cutoff) {
            log.WithField("device", deviceID).Debug("Removing stale device")
            delete(dm.devices, deviceID)
            
            // Update metrics
            devicesOnline.WithLabelValues(
                state.FirmwareVersion,
                state.InnerVersion,
                state.FlashID,
            ).Dec()
        }
    }
}
```

#### Symbol Statistics Pruning
```go
func (st *SymbolTracker) pruneOldSymbols() {
    st.mu.Lock()
    defer st.mu.Unlock()
    
    cutoff := time.Now().Add(-24 * time.Hour) // Keep 24h of data
    
    for symbol, stats := range st.symbolStats {
        if stats.LastUpdate.Before(cutoff) && stats.TotalRequests < 100 {
            // Remove symbols that haven't been updated recently and have low activity
            delete(st.symbolStats, symbol)
            log.WithField("symbol", symbol).Debug("Pruned old symbol stats")
        }
    }
}
```

## Testing Strategy

### 1. Unit Tests
```go
func TestRequestCorrelation(t *testing.T) {
    tracker := NewRequestTracker(30 * time.Second)
    
    // Track request
    tracker.TrackRequest("device123", "AAPL")
    
    // Simulate response
    latency := tracker.CompleteRequest("device123", "AAPL")
    
    assert.True(t, latency > 0)
    assert.True(t, latency < 100*time.Millisecond) // Should be very fast in test
}
```

### 2. Integration Tests
```go
func TestMQTTProcessing(t *testing.T) {
    // Set up test MQTT broker
    // Send test messages
    // Verify metrics are updated correctly
}
```

### 3. Load Testing
```bash
# Simulate 1000 msg/sec for 8000 devices
go run cmd/loadtest/main.go -rate 1000 -devices 8000 -duration 60s
```

## Monitoring and Alerting

### Prometheus Rules
```yaml
groups:
- name: tickrmeter_alerts
  rules:
  - alert: HighSymbolLatency
    expr: tickrmeter_symbol_avg_latency_seconds > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected for symbol {{ $labels.symbol }}"
      
  - alert: HighTimeoutRate
    expr: rate(tickrmeter_symbol_timeout_total[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High timeout rate for symbol {{ $labels.symbol }}"
```

### Grafana Dashboard Queries
```promql
# Top 10 slowest symbols
topk(10, tickrmeter_symbol_avg_latency_seconds)

# Device distribution by firmware
sum by (firmware_version) (tickrmeter_devices_online_total)

# Request rate by symbol
rate(tickrmeter_stock_update_requests_total[5m])

# Latency percentiles
histogram_quantile(0.95, rate(tickrmeter_stock_update_latency_seconds_bucket[5m]))
```

## Deployment Checklist

- [ ] Go environment setup
- [ ] MQTT broker configuration
- [ ] Prometheus server setup
- [ ] Grafana dashboard import
- [ ] Systemd service configuration
- [ ] Log rotation setup
- [ ] Monitoring alerts configuration
- [ ] Load testing validation
- [ ] Documentation review

## Performance Benchmarks

Target performance on standard hardware (4 CPU, 8GB RAM):
- **Message Processing**: 2000+ msg/sec
- **Memory Usage**: <200MB for 8000 devices
- **CPU Usage**: <10% average
- **Response Time**: <1ms for metric queries
- **Storage**: All in-memory, no persistence required
