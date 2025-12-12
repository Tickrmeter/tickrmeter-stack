package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync/atomic"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/sirupsen/logrus"
	"github.com/tickrmeter/tkmprom/internal/device"
	"github.com/tickrmeter/tkmprom/internal/tracker"
)

// ProcessorConfig contains MQTT processor configuration
type ProcessorConfig struct {
	BrokerURL      string
	Username       string
	Password       string
	ClientID       string
	Topics         []string
	BufferSize     int
	Workers        int
	DeviceManager  *device.Manager
	SymbolTracker  *tracker.SymbolTracker
	RequestTracker *tracker.RequestTracker
}

// Processor handles MQTT message processing
type Processor struct {
	config         ProcessorConfig
	client         mqtt.Client
	messageChannel chan mqtt.Message
	
	// Message tracking counters
	totalMessages         int64
	stockUpdateMessages   int64
	deviceStatusMessages  int64
	deviceBootMessages    int64
	httpStreamMessages    int64
	deviceResponseMessages int64
	unknownMessages       int64
	ignoredMessages       int64
}

// Message represents an MQTT message for processing
type Message struct {
	Topic   string
	Payload []byte
}

// NewProcessor creates a new MQTT processor
func NewProcessor(config ProcessorConfig) *Processor {
	return &Processor{
		config:         config,
		messageChannel: make(chan mqtt.Message, config.BufferSize),
	}
}

// Start begins MQTT processing
func (p *Processor) Start(ctx context.Context) error {
	// Configure MQTT client
	opts := mqtt.NewClientOptions()
	opts.AddBroker(p.config.BrokerURL)
	opts.SetClientID(p.config.ClientID)
	opts.SetUsername(p.config.Username)
	opts.SetPassword(p.config.Password)
	opts.SetCleanSession(true)
	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)
	opts.SetConnectRetryInterval(5 * time.Second)
	opts.SetMaxReconnectInterval(300 * time.Second)

	// Set connection handlers
	opts.SetOnConnectHandler(func(client mqtt.Client) {
		logrus.Info("Connected to MQTT broker")
		p.subscribeToTopics()
	})

	opts.SetConnectionLostHandler(func(client mqtt.Client, err error) {
		logrus.WithError(err).Warn("MQTT connection lost")
	})

	// Set message handler
	opts.SetDefaultPublishHandler(func(client mqtt.Client, msg mqtt.Message) {
		select {
		case p.messageChannel <- msg:
		default:
			logrus.Warn("Message channel full, dropping message")
		}
	})

	// Create and connect client
	p.client = mqtt.NewClient(opts)
	if token := p.client.Connect(); token.Wait() && token.Error() != nil {
		return fmt.Errorf("failed to connect to MQTT broker: %w", token.Error())
	}

	// Start worker goroutines
	for i := 0; i < p.config.Workers; i++ {
		go p.messageWorker(ctx)
	}

	// Start stats reporting goroutine
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				p.PrintMessageStats()
			}
		}
	}()

	logrus.WithFields(logrus.Fields{
		"broker":  p.config.BrokerURL,
		"workers": p.config.Workers,
	}).Info("Started MQTT processor")

	// Wait for context cancellation
	<-ctx.Done()

	// Cleanup
	logrus.Info("Shutting down MQTT processor")
	p.PrintMessageStats() // Final stats
	close(p.messageChannel)
	p.client.Disconnect(250)

	return ctx.Err()
}

// subscribeToTopics subscribes to configured MQTT topics
func (p *Processor) subscribeToTopics() {
	for _, topic := range p.config.Topics {
		if token := p.client.Subscribe(topic, 0, nil); token.Wait() && token.Error() != nil {
			logrus.WithError(token.Error()).WithField("topic", topic).Error("Failed to subscribe to topic")
		} else {
			logrus.WithField("topic", topic).Info("Subscribed to MQTT topic")
		}
	}
}

// messageWorker processes messages from the channel
func (p *Processor) messageWorker(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-p.messageChannel:
			if !ok {
				return
			}
			p.processMessage(msg)
		}
	}
}

// processMessage processes a single MQTT message
func (p *Processor) processMessage(msg mqtt.Message) {
	topic := msg.Topic()
	payload := msg.Payload()
	
	// Increment total message counter
	atomic.AddInt64(&p.totalMessages, 1)

	logrus.WithFields(logrus.Fields{
		"topic":   topic,
		"payload": string(payload),
	}).Debug("Processing MQTT message")

	switch topic {
	case "STOCKPRICEUPDATE":
		atomic.AddInt64(&p.stockUpdateMessages, 1)
		p.handleStockPriceUpdate(payload)
	case "DEVICESTATUS_RES":
		atomic.AddInt64(&p.deviceStatusMessages, 1)
		p.handleDeviceStatus(payload)
	case "TICKRMETERBOOT", "DEVICE_BOOTED":
		atomic.AddInt64(&p.deviceBootMessages, 1)
		p.handleDeviceBoot(payload)
	case "HTTPSTREAMSTOCKS":
		atomic.AddInt64(&p.httpStreamMessages, 1)
		p.handleHTTPStreamStocks(payload)
	default:
		// Check if it's a device-specific topic (device response)
		if p.isDeviceSpecificTopic(topic) {
			atomic.AddInt64(&p.deviceResponseMessages, 1)
			p.handleDeviceResponse(topic, payload)
		} else if p.shouldIgnoreTopic(topic) {
			atomic.AddInt64(&p.ignoredMessages, 1)
			logrus.WithField("topic", topic).Debug("Ignored known topic")
		} else {
			atomic.AddInt64(&p.unknownMessages, 1)
			logrus.WithField("topic", topic).Debug("Unknown topic, ignoring")
		}
	}
}

// handleStockPriceUpdate processes STOCKPRICEUPDATE messages
func (p *Processor) handleStockPriceUpdate(payload []byte) {
	if err := tracker.HandleStockRequest(payload, "", p.config.RequestTracker, p.config.SymbolTracker); err != nil {
		logrus.WithError(err).Error("Failed to handle stock price update")
	}
}

// handleDeviceStatus processes DEVICESTATUS_RES messages
func (p *Processor) handleDeviceStatus(payload []byte) {
	if err := p.config.DeviceManager.UpdateDevice(payload); err != nil {
		logrus.WithError(err).Error("Failed to handle device status")
	}
}

// handleDeviceBoot processes boot messages
func (p *Processor) handleDeviceBoot(payload []byte) {
	if err := p.config.DeviceManager.UpdateDeviceBoot(payload); err != nil {
		logrus.WithError(err).Error("Failed to handle device boot")
	}
}

// handleHTTPStreamStocks processes HTTPSTREAMSTOCKS messages
func (p *Processor) handleHTTPStreamStocks(payload []byte) {
	var streamMsg struct {
		Device string      `json:"device"`
		Params interface{} `json:"params"`
	}

	if err := json.Unmarshal(payload, &streamMsg); err != nil {
		logrus.WithError(err).Error("Failed to parse HTTP stream stocks message")
		return
	}

	logrus.WithFields(logrus.Fields{
		"device": streamMsg.Device,
	}).Debug("Processed HTTP stream stocks message")

	// This could be extended to track HTTP stream requests as well
}

// handleDeviceResponse processes device-specific response messages
func (p *Processor) handleDeviceResponse(topic string, payload []byte) {
	deviceID := topic

	// Parse the response to check if it's a stock update
	var response struct {
		Symbol string `json:"symbol"`
		Type   string `json:"type"`
	}

	if err := json.Unmarshal(payload, &response); err != nil {
		logrus.WithError(err).WithField("device_id", deviceID).Error("Failed to parse device response")
		return
	}

	// Only process stock-related responses
	if response.Symbol != "" && (response.Type == "UPDATE" || response.Type == "NEW") {
		if err := tracker.HandleStockResponse(payload, deviceID, p.config.RequestTracker, p.config.SymbolTracker); err != nil {
			logrus.WithError(err).WithField("device_id", deviceID).Error("Failed to handle stock response")
		}
	}

	logrus.WithFields(logrus.Fields{
		"device_id": deviceID,
		"symbol":    response.Symbol,
		"type":      response.Type,
	}).Debug("Processed device response")
}

// isDeviceSpecificTopic checks if a topic is a device-specific response topic
func (p *Processor) isDeviceSpecificTopic(topic string) bool {
	// Device topics are typically 12-character hex strings
	if len(topic) != 12 {
		return false
	}

	// Check if it's all hex characters
	for _, c := range topic {
		if !((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f')) {
			return false
		}
	}

	return true
}

// shouldIgnoreTopic checks if a topic should be ignored (but counted)
func (p *Processor) shouldIgnoreTopic(topic string) bool {
	// Topics we know about but don't need to process for latency tracking
	ignoredPrefixes := []string{
		"ALERT/",
		"LOG/",
		"$SYS/",
	}
	
	for _, prefix := range ignoredPrefixes {
		if strings.HasPrefix(topic, prefix) {
			return true
		}
	}
	
	return false
}

// PrintMessageStats prints current message processing statistics
func (p *Processor) PrintMessageStats() {
	total := atomic.LoadInt64(&p.totalMessages)
	stockUpdate := atomic.LoadInt64(&p.stockUpdateMessages)
	deviceStatus := atomic.LoadInt64(&p.deviceStatusMessages)
	deviceBoot := atomic.LoadInt64(&p.deviceBootMessages)
	httpStream := atomic.LoadInt64(&p.httpStreamMessages)
	deviceResponse := atomic.LoadInt64(&p.deviceResponseMessages)
	ignored := atomic.LoadInt64(&p.ignoredMessages)
	unknown := atomic.LoadInt64(&p.unknownMessages)
	
	logrus.WithFields(logrus.Fields{
		"total_messages":          total,
		"stock_update_messages":   stockUpdate,
		"device_status_messages":  deviceStatus,
		"device_boot_messages":    deviceBoot,
		"http_stream_messages":    httpStream,
		"device_response_messages": deviceResponse,
		"ignored_messages":        ignored,
		"unknown_messages":        unknown,
	}).Info("MQTT message processing statistics")
}
func (p *Processor) isKnownSystemTopic(topic string) bool {
	knownTopics := []string{
		"STOCKPRICEUPDATE",
		"DEVICESTATUS_RES",
		"TICKRMETERBOOT",
		"DEVICE_BOOTED",
		"HTTPSTREAMSTOCKS",
	}

	for _, known := range knownTopics {
		if topic == known {
			return true
		}
	}

	// Check for ALERT topics
	if strings.HasPrefix(topic, "ALERT/") {
		return true
	}

	// Check for LOG topics
	if strings.HasPrefix(topic, "LOG/") {
		return true
	}

	return false
}
