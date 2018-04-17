//Express Setup
const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.use(express.static('public'));

//Knex Setup
const env = process.env.NODE_ENV || 'development';
const config = require('./knexfile')[env];
const knex = require('knex')(config);

//bcrypt setup
let bcrypt = require('bcrypt');
const saltRounds = 10;


//Allows a user to login
app.post('/api/login', (req, res) => {

    // Check that the request includes all the necessary information, and return an error if not.
    if (!req.body.email || !req.body.password)
        return res.status(400).send();

    //Look in the database for a user with the same email address as the one being requested. If no such user exists, return a 403 error code.
    knex('users').where('email',req.body.email).first().then(user => {
        if (user === undefined) {
            res.status(403).send("Invalid credentials");
            throw new Error('abort');
        }
        return [bcrypt.compare(req.body.password, user.hash),user];

        //Compare the hash in the user's database entry with the hash of the password they supplied. If they match, return 200. Otherwise, return 403.
    }).spread((result,user) => {
        if (result)
            res.status(200).json({user:user});
        else
            res.status(403).send("Invalid credentials");
        return;

        //If any other error occurs, return 500.
    }).catch(error => {
        if (error.message !== 'abort') {
            console.log(error);
            res.status(500).json({ error });
        }
    });
});

//Registration
app.post('/api/users', (req, res) => {

    //Check that the request includes all the necessary information, and return an error if not.
    if (!req.body.email || !req.body.password || !req.body.username || !req.body.name)
        return res.status(400).send();

    //Check if a user already exists with the given email address, and return an error if so.
    knex('users').where('email',req.body.email).first().then(user => {
        if (user !== undefined) {
            res.status(403).send("Email address already exists");
            throw new Error('abort');
        }
        return knex('users').where('username',req.body.username).first();

        //Check if a user already exists with the given username, and return an error if so.
    }).then(user => {
        if (user !== undefined) {
            res.status(409).send("User name already exists");
            throw new Error('abort');
        }

        //Hash the user's password.
        return bcrypt.hash(req.body.password, saltRounds);

        // Insert a record for the new user in the database.
    }).then(hash => {
        return knex('users').insert({email: req.body.email, hash: hash, username:req.body.username,
            name:req.body.name, role: 'user'});

        // Find the record of the new user in the database.
    }).then(ids => {
        return knex('users').where('id',ids[0]).first();

        // Return 200.
    }).then(user => {
        res.status(200).json({user:user});
        return;

        //All other errors are 500
    }).catch(error => {
        if (error.message !== 'abort') {
            console.log(error);
            res.status(500).json({ error });
        }
    });
});

//Get list of tweets for a user
app.get('/api/users/:id/tweets', (req, res) => {
    let id = parseInt(req.params.id);

    // Notice the join between tweets where user.id == tweets.user_id
    knex('users').join('tweets','users.id','tweets.user_id')
        .where('users.id',id)
        .orderBy('created','desc')
        .select('tweet','username','name','created').then(tweets => {
        res.status(200).json({tweets:tweets});
    }).catch(error => {
        res.status(500).json({ error });
    });
});

//Post a new Tweet
app.post('/api/users/:id/tweets', (req, res) => {
    let id = parseInt(req.params.id);

   // Look up the user account associated with the ID supplied in the URL
    knex('users').where('id',id).first().then(user => {

        //Insert the new tweet in the database
        return knex('tweets').insert({user_id: id, tweet:req.body.tweet, created: new Date()});

        //Find the tweet we just inserted
    }).then(ids => {
        return knex('tweets').where('id',ids[0]).first();
        // Return 200
    }).then(tweet => {
        res.status(200).json({tweet:tweet});
        return;
        //All other errors return 500
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error });
    });
});

//Search tweets
app.get('/api/tweets/search', (req, res) =>{

    if( !req.query.keywords)
        return res.status(400).send();

    //If query has an offset set it, otherwise offset is 0
    let offset = 0;
    if(req.query.offset)
        offset = parseInt(req.query.offset);

    //If query has a limit, set it. Otherwise limit is 50
    let limit = 50;
    if(req.query.limit)
        limit = parseInt(req.query.limit);

    //Create Join of users and tweets
    knex('users').join('tweets','users.id','tweets.user_id')
        //Checking where tweet matches keywords
        .whereRaw("MATCH (tweet) AGAINST('" + req.query.keywords + "')")

        //Other params
        .orderBy('created','desc')
        .limit(limit)
        .offset(offset)
        .select('tweet','username','name','created','users.id as userID').then(tweets => {
        res.status(200).json({tweets:tweets});
    }).catch(error => {

        //All other errors return 500 error
        res.status(500).json({ error });
    });
});

//Add Hashtags
app.get('/api/tweets/hash/:hashtag', (req, res) => {

    //if query has offset set it, otherwise offset is 0
    let offset = 0;
    if (req.query.offset)
        offset = parseInt(req.query.offset);

    //if query has a limit, set it. Otherwise, limit is 50
    let limit = 50;
    if (req.query.limit)
        limit = parseInt(req.query.limit);

    //Create Join of tweets and users
    knex('users').join('tweets','users.id','tweets.user_id')
        ///Checking for hashtage
        .whereRaw("tweet REGEXP '^#" + req.params.hashtag + "' OR tweet REGEXP ' #" + req.params.hashtag + "'")

        //other params
        .orderBy('created','desc')
        .limit(limit)
        .offset(offset)
        .select('tweet','username','name','created','users.id as userID').then(tweets => {
        res.status(200).json({tweets:tweets});
    }).catch(error => {

        //All other errors return 500
        res.status(500).json({ error });
    });
});

app.get('/api/users/:id', (req, res) => {
    let id = parseInt(req.params.id);
    // get user record
    knex('users').where('id',id).first().select('username','name','id').then(user => {
        res.status(200).json({user:user});
    }).catch(error => {
        res.status(500).json({ error });
    });
});



app.listen(3000, () => console.log ('Server listening on port 3000'));
