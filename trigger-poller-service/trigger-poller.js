import pkg from 'mongodb';
import kafkaJs from 'kafkajs';


const { MongoClient } = pkg;


var database, client, kafkaClient;
async function initDbConnetion(){
    client = new MongoClient(process.env.MONGO_URI || "xxxx", {useUnifiedTopology: true});
    try {
        await client.connect();
        await client.db('test').command({ping: 1});
        console.log("db connected");
        // client.db('test').collection('users').insertOne()
        // console.log("arrr", client.db('test').collection('users').find({_id: ObjectID(userPayload.id)}).skip(5).limit(10).toArrayy
        return client.db('test');
    } catch(e){
        console.log("Error while connecting db", e);
        await client.close();
    }
}

function createKafkaClient(){

    return new kafkaJs.Kafka({
        clientId: 'trigger-producer',
        brokers: [process.env.BROKER, "127.0.0.1:9092"] //, 
    })

    // return new kafkaPkg.KafkaClient({
    //     kafkaHost: "http://127.0.0.1:8081" || process.env.KAFKA_URL
    // })
}

export async function closeClientdatabase(){
    console.log("closing db connection");
   return await client.close();
}


async function initPoller(){
    let localKafkaClient, localKafkaProducer;
    try {
        try {
            database = await initDbConnetion();
            const triggers = database.collection('triggers');
            const query = {};
            const triggerCursor = triggers.find(query)
    
            if ((await triggerCursor.count()) === 0) {
                console.log("No documents found!");
                return;
            }
            
            try {
                // connect pulsar
                localKafkaClient = createKafkaClient();

            } catch (pulsarError){
                console.log("Pulsar issue", pulsarError);
                return;
            }

            try{
                localKafkaProducer = localKafkaClient.producer({
                    allowAutoTopicCreation: true
                })
                console.dir(localKafkaProducer);
            } catch (kafkaProducerError){
                console.log("Kafka producer Error", kafkaProducerError);
            }

            try {
                await localKafkaProducer.connect();
                // localKafkaProducer.on("CONNECT", data => console.log("able to connect to broker", data))
            } catch (kafkaConnectError){
                console.log("Kafka Connect Error", kafkaConnectError);
            }

            // replace console.dir with your callback to access individual elements
            await triggerCursor.forEach(async item => {
                let kafkaPayload = {
                    topic: "event-queue", //process.env.KAFKA_TOPIC
                    messages: [{
                        "key": "eventpayload",
                        "value": JSON.stringify({"cliKey": "eventing-app",
                        "serviceName": "eventing-ksvc",
                        "randomID": Math.random(),
                        "metaData": item})
                    }]
                };

                try {
                    await localKafkaProducer.send(kafkaPayload);
                    console.log(`engine job enque message`);
                } catch (kafkaError) {
                    console.log("KafkaError", kafkaError);
                } finally {
                    await localKafkaProducer.disconnect();
                    console.log("Kafka Disconnected");
                }
            });
        } catch (dbError){
            console.log("DBError", dbError);
        } finally {
            localKafkaClient.close();
            await closeClientdatabase();
        }
    } catch (e) {
        console.log("something went wrong");
    }
}

setInterval(() => {
    console.log("starting poller", new Date().getTime());
    initPoller();
}, process.env.POLLER_INTERVAL || 120000); //