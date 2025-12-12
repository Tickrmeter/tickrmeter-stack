import datetime
import time
import json
import sqlite3
import asyncio
import gmqtt

# Connect to the MQTT broker
client = gmqtt.Client("statsmaker")
client.set_auth_credentials("tickrmeter-io", "Ap0H/g476B#vIk9")

async def on_message(client, topic, payload, qos, properties):
    global conn, c
    payload = payload.decode('utf-8')
    try:
        data = json.loads(payload)
        # print("Received message '" + payload + "' on topic '" + topic + "' with QoS " + str(qos))
        if topic == "DEVICESTATUS_RES":
            device_id = data['device']
            status = data['status']
            firmware_version = data['firmware_version']
            battery = data['battery']
            vin = data.get('vin','none')
            ts = datetime.datetime.now().timestamp()
            c.execute("INSERT or replace INTO devices VALUES (?, ?, ?, ?, ?, ?,(select boot_count from devices where device_id = ? union select 1 limit 1))", (device_id, status, firmware_version, battery, vin, ts,device_id))
        elif topic.startswith('TICKRMETERBOOT'):
            device_id = data['device']
            print("Device",device_id,"booted")
            c.execute("UPDATE devices SET boot_count = boot_count + 1 WHERE device_id = ?", (device_id,))
            #commit the changes to db file
            conn.commit()
        else:
            #check if message topic starts with FIRMWAREUPDATE
            if topic.startswith('FIRMWAREUPDATE') or topic == 'STOCKPRICEUPDATE' or data['type'] not in ['UPDATE', 'NEW']:
                return
            device_id = topic
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
        print("Error with message '" + payload + "' on topic '" + topic)
        #print the full error message
        print(e)

# Connect to the database
conn = sqlite3.connect('data.db')
c = conn.cursor()

# Create the table to store the data
c.execute('''CREATE TABLE IF NOT EXISTS stocks
             (device_id text PRIMARY KEY, symbol text, price text, p real, percent text, date text, currency text, name text, isPlaylist integer, type text, cycleInterval text, updateInterval text, symbols text, symbolIndex integer, ledBrightness integer, alertEnabled integer, ts real)''')

c.execute('''CREATE TABLE IF NOT EXISTS devices
             (device_id text PRIMARY KEY, status text, firmware_version text, battery text, vin text, ts real, boot_count integer)''')


# Define the callback function for when the client disconnects from the broker
async def on_disconnect(client, packet, exc=None):
    print('Disconnected from broker')
    await asyncio.sleep(5)
    await client.reconnect()


# Start the event loop and connect to the MQTT broker
async def main(broker_address):
    global client
    client.set_auth_credentials("tickrmeter-io", "Ap0H/g476B#vIk9")
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    await client.connect(broker_address)
        # Set the username and password

    # Connect to the MQTT broker
    # Subscribe to the topic
    client.subscribe("#")
    
    while True:
        await asyncio.sleep(0.1)



# Start the event loop
try:
    asyncio.run(main("comm.tickrmeter.io"))
except KeyboardInterrupt:
    pass

# Disconnect from the MQTT broker and close the database connection
conn.close()