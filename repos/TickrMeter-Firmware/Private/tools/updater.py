import datetime
import time
import json
import sqlite3
import asyncio
import gmqtt

timeouttable = {}

#prepare log file
log = open("retaincleaner.log","a")

#list of device ids to push the update to
device_id_list = [
    '349454B9BA80',
]

# Send a message to the devices from device_id_list to force an update
def forceUpdate(client):
    for device_id in device_id_list:
        topic = "FIRMWAREUPDATE/"+device_id
        data = '{"version":"61p","url":"https://api.tickrmeter.io/api/ota/678fd3772600184d14dfe8d9"}'
        client.publish(topic, data.encode('utf-8'), retain=True)
        print("Pushing new version to device",device_id)
        log.write("Pushing new version to device "+device_id+"\n")



# Define the callback function for when a message is received
def on_message(client, topic, payload, qos, properties):
    global timeouttable, totalcount
    payload = payload.decode('utf-8')
    if payload == '':
        return
    try:
        data = json.loads(payload)
        #check if message topic starts with FIRMWAREUPDATE
        if topic.startswith('FIRMWAREUPDATE'):
            #save timeout for the message in 20 minutes
            timeouttable[topic] = [datetime.datetime.now() + datetime.timedelta(minutes=10), data['version']]
            print("FW Update on topic",topic,"with version",data['version'],"has been saved in the timeouttable for: ",timeouttable[topic][0])
            #print to log file
            log.write("Topic "+topic+" with version "+data['version']+" has been saved in the timeouttable for: "+str(timeouttable[topic][0])+"\n")
            return
        
        if topic == "DEVICESTATUS_RES":
            device_id = data['device']
            topic = "FIRMWAREUPDATE/"+device_id
            #check if the version is 59p or 60p
            if data['firmware_version'] == "59p" or data['firmware_version'] == "60p":
                #Push the new version to the device
                #check battery > 10
                if data['battery'] < 10:
                    print("Battery is less than 10, skipping update")
                    return
                if totalcount > 100:
                    print("Total count is greater than 10, skipping update")
                    return
                print("Pushing new version to device",device_id)

                topic = "FIRMWAREUPDATE/"+device_id
                data = '{"version":"61p","url":"https://api.tickrmeter.io/api/ota/678fd3772600184d14dfe8d9"}'
                client.publish(topic, data.encode('utf-8'), retain=True)
                totalcount += 1

    except Exception as e:
        print("Error with message '" + payload + "' on topic '" + topic + "' with QoS " + str(qos))
        #print the full error message
        print(e)




# Define the MQTT broker and topic
broker_address = "comm.tickrmeter.io"
client = gmqtt.Client("cleanupService")

totalcount = 0

async def main(broker_address):
    global client
    # Create a new MQTT client instance

    # Set the username and password
    client.set_auth_credentials("tickrmeter-io", "Ap0H/g476B#vIk9")

    # Set the callback function for when a message is received
    client.on_message = on_message

    # Connect to the MQTT broker
    await client.connect(broker_address)

    # Subscribe to the topic
    # client.subscribe("#")
    client.subscribe([gmqtt.Subscription("FIRMWAREUPDATE/#", qos=0), gmqtt.Subscription("DEVICESTATUS_RES", qos=0)])
    
    #start cleanup task in background
    # asyncio.create_task(cleanupTask())

    # print("Started cleanup service")
    #launch the forceUpdate function
    # forceUpdate(client)

    # Start the MQTT loop
    while True:
        await asyncio.sleep(0.1)


    # Disconnect from the MQTT broker
    await client.disconnect()

asyncio.run(main(broker_address))
