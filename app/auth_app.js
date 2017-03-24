var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var auth = require('../routes/auth');
var auth2 = require('../routes/auth2');

var app = express();

require('dotenv').config();

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/auth2', auth2);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
    const status = err.status || 500;

    res.status(status);
    res.send({status, message: err.message});
});

const debug = require('debug')('auth.js');

debug(`process.env`, {
    mongodb_uri: process.env.MONGODB_URI,
    team_name: process.env.TEAM_NAME,
});

module.exports = app;
