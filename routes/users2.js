var express = require('express')
    , router = express.Router()
    , request = require('request')
    , async = require('async')
    , bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('User registered');
});

router.post('/', function(req, res, next) {
    const db = req.app.get('db')
        , UserView = db.getModel('user_view')
        , userView = new UserView(req.body)
    ;
    console.log(req.body);
    async.waterfall([
        (next) => {
            return userView.save( (err) => {
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
                return next(null);
            })
        },
        (next) => {
            bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                if(err) {
                    err.httpCode = 500;
                    err.httpMessage = 'Database error';
                    return next(err);
                }
                req.body.password = hashedPassword;
            });
            return next(null)
        },
        (next) => {
            const url = require('url').resolve(process.env.AUTH_BASE, '/auth2');
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

