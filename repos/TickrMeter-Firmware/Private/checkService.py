import json
import paho.mqtt.client as mqtt # Import the MQTT library install with 'pip install paho-mqtt'
import time


# Define the callback function for when a message is received
def on_message(client, userdata, message):
    global message_received, error_message
    print("Received message: " + str(message.payload.decode()))
    #get json data
    json_data = json.loads(message.payload.decode())
    #check if type is "UPDATE" or "NEW"
    if json_data["type"] not in ("UPDATE", "NEW"):
        error_message = "Incorrect message type received!"
        return
    message_received = True


# Define the MQTT broker and topic
broker_address = "comm.tickrmeter.io"
topic = "STOCKPRICEUPDATE"

# Create a new MQTT client instance
client = mqtt.Client( "checkService")

# Set the username and password
client.username_pw_set("tickrmeter-io", "Ap0H/g476B#vIk9")

# Set the callback function for when a message is received
client.on_message = on_message

# Connect to the MQTT broker
client.connect( broker_address)

# Subscribe to the topic
client.subscribe("349454B9BA80")

# Send the message
message = '{"type":"UPDATE","device":"349454B9BA80"}'

# open log file
log_file = open("log.txt", "a+")

# Wait for the return message for 5 seconds then disconnect
message_received = False
error_message = None
while True:
    client.publish(topic, message)
    client.loop_start()
    start_time = time.time()
    while time.time() - start_time < 5:
        if message_received or error_message:
            break
    client.loop_stop()



    if not message_received:
        print("No message received within 5 seconds. Sending alert...")
        #write to log file with timestamp and error message
        log_file.write(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()) + " [KO] No message received within 5 seconds.\n")

    elif error_message:
        print(error_message)
        log_file.write(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()) + " [KO]" + error_message + "\n")

    else:
        print("Message received successfully.")
        log_file.write(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()) + " [OK] Message received successfully.\n")

    #reset variables
    message_received = False
    error_message = None
    #wait 5 seconds before sending another message
    time.sleep(5)
# Disconnect from the MQTT broker
client.disconnect()