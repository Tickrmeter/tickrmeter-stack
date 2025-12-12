import datetime
import time
import paho.mqtt.client as mqtt
import json
import sqlite3

# Connect to the MQTT broker
client = mqtt.Client()
client.username_pw_set("tickrmeter-io", "Ap0H/g476B#vIk9")
client.connect("comm.tickrmeter.io", 1883, 5)

# Connect to the database
conn = sqlite3.connect('data.db')
c = conn.cursor()

# Create the table to store the data
c.execute('''CREATE TABLE IF NOT EXISTS stocks
             (device_id text PRIMARY KEY, symbol text, price text, p real, percent text, date text, currency text, name text, isPlaylist integer, type text, cycleInterval text, updateInterval text, symbols text, symbolIndex integer, ledBrightness integer, alertEnabled integer, ts real)''')

c.execute('''CREATE TABLE IF NOT EXISTS devices
             (device_id text PRIMARY KEY, status text, firmware_version text, battery text, vin text, ts real, boot_count integer)''')

# Define the callback function for when a message is received
def on_message(client, userdata, message):
    payload = message.payload.decode('utf-8')
    # print("Received message on topic '" + message.topic )
    # print("Received message '" + payload + "' on topic '" + message.topic + "' with QoS " + str(message.qos))
    try:
        data = json.loads(payload)
        if message.topic == "DEVICESTATUS_RES":
            device_id = data['device']
            status = data['status']
            firmware_version = data['firmware_version']
            battery = data['battery']
            vin = data.get('vin','none')
            ts = datetime.datetime.now().timestamp()
            c.execute("INSERT or replace INTO devices VALUES (?, ?, ?, ?, ?, ?,(select boot_count from devices where device_id = ? union select 1 limit 1))", (device_id, status, firmware_version, battery, vin, ts,device_id))
        elif message.topic.startswith('TICKRMETERBOOT'):
            device_id = data['device']
            print("Device",device_id,"booted")
            c.execute("UPDATE devices SET boot_count = boot_count + 1 WHERE device_id = ?", (device_id,))
            #commit the changes to db file
            conn.commit()
        else:
            #check if message topic starts with FIRMWAREUPDATE
            if message.topic.startswith('FIRMWAREUPDATE') or message.topic == 'STOCKPRICEUPDATE' or data['type'] not in ['UPDATE', 'NEW']:
                return
            device_id = message.topic
            symbol = data.get('symbol','none')
            price = data.get('price','none')
            p = data.get('p','none')
            percent = data.get('percent','none')
            date = data.get('date','none')
            currency = data.get('currency','none')
            name = data.get('name','none')
            isPlaylist = data.get('isPlaylist','none')
            type = data.get('type','none')
            cycleInterval = data.get('cycleInterval')
            updateInterval = data.get('updateInterval',data.get('interval','none'))
            symbols = data.get('symbols','none')
            symbolIndex = data.get('symbolIndex','none')
            ledBrightness = data.get('ledBrightness','none')
            alertEnabled = data.get('alertEnabled','none')
            #add current timestamp
            ts = datetime.datetime.now().timestamp()
            c.execute("INSERT or replace INTO stocks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)", (device_id, symbol, price, p, percent, date, currency, name, isPlaylist, type, cycleInterval, updateInterval, symbols, symbolIndex, ledBrightness, alertEnabled,ts))
            # print("Inserted", device_id, symbol, price, p, percent, date, currency, name, isPlaylist, type, cycleInterval, updateInterval, symbols, symbolIndex, ledBrightness, alertEnabled)
        conn.commit()
    except Exception as e:
        print("Error with message '" + payload + "' on topic '" + message.topic + "' with QoS " + str(message.qos))
        #print the full error message
        print(e)

# Subscribe to the topics
client.subscribe("#")

# #function to reconnect to the broker
def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Unexpected disconnection. Reason code "+str(rc)+". Reconnecting...")
#         #wait 5 seconds before reconnecting
#         ret=client.disconnect()
#         client.loop_stop()
#         time.sleep(10)
#         ret=client.connect("comm.tickrmeter.io", 1883, 30)
#         client.loop_start()
#         print("Reconnected with result code "+str(ret))

# # Set the callback function for when a message is received
client.on_message = on_message
client.on_disconnect = on_disconnect


client.loop_forever() 
# Start the MQTT loop
# while True:
    # client.loop()
    # time.sleep(.1)