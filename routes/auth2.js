var express = require('express')
    , router = express.Router()
    , async = require('async');


router.post('/', function(req, res, next) {
    const db = req.app.get('db')
        , UserAuth = db.getModel('user_auth')
        , userAuth = new UserAuth(req.body);

    async.waterfall([
        (next) => {
            userAuth.save((err) => {
                let httpCode = 201;
                let message = 'User registered';

                if(err) {
                    if(err.code === db.ERR_CODES.DUPLICATE_KEY_ERROR) {
                        httpCode = 422;
                        message = 'Email exists';
                        console.log(err.message);
                        res.status(httpCode).send({httpCode, message});
                    } else {
                        httpCode = 500;
                        message = 'Database error';
                        console.log(err.message);
                        res.status(httpCode).send({httpCode, message});
                    }
                    return next(null);
                }
                    res.status(httpCode).send({httpCode, message});
                    next(null);

            });
        }
    ], (err) => {
            if (err) {
                process.exit(1);
            }
            console.log(`SAVE AUTH PASSWORD ERROR`);
        }
    )

});
module.exports = router;
