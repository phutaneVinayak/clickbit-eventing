import express from 'express';
import bodyparser from 'body-parser';
import cloudeventPkg from 'cloudevents';

const {HTTP} = cloudeventPkg;
const app = express();
app.use(bodyparser.json())
// mongodb setup
// console.log("Receiver", HTTP);
// route setup
app.post('/', (req, res) => {
    try {
        let myevent = HTTP.toEvent({ headers: req.headers, body: req.body });
        console.log(`CloudEvent Object received. ${JSON.stringify(myevent)} \n`);
        console.log('Version: ', myevent.specversion, ' \n');
        console.log('Type: ', myevent.type, ' \n');
        console.log('Data: ', myevent.data, ' \n');
        res.status(201).send("Event Accepted");

    } catch (err) {
        console.error('Error', err);
        res.status(415)
            .header("Content-Type", "application/json")
            .send(JSON.stringify(err));
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('App Version 1.0 listening on: ', port);
});