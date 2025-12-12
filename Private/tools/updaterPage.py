import datetime
import time
import json
import sqlite3
import paho.mqtt.client as mqtt

timeouttable = {}

#prepare log file
log = open("retaincleaner.log","a")

#list of device ids to push the update to
page_devices = []
page_devices_done = []


# Send a message to the devices from device_id_list to force an update
def forceUpdate(device_id):
    topic = "FIRMWAREUPDATE/"+device_id
    data = '{"version":"62p","url":"https://api.tickrmeter.io/api/ota/67bb36c89e4932a50fa5bed5"}'
    client.publish(topic, data, retain=True)
    print("Pushing new version to device", device_id)
    log.write("Pushing new version to device "+device_id+"\n")

# Define MQTT callbacks
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("#")

def on_message(client, userdata, msg):
    global timeouttable, totalcount
    
    topic = msg.topic
    payload = msg.payload.decode('utf-8')
    
    if payload == '':
        return
        
    try:
        data = json.loads(payload)
        if topic.startswith('FIRMWAREUPDATE'):
            #get device id from topic
            device_id = topic.split('/')[1]

            timeouttable[device_id] = [datetime.datetime.now() + datetime.timedelta(minutes=10), data['version']]
            print("FW Update on topic", topic, "with version", data['version'], 
                  "has been saved in the timeouttable for: ", timeouttable[device_id][0])
            log.write(f"Topic {topic} with version {data['version']} has been saved in the timeouttable for: {timeouttable[device_id][0]}\n")
            return
        
        if topic == "DEVICESTATUS_RES":
            device_id = data['device']

            # Check if needed to removre from timeouttable
            if device_id in timeouttable:
                if data['firmware_version'] == timeouttable[device_id][1]:
                    print(f"Device {device_id} has the correct firmware")
                    del timeouttable[device_id]
                    #delete the message from mqtt retained
                    client.publish("FIRMWAREUPDATE/"+device_id, "", retain=True)
                    print(f"Deleted message from FIRMWAREUPDATE/{device_id}")

            if device_id in page_devices_done:
                return
            if device_id in page_devices:
                if data['firmware_version'] != "62p":
                    if int(data['battery']) < 10:
                        print("Battery is less than 10, skipping update")
                        print("Total devices in page mode:", len(page_devices))
                        print("Total devices done:", len(page_devices_done))
                        return
                    if int(data['uptime']) < 3600*24:
                        forceUpdate(device_id)
                        return
                    else:
                        print(f"Device has too big uptime: {int(data['uptime'])/3600}h, skipping update")
                    return
                else:
                    print(f"Device {device_id}B already has the latest firmware")
                    page_devices_done.append(device_id)
                    print("Total devices in page mode:", len(page_devices))
                    print("Total devices done:", len(page_devices_done))
                    return
        
        if len(topic) == 12:
            if 'mode' in data and data['mode'] == 'page':
                if topic not in page_devices:
                    page_devices.append(topic)
                    print("Added device to page list", topic)
                    print("Total devices in page mode:", len(page_devices))
                    print("Total devices done:", len(page_devices_done))
                return

    except Exception as e:
        print(f"Error with message '{payload}' on topic '{topic}'")
        print(e)

# reconnetion function
def on_disconnect(client, userdata, rc):
    print(f"Disconnected with result code {rc}")
    time.sleep(.4)
    client.reconnect()


# Set up MQTT client
broker_address = "comm.tickrmeter.io"
client = mqtt.Client("cleanupService")
client.username_pw_set("tickrmeter-io", "Ap0H/g476B#vIk9")

# Set callbacks
client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect


# Connect and start loop
client.connect(broker_address)
client.loop_forever()
