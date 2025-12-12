#!/bin/bash

# Prometheus cleanup script for TickrMeter metrics
# This script automatically finds and deletes all tickrmeter_* metrics

PROMETHEUS_URL="http://localhost:9090"

echo "🧹 Cleaning up all TickrMeter Prometheus time series..."

# Function to delete time series by metric name
delete_metric() {
    local metric_name=$1
    echo "Deleting all series for metric: $metric_name"
    
    curl -X POST \
        -g "${PROMETHEUS_URL}/api/v1/admin/tsdb/delete_series?match[]=${metric_name}" \
        -H "Content-Type: application/x-www-form-urlencoded"
    
    echo ""
}

# Get all tickrmeter metric names from Prometheus
echo "� Finding all tickrmeter_* metrics..."
METRICS=$(curl -s "${PROMETHEUS_URL}/api/v1/label/__name__/values" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); [print(m) for m in data['data'] if m.startswith('tickrmeter_')]")

if [ -z "$METRICS" ]; then
    echo "ℹ️  No tickrmeter_* metrics found in Prometheus"
else
    echo "📊 Found the following tickrmeter metrics:"
    echo "$METRICS" | sed 's/^/  - /'
    echo ""
    
    echo "🗑️  Deleting ALL tickrmeter metrics..."
    while IFS= read -r metric; do
        if [ -n "$metric" ]; then
            delete_metric "$metric"
        fi
    done <<< "$METRICS"
fi

# Trigger cleanup to free disk space
echo "🧽 Triggering Prometheus cleanup to free disk space..."
curl -X POST "${PROMETHEUS_URL}/api/v1/admin/tsdb/clean_tombstones"

echo ""
echo "✅ Cleanup complete!"
echo "📊 You can check the Prometheus UI at: ${PROMETHEUS_URL}"
echo "🔄 Restart your tkmprom-exe to start generating new optimized metrics"
