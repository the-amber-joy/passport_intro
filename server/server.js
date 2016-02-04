var express = require('express');
var passport = require('passport');
var session = require('express-session');
var pg = require('pg');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var localStrategy = require('passport-local').Strategy;

var app = express();

var connectionString = 'postgres://localhost:5432/passport_intro_2';

app.use(express.static('server/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


//[][][][][][][][][][][][][][][][][][][][][][][][][][]
//                  PASSPORT THINGS                 //
//[][][][][][][][][][][][][][][][][][][][][][][][][][]

app.use(session({
    secret: 'secret',                       //IMPORTANT - phrase we're using for encryption/decryption
    resave: true,                           //OPTIONAL - will resave if nothing is changed
    saveUninitialized: false,               //OPTIONAL - will resave if nothing is there yet
    cookie: {maxAge: 60000, secure: false}  //IMPORTANT - holds information about session, stored on user's computer
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);

//"dehydrate" to pass the firewall
passport.serializeUser(function(user, done){ //This is what sets the user's unique id value to this session AFTER authentication
    console.log('serializeUser', user);
    done(null, user.id);
});

//"rehydrate" once user is over the firewall safely
passport.deserializeUser(function(id, done){ //This CREATES the req.user -- it grabs the unique id, finds that user, and puts it all back together
    console.log('deserializeUser', id);
    pg.connect(connectionString, function(err, client){
        var user = {};

        var query = client.query('SELECT * FROM users WHERE id = $1', [id]);

        query.on('row', function(row){
            user = row;
            console.log('User object', user);
            done(null, user);
        });
    });
});

//This happens BEFORE serializeUser happens
passport.use('local', new localStrategy({ // passport.use() is NOT to be confused with any express.use() statements
    passReqToCallback: true,
    usernameField:'username'
}, function(req, username, password, done){

    pg.connect(connectionString, function(err, client){ // DO NOT use 'done' here or it will fail silently and be very hard to find
        var user = {}; //this will NOT be in every query, but we're using it here today

        var query = client.query('SELECT * FROM users WHERE username = $1', [username]);

        query.on('row', function(row){
            user = row;
            console.log('User object:', user);
        });

        query.on('end', function(){
            if(user && user.password === password){
                done(null, user);
            } else {
                done(null, false, {message: 'Wrong username or password'});
            }
        });
    });
    //This checks for existence of username, and whether password matches

}));

var server = app.listen(3000, function(){
    var port = server.address().port;
    console.log('Listening on port', port);
});