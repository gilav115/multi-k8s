const keys = require('./keys');

// express app setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser());

// Postgres client setup
const { Pool } = require('pg')
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => console.log("Lost PG connection"));

pgClient.on('connect', () => {
    pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err));
});

// Redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000 // retry to connect once every second on disconnection
});
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get('/', (req, res) => {
    res.send("Hello");
});

app.get('/values/all', async (req, res) => {
    console.log("server->index.js -> Called /values/current method");
    
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    // redis doesn't support await
    // so we're using callback instead

    console.log("server->index.js -> Called /values/current method");
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;
    console.log("server->index.js -> Called /values method");

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high!');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true });
});

app.listen(5000, err => {
    console.log('Listening...');
});