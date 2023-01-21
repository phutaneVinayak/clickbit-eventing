import kafkaJs from 'kafkajs';
import requestClient from 'request';

const { request } = requestClient;

async function startEngine() {
    var kafkaConsumer;

    const kafkaClient = new kafkaJs.Kafka({
        clientId: 'trigger-producer',
        brokers: [process.env.BROKER, "127.0.0.1:9092"] //, 
    });

    try {
        kafkaConsumer = kafkaClient.consumer({ groupId: 'Engine-1' });
    } catch (kafkaError) {
        console.log("Error In getting consumer", kafkaError);
    }

    try {
        await kafkaConsumer.connect();
    } catch (kafkaConsumerConnectError) {
        console.log("Error in connecting consumer", kafkaConsumerConnectError);
    }

    try {
        await kafkaConsumer.subscribe({ topic: 'event-queue' })
    } catch (kafkaConsumerSubscribeError) {
        console.log("Error in Subscribing kafka", kafkaConsumerSubscribeError);
    }

    try {
        await kafkaConsumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                // consol÷e.log("topic", topic);
                // console.log("kafka Topic", {
                //     value: message.value.toString()
                // })

                sendCloudEvent(topic, message.value.toString())
            },
        })
    } catch (kafkaMessageReadError) {
        console.log("Error in reading kafka msg", kafkaMessageReadError);
    }
}

//  -H "ce-specversion: 1.0"      -H "ce-source: curl-command"      -H "ce-type: curl.demo"      -H "ce-id: 123-abc"      -d '{"name":"Vinayak Phutane"}'

function sendCloudEvent(topic, message){
    requestClient({
        url: "http://kafka-broker-ingress.knative-eventing.svc.cluster.local/knative-eventing/kafka-event-broker",
        method: "POST",
        "headers": {
            "content-type": "application/json",
            "ce-specversion": "1.0",
            "ce-source": "node-request",
            "ce-type": "node-demo",
            "ce-id": "123-abc",
            "ce-topic": topic
        },
        json: JSON.parse(message)
    }, function(err, res, body){
        if (err){
            console.log("Error while connecting http://kafka-broker-ingress.knative-eventing.svc.cluster.local/knative-eventing/kafka-event-broker", err);
        }

        console.log("res.statusCode", res.statusCode)
        console.log("res body", body);
    })
}

startEngine();