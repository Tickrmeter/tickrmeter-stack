package device

import (
	"context"
	"encoding/json"
	"strconv"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/sirupsen/logrus"
)

// DeviceState represents the state of a TickrMeter device
// FlexibleInt can unmarshal both string and integer JSON values
type FlexibleInt int

func (f *FlexibleInt) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as integer first
	var i int
	if err := json.Unmarshal(data, &i); err == nil {
		*f = FlexibleInt(i)
		return nil
	}
	
	// If that fails, try as string
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	
	// Convert string to int
	if s == "" {
		*f = 0
		return nil
	}
	
	i, err := strconv.Atoi(s)
	if err != nil {
		return err
	}
	
	*f = FlexibleInt(i)
	return nil
}

type DeviceState struct {
	DeviceID        string      `json:"device"`
	FirmwareVersion string      `json:"firmware_version"`
	InnerVersion    string      `json:"iv"`
	FlashID         string      `json:"flashID"`
	Battery         FlexibleInt `json:"battery"`
	VinLevel        FlexibleInt `json:"vin"`
	Uptime          FlexibleInt `json:"uptime"`
	IsCharging      FlexibleInt `json:"isCharging"` // Changed from bool to int since it comes as "0"/"1"
	WifiLostCount   FlexibleInt `json:"wflct"`
	XMC             FlexibleInt `json:"xmc"`
	LastSeen        time.Time
	Status          string      `json:"status"`
}

// Manager handles device state tracking and cleanup
type Manager struct {
	mu            sync.RWMutex
	devices       map[string]*DeviceState
	deviceTimeout time.Duration

	// Prometheus metrics - ONLY aggregated metrics
	devicesOnline      *prometheus.GaugeVec
	firmwareDistrib    *prometheus.GaugeVec
	chargingDistrib    *prometheus.GaugeVec
	flashIDDistrib     *prometheus.GaugeVec
	
	// Histograms for device distributions instead of individual metrics
	batteryHistogram   *prometheus.HistogramVec
	uptimeHistogram    *prometheus.HistogramVec
}

// NewManager creates a new device manager
func NewManager(deviceTimeout time.Duration) *Manager {
	return &Manager{
		devices:       make(map[string]*DeviceState),
		deviceTimeout: deviceTimeout,

		// Only aggregate metrics - NO individual device metrics
		devicesOnline: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_devices_online_total",
			Help: "Total number of online devices by firmware and flash ID",
		}, []string{"firmware_version", "iv", "flash_id"}),

		// Remove individual device metrics to reduce cardinality
		// deviceBattery: REMOVED - use histogram instead
		// deviceUptime: REMOVED - use histogram instead
		// deviceWifiLost: REMOVED - use histogram instead
		// deviceVinLevel: REMOVED - use histogram instead
		// deviceLastSeen: REMOVED - not needed for monitoring

		firmwareDistrib: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_devices_by_firmware_total",
			Help: "Number of devices by firmware version",
		}, []string{"firmware_version", "iv"}),

		chargingDistrib: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_devices_by_charging_state_total",
			Help: "Number of devices by charging state",
		}, []string{"charging_state"}),

		flashIDDistrib: promauto.NewGaugeVec(prometheus.GaugeOpts{
			Name: "tickrmeter_devices_by_flash_id_total",
			Help: "Number of devices by flash ID",
		}, []string{"flash_id"}),

		// Add aggregate histograms instead of per-device metrics
		batteryHistogram: promauto.NewHistogramVec(prometheus.HistogramOpts{
			Name: "tickrmeter_device_battery_level_distribution",
			Help: "Distribution of battery levels across devices",
			Buckets: []float64{0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100},
		}, []string{"firmware_version"}),

		uptimeHistogram: promauto.NewHistogramVec(prometheus.HistogramOpts{
			Name: "tickrmeter_device_uptime_distribution_seconds",
			Help: "Distribution of device uptimes",
			Buckets: prometheus.ExponentialBuckets(3600, 2, 10), // 1h to ~1000h
		}, []string{"firmware_version"}),
	}
}

// UpdateDevice updates device state from DEVICESTATUS_RES message
func (m *Manager) UpdateDevice(payload []byte) error {
	var device DeviceState
	if err := json.Unmarshal(payload, &device); err != nil {
		return err
	}

	device.LastSeen = time.Now()

	m.mu.Lock()
	m.devices[device.DeviceID] = &device
	m.mu.Unlock()

	// Update metrics
	m.updateMetrics(&device)

	logrus.WithFields(logrus.Fields{
		"device_id": device.DeviceID,
		"firmware":  device.FirmwareVersion,
		"battery":   int(device.Battery),
		"uptime":    int(device.Uptime),
	}).Debug("Updated device state")

	return nil
}

// UpdateDeviceBoot handles TICKRMETERBOOT and DEVICE_BOOTED messages
func (m *Manager) UpdateDeviceBoot(payload []byte) error {
	var bootMsg struct {
		Type     string `json:"type"`
		DeviceID string `json:"device"`
	}

	if err := json.Unmarshal(payload, &bootMsg); err != nil {
		return err
	}

	m.mu.Lock()
	if device, exists := m.devices[bootMsg.DeviceID]; exists {
		device.LastSeen = time.Now()
	} else {
		// Create minimal device state for boot messages
		m.devices[bootMsg.DeviceID] = &DeviceState{
			DeviceID: bootMsg.DeviceID,
			LastSeen: time.Now(),
			Status:   "booted",
		}
	}
	m.mu.Unlock()

	logrus.WithFields(logrus.Fields{
		"device_id": bootMsg.DeviceID,
		"type":      bootMsg.Type,
	}).Info("Device boot detected")

	return nil
}

// GetDevice returns device state
func (m *Manager) GetDevice(deviceID string) (*DeviceState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	device, exists := m.devices[deviceID]
	return device, exists
}

// GetActiveDevices returns all active devices
func (m *Manager) GetActiveDevices() map[string]*DeviceState {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make(map[string]*DeviceState)
	cutoff := time.Now().Add(-m.deviceTimeout)

	for id, device := range m.devices {
		if device.LastSeen.After(cutoff) {
			result[id] = device
		}
	}

	return result
}

// Start begins the device manager background tasks
func (m *Manager) Start(ctx context.Context, cleanupInterval time.Duration) error {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			m.cleanup()
			m.updateDistributionMetrics()
		}
	}
}

// cleanup removes stale devices
func (m *Manager) cleanup() {
	cutoff := time.Now().Add(-m.deviceTimeout)
	
	m.mu.Lock()
	removed := 0
	for id, device := range m.devices {
		if device.LastSeen.Before(cutoff) {
			delete(m.devices, id)
			removed++
			
			// No individual metrics to clean up anymore - they're aggregated
		}
	}
	m.mu.Unlock()

	if removed > 0 {
		logrus.WithField("removed_devices", removed).Info("Cleaned up stale devices")
	}
}

// updateMetrics updates device-specific metrics using histograms
func (m *Manager) updateMetrics(device *DeviceState) {
	// Record battery level in histogram (aggregated by firmware)
	m.batteryHistogram.WithLabelValues(device.FirmwareVersion).Observe(float64(device.Battery))
	
	// Record uptime in histogram (aggregated by firmware)
	m.uptimeHistogram.WithLabelValues(device.FirmwareVersion).Observe(float64(device.Uptime))
	
	// Individual device metrics removed to reduce cardinality
	// All device insights now come from aggregate histograms and distributions
}

// updateDistributionMetrics updates aggregated distribution metrics
func (m *Manager) updateDistributionMetrics() {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Clear previous metrics
	m.devicesOnline.Reset()
	m.firmwareDistrib.Reset()
	m.chargingDistrib.Reset()
	m.flashIDDistrib.Reset()

	// Count by firmware
	firmwareCounts := make(map[string]map[string]int)
	chargingCounts := make(map[string]int)
	flashIDCounts := make(map[string]int)
	onlineCounts := make(map[string]map[string]map[string]int)

	cutoff := time.Now().Add(-m.deviceTimeout)

	for _, device := range m.devices {
		if device.LastSeen.Before(cutoff) {
			continue
		}

		// Firmware distribution
		if firmwareCounts[device.FirmwareVersion] == nil {
			firmwareCounts[device.FirmwareVersion] = make(map[string]int)
		}
		firmwareCounts[device.FirmwareVersion][device.InnerVersion]++

		// Charging distribution
		if device.IsCharging == 1 {
			chargingCounts["charging"]++
		} else {
			chargingCounts["not_charging"]++
		}

		// Flash ID distribution
		flashIDCounts[device.FlashID]++

		// Online devices by firmware, iv, flash_id
		if onlineCounts[device.FirmwareVersion] == nil {
			onlineCounts[device.FirmwareVersion] = make(map[string]map[string]int)
		}
		if onlineCounts[device.FirmwareVersion][device.InnerVersion] == nil {
			onlineCounts[device.FirmwareVersion][device.InnerVersion] = make(map[string]int)
		}
		onlineCounts[device.FirmwareVersion][device.InnerVersion][device.FlashID]++
	}

	// Update metrics
	for fw, ivMap := range firmwareCounts {
		for iv, count := range ivMap {
			m.firmwareDistrib.WithLabelValues(fw, iv).Set(float64(count))
		}
	}

	for state, count := range chargingCounts {
		m.chargingDistrib.WithLabelValues(state).Set(float64(count))
	}

	for flashID, count := range flashIDCounts {
		m.flashIDDistrib.WithLabelValues(flashID).Set(float64(count))
	}

	for fw, ivMap := range onlineCounts {
		for iv, flashMap := range ivMap {
			for flashID, count := range flashMap {
				m.devicesOnline.WithLabelValues(fw, iv, flashID).Set(float64(count))
			}
		}
	}
}
