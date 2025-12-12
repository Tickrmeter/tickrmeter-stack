package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/tickrmeter/tkmprom/internal/config"
	"github.com/tickrmeter/tkmprom/internal/device"
	"github.com/tickrmeter/tkmprom/internal/metrics"
	"github.com/tickrmeter/tkmprom/internal/mqtt"
	"github.com/tickrmeter/tkmprom/internal/tracker"
)

var (
	configPath = flag.String("config", "config.yaml", "Path to configuration file")
	version    = "dev" // Set by build process
)

func main() {
	flag.Parse()

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load configuration")
	}

	// Configure logging
	setupLogging(cfg.Logging)

	logrus.WithFields(logrus.Fields{
		"version": version,
		"config":  *configPath,
	}).Info("Starting TickrMeter MQTT to Prometheus Exporter")

	// Create application context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize components
	deviceManager := device.NewManager(cfg.Monitoring.DeviceTimeout)
	symbolTracker := tracker.NewSymbolTracker(cfg.Monitoring.MaxLatencySamples)
	requestTracker := tracker.NewRequestTracker(cfg.Monitoring.RequestTimeout)
	metricsExporter := metrics.NewExporter(cfg.Prometheus)

	// Initialize MQTT processor
	mqttProcessor := mqtt.NewProcessor(mqtt.ProcessorConfig{
		BrokerURL:      cfg.MQTT.Broker,
		Username:       cfg.MQTT.Username,
		Password:       cfg.MQTT.Password,
		ClientID:       cfg.MQTT.ClientID,
		Topics:         cfg.MQTT.Topics,
		BufferSize:     cfg.Performance.BufferSize,
		Workers:        cfg.Performance.Workers,
		DeviceManager:  deviceManager,
		SymbolTracker:  symbolTracker,
		RequestTracker: requestTracker,
	})

	// Start background services
	errChan := make(chan error, 10)

	// Start device manager
	go func() {
		if err := deviceManager.Start(ctx, cfg.Monitoring.CleanupInterval); err != nil {
			errChan <- fmt.Errorf("device manager error: %w", err)
		}
	}()

	// Start symbol tracker
	go func() {
		if err := symbolTracker.Start(ctx, cfg.Monitoring.CleanupInterval); err != nil {
			errChan <- fmt.Errorf("symbol tracker error: %w", err)
		}
	}()

	// Start request tracker
	go func() {
		if err := requestTracker.Start(ctx); err != nil {
			errChan <- fmt.Errorf("request tracker error: %w", err)
		}
	}()

	// Start metrics exporter
	go func() {
		if err := metricsExporter.Start(ctx); err != nil {
			errChan <- fmt.Errorf("metrics exporter error: %w", err)
		}
	}()

	// Start MQTT processor
	go func() {
		if err := mqttProcessor.Start(ctx); err != nil {
			errChan <- fmt.Errorf("MQTT processor error: %w", err)
		}
	}()

	// Wait for shutdown signal or error
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigChan:
		logrus.WithField("signal", sig).Info("Received shutdown signal")
	case err := <-errChan:
		logrus.WithError(err).Error("Service error, shutting down")
	}

	// Graceful shutdown
	logrus.Info("Shutting down...")
	cancel()

	// Give services time to clean up
	time.Sleep(2 * time.Second)
	logrus.Info("Shutdown complete")
}

func setupLogging(cfg config.LoggingConfig) {
	// Set log level
	level, err := logrus.ParseLevel(cfg.Level)
	if err != nil {
		logrus.WithError(err).Warn("Invalid log level, using info")
		level = logrus.InfoLevel
	}
	logrus.SetLevel(level)

	// Set log format
	switch cfg.Format {
	case "json":
		logrus.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})
	case "text":
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: time.RFC3339,
		})
	default:
		logrus.Warn("Unknown log format, using text")
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: time.RFC3339,
		})
	}

	// Set log output
	switch cfg.Output {
	case "stdout":
		logrus.SetOutput(os.Stdout)
	case "stderr":
		logrus.SetOutput(os.Stderr)
	default:
		// Assume it's a file path
		if cfg.Output != "" {
			file, err := os.OpenFile(cfg.Output, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
			if err != nil {
				logrus.WithError(err).Fatal("Failed to open log file")
			}
			logrus.SetOutput(file)
		} else {
			logrus.SetOutput(os.Stdout)
		}
	}
}
