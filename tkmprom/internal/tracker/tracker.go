package tracker

import (
	"context"
	"encoding/json"
	"sort"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/sirupsen/logrus"
)

// PendingRequest represents a stock update request waiting for response
type PendingRequest struct {
	DeviceID  string
	Symbol    string
	Timestamp time.Time
}

// SymbolStats tracks performance statistics for a symbol
type SymbolStats struct {
	TotalRequests   int64
	TotalResponses  int64
	TotalLatency    time.Duration
	MaxLatency      time.Duration
	Timeouts        int64
	LastUpdate      time.Time
	LatencyBuckets  []time.Duration
}

// RequestTracker correlates stock update requests with responses
type RequestTracker struct {
	mu            sync.RWMutex
	requests      map[string]*PendingRequest // key: deviceID:symbol
	timeout       time.Duration
	timeoutsTotal prometheus.Counter
}

// SymbolTracker tracks symbol-level performance metrics
type SymbolTracker struct {
	mu               sync.RWMutex
	stats            map[string]*SymbolStats
	maxLatencySamples int

	// Prometheus metrics
	requestsTotal     *prometheus.CounterVec
	responsesTotal    *prometheus.CounterVec
	latencyHistogram  *prometheus.HistogramVec
	avgLatency        *prometheus.GaugeVec
	p95Latency        *prometheus.GaugeVec
	responseRate      *prometheus.GaugeVec
	slowestSymbols    *prometheus.GaugeVec
}

// NewRequestTracker creates a new request tracker
func NewRequestTracker(timeout time.Duration) *RequestTracker {
	return &RequestTracker{
		requests: make(map[string]*PendingRequest),
		timeout:  timeout,
		timeoutsTotal: promauto.NewCounter(prometheus.CounterOpts{
			Name: "tickrmeter_stock_update_timeout_total",
			Help: "Total number of stock update request timeouts",
		}),
	}
}

// NewSymbolTracker creates a new symbol tracker
func NewSymbolTracker(maxLatencySamples int) *SymbolTracker {
	return &SymbolTracker{
		stats:             make(map[string]*SymbolStats),
		maxLatencySamples: maxLatencySamples,

		requestsTotal: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "tickrmeter_stock_update_requests_total",
			Help: "Total number of stock update requests",
		}, []string{"symbol"}), // Removed device_id to reduce cardinality

		responsesTotal: promauto.NewCounterVec(prometheus.CounterOpts{
			Name: "tickrmeter_stock_update_responses_total",
			Help: "Total number of stock update responses",
		}, []string{"symbol"}), // Removed device_id to reduce cardinality

		latencyHistogram: promauto.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "tickrmeter_stock_update_latency_seconds",
			Help:    "Stock update response latency (only >2s, rounded to second)",
			Buckets: []float64{2, 5, 10, 30, 60}, // Reduced to only 5 buckets
		}, []string{"symbol"}), // Removed device_id to reduce cardinality

		avgLatency: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_stock_update_avg_latency_seconds",
			Help: "Average latency per symbol",
		}, []string{"symbol"}),

		p95Latency: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_stock_update_p95_latency_seconds",
			Help: "95th percentile latency per symbol",
		}, []string{"symbol"}),

		responseRate: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_symbol_response_rate",
			Help: "Response rate per symbol (responses/requests)",
		}, []string{"symbol"}),

		slowestSymbols: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_slowest_symbols_ranking",
			Help: "Ranking of slowest symbols by average response time",
		}, []string{"symbol", "rank"}),
	}
}



// TrackRequest records a stock update request (overloaded for deviceID only)
func (rt *RequestTracker) TrackRequest(deviceID string) {
    rt.mu.Lock()
    rt.requests[deviceID] = &PendingRequest{
        DeviceID:  deviceID,
        Timestamp: time.Now(),
    }
    rt.mu.Unlock()
    logrus.WithField("device_id", deviceID).Debug("Tracking stock update request")
}

func (rt *RequestTracker) TrackResponse(deviceID string) *time.Duration {
    rt.mu.Lock()
    req, exists := rt.requests[deviceID]
    if exists {
        delete(rt.requests, deviceID)
    }
    rt.mu.Unlock()
    if !exists {
        logrus.WithField("device_id", deviceID).Warn("Received response without corresponding request")
        return nil
    }
    latency := time.Since(req.Timestamp)
    logrus.WithFields(logrus.Fields{
        "device_id": deviceID,
        "latency":   latency,
    }).Debug("Tracked stock update response")
    return &latency
}

// Start begins the request tracker background tasks
func (rt *RequestTracker) Start(ctx context.Context) error {
	ticker := time.NewTicker(rt.timeout / 2) // Check twice per timeout period
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			rt.cleanupTimeouts()
		}
	}
}

// cleanupTimeouts removes timed-out requests
func (rt *RequestTracker) cleanupTimeouts() {
	cutoff := time.Now().Add(-rt.timeout)
	
	rt.mu.Lock()
	timeouts := 0
	for key, req := range rt.requests {
		if req.Timestamp.Before(cutoff) {
			delete(rt.requests, key)
			timeouts++
			
			logrus.WithFields(logrus.Fields{
				"device_id": req.DeviceID,
				"symbol":    req.Symbol,
				"age":       time.Since(req.Timestamp),
			}).Warn("Stock update request timed out")
		}
	}
	rt.mu.Unlock()

	if timeouts > 0 {
		rt.timeoutsTotal.Add(float64(timeouts))
		logrus.WithField("timeout_count", timeouts).Info("Recorded timeout metrics")
	}
}

// RecordRequest increments request counter for symbol tracking
func (st *SymbolTracker) RecordRequest(deviceID, symbol string) {
	st.requestsTotal.WithLabelValues(symbol).Inc() // Only by symbol
	
	st.mu.Lock()
	if st.stats[symbol] == nil {
		st.stats[symbol] = &SymbolStats{
			LatencyBuckets: make([]time.Duration, 0, st.maxLatencySamples),
		}
	}
	st.stats[symbol].TotalRequests++
	st.mu.Unlock()
}

// RecordResponse records a successful response and latency
func (st *SymbolTracker) RecordResponse(deviceID, symbol string, latency time.Duration) {
	st.responsesTotal.WithLabelValues(symbol).Inc() // Only by symbol
	
	// Only record latency histogram for >2s responses to reduce cardinality
	if latency > 2*time.Second {
		// Round to nearest second
		roundedLatency := float64(int(latency.Seconds() + 0.5))
		st.latencyHistogram.WithLabelValues(symbol).Observe(roundedLatency)
	}
	
	st.mu.Lock()
	if st.stats[symbol] == nil {
		st.stats[symbol] = &SymbolStats{
			LatencyBuckets: make([]time.Duration, 0, st.maxLatencySamples),
		}
	}
	
	stats := st.stats[symbol]
	stats.TotalResponses++
	stats.TotalLatency += latency
	stats.LastUpdate = time.Now()
	
	if latency > stats.MaxLatency {
		stats.MaxLatency = latency
	}
	
	// Add to latency buckets (for percentile calculation)
	stats.LatencyBuckets = append(stats.LatencyBuckets, latency)
	
	// Keep only the most recent samples
	if len(stats.LatencyBuckets) > st.maxLatencySamples {
		// Remove oldest 10% when we exceed limit
		removeCount := st.maxLatencySamples / 10
		if removeCount < 1 {
			removeCount = 1
		}
		stats.LatencyBuckets = stats.LatencyBuckets[removeCount:]
	}
	
	st.mu.Unlock()

	logrus.WithFields(logrus.Fields{
		"device_id": deviceID,
		"symbol":    symbol,
		"latency":   latency,
	}).Debug("Recorded stock update response")
}

// Start begins the symbol tracker background tasks
func (st *SymbolTracker) Start(ctx context.Context, updateInterval time.Duration) error {
	ticker := time.NewTicker(updateInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			st.updateAggregateMetrics()
		}
	}
}

// updateAggregateMetrics updates symbol-level aggregate metrics
func (st *SymbolTracker) updateAggregateMetrics() {
	st.mu.RLock()
	defer st.mu.RUnlock()

	type symbolMetric struct {
		symbol     string
		avgLatency float64
	}

	var slowestSymbols []symbolMetric

	for symbol, stats := range st.stats {
		if stats.TotalResponses == 0 {
			continue
		}

		// Calculate average latency
		avgLatency := stats.TotalLatency.Seconds() / float64(stats.TotalResponses)
		st.avgLatency.WithLabelValues(symbol).Set(avgLatency)

		// Calculate response rate
		responseRate := float64(stats.TotalResponses) / float64(stats.TotalRequests)
		st.responseRate.WithLabelValues(symbol).Set(responseRate)

		// Calculate P95 latency
		if len(stats.LatencyBuckets) > 0 {
			buckets := make([]time.Duration, len(stats.LatencyBuckets))
			copy(buckets, stats.LatencyBuckets)
			sort.Slice(buckets, func(i, j int) bool {
				return buckets[i] < buckets[j]
			})
			
			p95Index := int(float64(len(buckets)) * 0.95)
			if p95Index >= len(buckets) {
				p95Index = len(buckets) - 1
			}
			st.p95Latency.WithLabelValues(symbol).Set(buckets[p95Index].Seconds())
		}

		// Collect for slowest symbols ranking
		slowestSymbols = append(slowestSymbols, symbolMetric{
			symbol:     symbol,
			avgLatency: avgLatency,
		})
	}

	// Update slowest symbols ranking (top 10)
	sort.Slice(slowestSymbols, func(i, j int) bool {
		return slowestSymbols[i].avgLatency > slowestSymbols[j].avgLatency
	})

	// Clear previous rankings
	st.slowestSymbols.Reset()

	// Set top 10 slowest symbols
	for i, sym := range slowestSymbols {
		if i >= 10 {
			break
		}
		rank := i + 1
		st.slowestSymbols.WithLabelValues(sym.symbol, string(rune(rank+'0'))).Set(sym.avgLatency)
	}
}

// GetSymbolStats returns current symbol statistics
func (st *SymbolTracker) GetSymbolStats() map[string]*SymbolStats {
	st.mu.RLock()
	defer st.mu.RUnlock()

	result := make(map[string]*SymbolStats)
	for symbol, stats := range st.stats {
		// Create a copy to avoid race conditions
		statsCopy := *stats
		result[symbol] = &statsCopy
	}

	return result
}

func HandleStockRequest(payload []byte, deviceID string, requestTracker *RequestTracker, symbolTracker *SymbolTracker) error {
    var request struct {
        Type     string `json:"type"`
        DeviceID string `json:"device"`
    }
    if err := json.Unmarshal(payload, &request); err != nil {
        return err
    }
    if request.DeviceID == "" {
        request.DeviceID = deviceID
    }
    requestTracker.TrackRequest(request.DeviceID)
    symbolTracker.RecordRequest(request.DeviceID, "request")
    logrus.WithFields(logrus.Fields{
        "device_id": request.DeviceID,
        "type":      request.Type,
    }).Debug("Processed stock update request")
    return nil
}
func HandleStockResponse(payload []byte, deviceID string, requestTracker *RequestTracker, symbolTracker *SymbolTracker) error {
    var response struct {
        Symbol string `json:"symbol"`
    }
    if err := json.Unmarshal(payload, &response); err != nil {
        return err
    }
    if latency := requestTracker.TrackResponse(deviceID); latency != nil {
        symbolTracker.RecordResponse(deviceID, response.Symbol, *latency)
    } else {
        symbolTracker.RecordResponse(deviceID, response.Symbol, 0)
    }
    logrus.WithFields(logrus.Fields{
        "device_id": deviceID,
        "symbol":    response.Symbol,
    }).Debug("Processed stock update response")
    return nil
}