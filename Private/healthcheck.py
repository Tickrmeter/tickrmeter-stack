import re
import time
import paho.mqtt.client as mqtt
import json

# Connect to the MQTT broker
client = mqtt.Client()
client.username_pw_set("tickrmeter-io", "Ap0H/g476B#vIk9")
client.connect("comm.tickrmeter.io", 1883, 60)

# Initialize the missing reply count
missing_reply_count = 0

#pending request
pending_request = []
device_requests = {}
device_boots = {}
processedMsg=0
symbol_count = {}


# Define the callback function for when a message is received
def on_message(client, userdata, message):
    global missing_reply_count, processedMsg
    payload = message.payload.decode('utf-8')
    try:
        # print("Message received:", payload)
        data = json.loads(payload)
        if message.topic == "DEVICE_BOOTED":
            device_boots[data['device']] = device_boots.get(data['device'],0) + 1
        if message.topic == "STOCKPRICEUPDATE" and data['type'] == 'UPDATE':
            # print("Stock price update received for", data['symbol'])
            #return if no symbol is present in the message
            if 'symbol' not in data:
                #create entry in device_requests if not present
                device_requests[data['device']] = device_requests.get(data['device'],0) + 1

                return
            processedMsg+=1
            #add the timestamp to the message
            data['ts'] = int(time.time())
            # print("Stock price request received from", data['device'],"for", data['symbol'])
            #add the message as pending request
            pending_request.append(data)
            #if symbol is present in the symbol_count, increment the count
            symbol_count[data['symbol']] = symbol_count.get(data['symbol'],0) + 1
                

        #check if the message topic is 12 hex uppercase characters:
        elif re.match(r"^[A-F0-9]{12}$", message.topic):
            #search for the message in the pending request

            #remove matching entry in device_requests
            if message.topic in device_requests:
                #delete the entry from device_requests
                device_requests.pop(message.topic)
                
                
                return

            if data['isPlaylist'] != True:
                return
            # print(" message received from", message.topic, "for", data['symbols'].split(',')[data['symbolIndex']])
            for i in range(len(pending_request)):
                if data['isPlaylist'] == True:
                    symbol = data['symbols'].split(',')[data['symbolIndex']]
                else:
                    symbol = data['symbol']
                # print("symbol:", symbol)
                if pending_request[i]['device'] == message.topic and pending_request[i]['symbol'] == symbol:
                    symbol_count[symbol]= symbol_count.get(symbol,0) - 1
                    #calculate the latency
                    # latency = int(time.time()) - pending_request[i]['ts']

                    #remove the message from the pending request
                    pending_request.pop(i)
                    # print("Stock price update acknowledged")
                    break
        else:
            # print("Invalid message topic:", message.topic)
            return
        #display top 10 symbols with missing reply
        if processedMsg % 100 == 0:
            print("Top 10 symbols with missing reply:", sorted(symbol_count.items(), key=lambda x: x[1], reverse=True)[:10])

        #if there are some pending request for device show the list
        if len(device_requests) > 0 and processedMsg % 100 == 0:
            print("Pending request for devices:", device_requests)
        
        #if there are some device boots show the list
        if len(device_boots) > 0 and processedMsg % 100 == 0:
            print("Device boots:", device_boots)

    except Exception as e:
        print("Error:", e)
    #displaying count of missing reply
    # print("Missing reply count:", len(pending_request))
    #count statistics on the missing reply per symbol

# Subscribe to the topic
client.subscribe("#")
# client.subscribe([("STOCKPRICEUPDATE", 0), ("78218448C6F4", 0)])

# Set the callback function for when a message is received
client.on_message = on_message

# Start the MQTT loop
client.loop_forever()
