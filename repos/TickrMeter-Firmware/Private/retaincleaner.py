import datetime
import time
import json
import sqlite3
import asyncio
import gmqtt

timeouttable = {}

#prepare log file
log = open("retaincleaner.log","a")
maxuptime = 0

# Define the callback function for when a message is received
def on_message(client, topic, payload, qos, properties):
    global timeouttable , maxuptime
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
            if data['version'] == '60p':
                client.publish(topic, b'', retain=True)
                print("CLEARED",topic)

            return
        
        if topic == "DEVICESTATUS_RES":
            device_id = data['device']
            topic = "FIRMWAREUPDATE/"+device_id

            if maxuptime < int(data['uptime']):
                maxuptime = int(data['uptime'])
                print("Max uptime is now",maxuptime, "for device",device_id)

            #check if the topic is in the timeouttable
            if topic in timeouttable.keys():
                #check if the version is the same as the one in the timeouttable
                if data['firmware_version'] == timeouttable[topic][1]:
                    #remove the topic from the timeouttable
                    del timeouttable[topic]
                    print("Topic version is ok for device. ",topic,"has been cleared")
                    #print to log file
                    log.write("Device. "+topic+" successfully updated to version "+data['firmware_version']+" at "+str(datetime.datetime.now())+"\n")
                    #clear the message
                    client.publish(topic, b'', retain=True)
                else:
                    print("Topic version is not ok for device",device_id,". Device has version",data['firmware_version'],"but topic has version",timeouttable[topic][1])
                    #print to log file
                    log.write("Device. "+topic+" failed to upgrade from version "+data['firmware_version']+" at "+str(datetime.datetime.now())+"\n")

    except Exception as e:
        print("Error with message '" + payload + "' on topic '" + topic + "' with QoS " + str(qos))
        #print the full error message
        print(e)



async def cleanupTask():
    global timeouttable, client
    while True:
        #get current time
        try:
            now = datetime.datetime.now()
            print("Checking for timed out topics")
            #loop through all topics in timeouttable
            for topic in timeouttable:
                #check if the timeout for the topic is in the past
                if timeouttable[topic][0] < now:
                    #remove the topic from the timeouttable
                    del timeouttable[topic]
                    #print the topic
                    print("Topic",topic,"has timed out")
                    #print to log file
                    log.write("Topic "+topic+" has timed out at "+str(datetime.datetime.now())+"\n")
                    #clear the message
                    client.publish(topic, b'',retain=True)
        except Exception as e:
            print("Error in cleanup task")
            print(e)
        #sleep for 1 minute
        await asyncio.sleep(60)


# Define the MQTT broker and topic
broker_address = "comm.tickrmeter.io"
client = gmqtt.Client("cleanupService")


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
    asyncio.create_task(cleanupTask())

    print("Started cleanup service")

    # Start the MQTT loop
    while True:
        await asyncio.sleep(0.1)


    # Disconnect from the MQTT broker
    await client.disconnect()

asyncio.run(main(broker_address))
