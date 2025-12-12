package metrics

import (
	"context"
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"github.com/tickrmeter/tkmprom/internal/config"
)

// Exporter handles Prometheus metrics HTTP endpoint
type Exporter struct {
	server *http.Server
	config config.PrometheusConfig
}

// NewExporter creates a new metrics exporter
func NewExporter(cfg config.PrometheusConfig) *Exporter {
	mux := http.NewServeMux()
	
	// Prometheus metrics endpoint
	mux.Handle(cfg.Path, promhttp.Handler())
	
	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	
	// Optional pprof endpoints for debugging
	if cfg.EnablePprof {
		mux.HandleFunc("/debug/pprof/", http.DefaultServeMux.ServeHTTP)
	}

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}

	return &Exporter{
		server: server,
		config: cfg,
	}
}

// Start begins serving metrics on HTTP endpoint
func (e *Exporter) Start(ctx context.Context) error {
	logrus.WithFields(logrus.Fields{
		"port": e.config.Port,
		"path": e.config.Path,
	}).Info("Starting Prometheus metrics exporter")

	// Start server in goroutine
	go func() {
		if err := e.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.WithError(err).Error("Metrics server error")
		}
	}()

	// Wait for context cancellation
	<-ctx.Done()

	// Graceful shutdown
	logrus.Info("Shutting down metrics exporter")
	return e.server.Shutdown(context.Background())
}
