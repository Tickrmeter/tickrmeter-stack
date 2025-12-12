# TickrMeter MQTT to Prometheus Exporter - Project Handover

## Project Status
✅ **COMPLETE**: Project structure and documentation  
⏳ **NEXT**: Implementation of core components

## Quick Start (Next Session)

1. **Navigate to project directory:**
   ```bash
   cd tkmprom
   ```

2. **Initialize Go module and dependencies:**
   ```bash
   go mod init github.com/tickrmeter/tkmprom
   go get github.com/eclipse/paho.mqtt.golang
   go get github.com/prometheus/client_golang/prometheus
   go get github.com/prometheus/client_golang/prometheus/promhttp
   go get gopkg.in/yaml.v3
   go get github.com/sirupsen/logrus
   ```

3. **Start with implementing missing internal packages:**
   - `internal/device/` - Device state management
   - `internal/metrics/` - Prometheus metrics definitions
   - `internal/mqtt/` - MQTT message processing  
   - `internal/tracker/` - Request/response correlation

## Current Project Structure
```
tkmprom/
├── README.md                 # Complete project overview
├── IMPLEMENTATION.md          # Detailed implementation guide
├── HANDOVER.md               # This file
├── config.yaml               # Sample configuration
├── go.mod                    # Go module definition
├── cmd/
│   └── tkmprom/
│       └── main.go           # Application entry point (COMPLETE)
└── internal/
    └── config/
        └── config.go         # Configuration management (COMPLETE)
```

## Key Implementation Insights

### 1. Request/Response Correlation Strategy
The critical insight is correlating MQTT messages:
- **Request**: `STOCKPRICEUPDATE` topic with `{"device":"XXX","symbol":"YYY"}`
- **Response**: `XXX` topic (device-specific) with symbol data

### 2. Symbol Performance Focus
Primary goal is identifying slow backends by tracking:
- Average latency per symbol
- Timeout rates per symbol  
- P95/P99 latency percentiles
- Slowest symbols ranking

### 3. Scale Requirements
- 1000 messages/second
- 8000 concurrent devices
- Sub-second metric updates
- <200MB memory usage

## Next Implementation Priority

1. **Phase 1** (Critical Path):
   ```
   internal/device/manager.go     - Device state tracking
   internal/metrics/exporter.go   - Prometheus metrics
   internal/tracker/requests.go   - Request correlation
   internal/mqtt/processor.go     - MQTT message handling
   ```

2. **Phase 2** (Enhancement):
   ```
   Symbol ranking algorithms
   Advanced percentile calculations
   Performance optimizations
   ```

## Critical Design Decisions Made

### Memory Management
- Limited latency samples per symbol (1000 max)
- Periodic cleanup of stale devices (5 min timeout)
- Request timeout handling (30s default)

### Concurrency Model
- Separate goroutines for each major component
- Channel-based communication between components
- Read/Write mutexes for shared state

### Metrics Strategy
- Histogram buckets: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0] seconds
- Labels: device_id, symbol, firmware_version, etc.
- Focus on symbol-level aggregations for backend identification

## Testing Strategy
- Unit tests for core correlation logic
- Integration tests with mock MQTT broker
- Load testing to validate 1000 msg/sec performance

## Configuration Ready
- MQTT broker settings
- Monitoring timeouts and intervals
- Prometheus metrics server config
- Performance tuning parameters

## Key Files for Reference
- `README.md` - Complete project overview and metrics definitions
- `IMPLEMENTATION.md` - Detailed code examples and strategies  
- `config.yaml` - Production-ready configuration template
- `cmd/tkmprom/main.go` - Application bootstrap (ready to run)

## Deployment Notes
- Single Go binary deployment
- Systemd service ready
- Docker containerization planned
- No external dependencies beyond MQTT broker

---

**NEXT SESSION**: Start with implementing `internal/device/manager.go` and `internal/metrics/exporter.go` to get basic device tracking working, then add MQTT message processing.
