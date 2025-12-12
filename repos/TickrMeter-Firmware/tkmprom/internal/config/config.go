package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

// Config represents the application configuration
type Config struct {
	MQTT        MQTTConfig        `yaml:"mqtt"`
	Monitoring  MonitoringConfig  `yaml:"monitoring"`
	Prometheus  PrometheusConfig  `yaml:"prometheus"`
	Performance PerformanceConfig `yaml:"performance"`
	Logging     LoggingConfig     `yaml:"logging"`
}

// MQTTConfig contains MQTT broker settings
type MQTTConfig struct {
	Broker             string        `yaml:"broker"`
	Username           string        `yaml:"username"`
	Password           string        `yaml:"password"`
	ClientID           string        `yaml:"client_id"`
	KeepAlive          int           `yaml:"keep_alive"`
	CleanSession       bool          `yaml:"clean_session"`
	AutoReconnect      bool          `yaml:"auto_reconnect"`
	ReconnectDelay     time.Duration `yaml:"reconnect_delay"`
	MaxReconnectDelay  time.Duration `yaml:"max_reconnect_delay"`
	Topics             []string      `yaml:"topics"`
}

// MonitoringConfig contains monitoring settings
type MonitoringConfig struct {
	RequestTimeout         time.Duration `yaml:"request_timeout"`
	DeviceTimeout          time.Duration `yaml:"device_timeout"`
	CleanupInterval        time.Duration `yaml:"cleanup_interval"`
	MaxLatencySamples      int           `yaml:"max_latency_samples"`
	MinRequestsForRanking  int           `yaml:"min_requests_for_ranking"`
}

// PrometheusConfig contains Prometheus metrics server settings
type PrometheusConfig struct {
	Port        int    `yaml:"port"`
	Path        string `yaml:"path"`
	EnablePprof bool   `yaml:"enable_pprof"`
}

// PerformanceConfig contains performance tuning settings
type PerformanceConfig struct {
	BufferSize int `yaml:"buffer_size"`
	Workers    int `yaml:"workers"`
	MaxDevices int `yaml:"max_devices"`
	MaxSymbols int `yaml:"max_symbols"`
}

// LoggingConfig contains logging settings
type LoggingConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
	Output string `yaml:"output"`
}

// Load reads configuration from a YAML file
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Apply defaults
	applyDefaults(&config)

	// Validate configuration
	if err := validate(&config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &config, nil
}

// applyDefaults sets default values for missing configuration
func applyDefaults(config *Config) {
	// MQTT defaults
	if config.MQTT.ClientID == "" {
		config.MQTT.ClientID = "tkmprom"
	}
	if config.MQTT.KeepAlive == 0 {
		config.MQTT.KeepAlive = 60
	}
	if config.MQTT.ReconnectDelay == 0 {
		config.MQTT.ReconnectDelay = 5 * time.Second
	}
	if config.MQTT.MaxReconnectDelay == 0 {
		config.MQTT.MaxReconnectDelay = 300 * time.Second
	}
	if len(config.MQTT.Topics) == 0 {
		config.MQTT.Topics = []string{
			"STOCKPRICEUPDATE",
			"DEVICESTATUS_RES",
			"TICKRMETERBOOT",
			"DEVICE_BOOTED",
			"HTTPSTREAMSTOCKS",
			"+",
		}
	}

	// Monitoring defaults
	if config.Monitoring.RequestTimeout == 0 {
		config.Monitoring.RequestTimeout = 30 * time.Second
	}
	if config.Monitoring.DeviceTimeout == 0 {
		config.Monitoring.DeviceTimeout = 300 * time.Second
	}
	if config.Monitoring.CleanupInterval == 0 {
		config.Monitoring.CleanupInterval = 60 * time.Second
	}
	if config.Monitoring.MaxLatencySamples == 0 {
		config.Monitoring.MaxLatencySamples = 1000
	}
	if config.Monitoring.MinRequestsForRanking == 0 {
		config.Monitoring.MinRequestsForRanking = 10
	}

	// Prometheus defaults
	if config.Prometheus.Port == 0 {
		config.Prometheus.Port = 9090
	}
	if config.Prometheus.Path == "" {
		config.Prometheus.Path = "/metrics"
	}

	// Performance defaults
	if config.Performance.BufferSize == 0 {
		config.Performance.BufferSize = 1000
	}
	if config.Performance.Workers == 0 {
		config.Performance.Workers = 10
	}
	if config.Performance.MaxDevices == 0 {
		config.Performance.MaxDevices = 10000
	}
	if config.Performance.MaxSymbols == 0 {
		config.Performance.MaxSymbols = 5000
	}

	// Logging defaults
	if config.Logging.Level == "" {
		config.Logging.Level = "info"
	}
	if config.Logging.Format == "" {
		config.Logging.Format = "text"
	}
	if config.Logging.Output == "" {
		config.Logging.Output = "stdout"
	}
}

// validate checks if the configuration is valid
func validate(config *Config) error {
	if config.MQTT.Broker == "" {
		return fmt.Errorf("MQTT broker URL is required")
	}

	if config.Prometheus.Port < 1 || config.Prometheus.Port > 65535 {
		return fmt.Errorf("invalid Prometheus port: %d", config.Prometheus.Port)
	}

	if config.Performance.BufferSize < 1 {
		return fmt.Errorf("buffer size must be positive")
	}

	if config.Performance.Workers < 1 {
		return fmt.Errorf("number of workers must be positive")
	}

	if config.Monitoring.RequestTimeout < time.Second {
		return fmt.Errorf("request timeout must be at least 1 second")
	}

	if config.Monitoring.DeviceTimeout < time.Minute {
		return fmt.Errorf("device timeout must be at least 1 minute")
	}

	validLogLevels := map[string]bool{
		"debug": true, "info": true, "warn": true, "error": true,
	}
	if !validLogLevels[config.Logging.Level] {
		return fmt.Errorf("invalid log level: %s", config.Logging.Level)
	}

	validLogFormats := map[string]bool{
		"json": true, "text": true,
	}
	if !validLogFormats[config.Logging.Format] {
		return fmt.Errorf("invalid log format: %s", config.Logging.Format)
	}

	return nil
}
