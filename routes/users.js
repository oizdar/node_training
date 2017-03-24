var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('User registered');
});

router.post('/', function(req, res, next) {
    const db = req.app.get('db')
        , UserView = db.getModel('user_view')
        , userView = new UserView(req.body)
    ;
    async.waterfall([
        (next) => {
            userView.save( (err) => {
                if(err) {
                    if(err.code === db.ERR_CODES.DUPLICATE_KEY_ERROR) {
                        status = 422;
                        message = 'Email exists';
                        console.log(err.message);
                    } else {
                        status = 500;
                        message = 'Database error';
                        console.log(err.message);
                    }
                    err.httpCode = status;
                    err.httpMessage = message;
                    return next(err);
                }
                console.log('User registered');
                next(null)
            })
        },
        (next) => {
            const url = require('url').resolve(process.env.AUTH_BASE, '/auth');
            const opts = {
                method: 'POST',
                json: {
                    username: req.body.email,
                    password: req.body.password
                },
                url
            };
            request(opts, (error, response, body) => {
                if(error) {
                    console.error('users.js auth service request error: '+error);
                    let err = {
                        httpCode: 500,
                        httpMessage: 'INTERNAL SERVER ERROR'
                    }
                    return next(err)
                }
                if(response.statusCode !== 201) {
                    const err = {
                        httpCode: response.statusCode,
                        httpMessage: body.message
                    }
                    next(err);
                }
                next(null);
            });
        }], (err) => {
            if (err) {
                console.log(err);
                res.status(err.httpCode).send({status: err.httpCode, message: err.httpMessage})
                return;
            }
            let status = 201
            , message = 'User registered';
            console.log('Password hashed.')
            res.status(status).send({status, message});
        }
    );
});

module.exports = router;

