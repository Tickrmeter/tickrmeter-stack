import datetime
import time
import json
import sqlite3
import asyncio
import gmqtt

# Define the callback function for when a message is received
def on_message(client, topic, payload, qos, properties):
    global conn, c
    payload = payload.decode('utf-8')
    try:
        data = json.loads(payload)
        if topic == "DEVICESTATUS_RES":
            device_id = data['device']
            status = data['status']
            firmware_version = data['firmware_version']
            battery = data['battery']
            vin = data.get('vin','none')
            ts = datetime.datetime.now().timestamp()
            #get current boot count:
            c.execute("SELECT boot_count FROM devices WHERE device_id = ?", (device_id,))
            boot_count = c.fetchone() or [1]

            c.execute("INSERT or replace INTO devices VALUES (?, ?, ?, ?, ?, ?,?)", (device_id, status, firmware_version, battery, vin, ts, boot_count[0]))
        elif topic.startswith('TICKRMETERBOOT'):
            device_id = data['device']
            print("Device",device_id,"booted")
            c.execute("UPDATE devices SET boot_count = (boot_count + 1) WHERE device_id = ?", (device_id,))
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
        print("Error with message '" + payload + "' on topic '" + topic + "' with QoS " + str(qos))
        #print the full error message
        print(e)
        #print call stack
        import traceback
        traceback.print_exc()


# Define the MQTT broker and topic
broker_address = "comm.tickrmeter.io"
topic = "#"

# Connect to the MQTT broker
async def main(broker_address, topic):
    global conn, c
    conn = sqlite3.connect('..\data.db')
    c = conn.cursor()

    # Create the table to store the data
    c.execute('''CREATE TABLE IF NOT EXISTS stocks
                 (device_id text PRIMARY KEY, symbol text, price text, p real, percent text, date text, currency text, name text, isPlaylist integer, type text, cycleInterval text, updateInterval text, symbols text, symbolIndex integer, ledBrightness integer, alertEnabled integer, ts real)''')

    c.execute('''CREATE TABLE IF NOT EXISTS devices
                 (device_id text PRIMARY KEY, status text, firmware_version text, battery text, vin text, ts real, boot_count integer)''')

    # Create a new MQTT client instance
    client = gmqtt.Client("checkService")

    # Set the username and password
    client.set_auth_credentials("tickrmeter-io", "Ap0H/g476B#vIk9")

    # Set the callback function for when a message is received
    client.on_message = on_message

    # Connect to the MQTT broker
    await client.connect(broker_address)

    # Subscribe to the topic
    client.subscribe("#")

    # Start the MQTT loop
    while True:
        await asyncio.sleep(0.1)

    # Disconnect from the MQTT broker
    await client.disconnect()

asyncio.run(main(broker_address, topic))