#!/usr/bin/env python3
"""
MQTT Retained Message Cleaner

This script connects to an MQTT broker and removes all retained messages.
It takes a command-line argument to specify the environment (dev or prod).

Usage:
    python cleanall.py -dev    # Use development environment
    python cleanall.py -prod   # Use production environment
"""

import argparse
import time
import paho.mqtt.client as mqtt
import logging
from typing import List, Set

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='cleaner.log',  # Log to file as well as console
    filemode='w'
)

# Add a console handler to see logs in terminal
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger = logging.getLogger(__name__)
logger.addHandler(console_handler)

# Environment settings
ENVIRONMENTS = {
    'dev': {
        'broker': '3.141.141.38',
        'port': 1883,
        'username': 'stock_price',
        'password': 'VZ4VC8qv[NNjX7^:'
    },
    'prod': {
        'broker': 'comm.tickrmeter.io',
        'port': 1883,
        'username': 'tickrmeter-io',
        'password': 'Ap0H/g476B#vIk9'
    }
}

# Topics to scan and clean
ROOT_TOPICS = ["#"]  # Use "#" for all topics

class RetainedMessageCleaner:
    def __init__(self, env_config: dict):
        self.broker = env_config['broker']
        self.port = env_config['port']
        self.username = env_config['username']
        self.password = env_config['password']
        self.retained_topics: Set[str] = set()
        self.connected = False

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info(f"Connected to MQTT broker: {self.broker}")
            self.connected = True
            # Subscribe to discover retained messages
            for topic in ROOT_TOPICS:
                client.subscribe(topic, qos=1)
                logger.info(f"Subscribed to topic: {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker with code: {rc}")

    def on_message(self, client, userdata, msg):
        # If the message is retained, add its topic to our list
        if msg.retain:
            self.retained_topics.add(msg.topic)
            logger.debug(f"Found retained message on topic: {msg.topic}")  # Use debug to avoid flooding the console

    def discover_retained_messages(self):
        logger.info("Starting retained message discovery...")
        
        client = mqtt.Client()
        client.on_connect = self.on_connect
        client.on_message = self.on_message
        client.username_pw_set(self.username, self.password)
        
        try:
            client.connect(self.broker, self.port, 60)
            client.loop_start()
            
            # Wait for connection to establish
            start_time = time.time()
            while not self.connected and time.time() - start_time < 10:
                time.sleep(0.1)
            
            if not self.connected:
                logger.error("Failed to connect to MQTT broker within timeout period")
                return False
            
            # Wait for messages to be discovered (adjust timeout as needed)
            logger.info("Waiting for retained messages to be discovered...")
            time.sleep(10)  # Give more time to receive retained messages (increased from 5 to 10)
            
            client.loop_stop()
            client.disconnect()
            return True
        
        except Exception as e:
            logger.error(f"Error during retained message discovery: {str(e)}")
            return False

    def clean_retained_messages(self):
        if not self.retained_topics:
            logger.info("No retained messages found to clean")
            return True
        
        logger.info(f"Cleaning {len(self.retained_topics)} retained messages...")
        
        client = mqtt.Client()
        client.username_pw_set(self.username, self.password)
        
        try:
            client.connect(self.broker, self.port, 60)
            
            # Enable network loop for asynchronous processing
            client.loop_start()
            
            # Process messages in batches to avoid overwhelming the broker
            batch_size = 50
            total = len(self.retained_topics)
            count = 0
            
            topic_list = list(self.retained_topics)
            
            for i in range(0, total, batch_size):
                batch = topic_list[i:i + batch_size]
                
                for topic in batch:
                    # Publish empty message with retain flag to clear the retained message
                    result = client.publish(topic, "", qos=1, retain=True)
                    result.wait_for_publish()  # Wait until the message is published
                    count += 1
                
                logger.info(f"Progress: Cleared {count}/{total} retained messages")
                # Small pause between batches to allow broker to process
                time.sleep(1)
            
            # Give time for final operations to complete
            time.sleep(.2)
            client.loop_stop()
            client.disconnect()
            logger.info("All retained messages have been cleared successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error during retained message cleaning: {str(e)}")
            return False

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='MQTT Retained Message Cleaner')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-dev', action='store_true', help='Use development environment')
    group.add_argument('-prod', action='store_true', help='Use production environment')
    parser.add_argument('-y', '--yes', action='store_true', help='Skip confirmation and proceed with cleaning')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Configure logging based on verbosity
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)
    
    # Select environment based on arguments
    env = 'dev' if args.dev else 'prod'
    env_config = ENVIRONMENTS[env]
    
    logger.info(f"Using {env.upper()} environment: {env_config['broker']}")
    
    # Initialize and run cleaner
    cleaner = RetainedMessageCleaner(env_config)
    
    if cleaner.discover_retained_messages():
        logger.info(f"Found {len(cleaner.retained_topics)} retained messages")
        
        if args.verbose:
            # Show topics to be cleaned if verbose mode
            for topic in sorted(cleaner.retained_topics):
                logger.debug(f"Found retained message: {topic}")
        
        # Confirm before cleaning
        if len(cleaner.retained_topics) > 0:
            if args.yes:
                confirmation = 'y'
            else:
                confirmation = input(f"Do you want to clear {len(cleaner.retained_topics)} retained messages? (y/n): ")
            
            if confirmation.lower() == 'y':
                cleaner.clean_retained_messages()
            else:
                logger.info("Operation cancelled by user")
        else:
            logger.info("No retained messages to clean")
    else:
        logger.error("Failed to discover retained messages")

if __name__ == "__main__":
    main()
