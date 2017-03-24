let request = require('request')
    , uuid = require('uuid/v1')
    , async = require('async');

let user = {
    password: "password",
    firstname: "test",
    lastname: "test",
};

function sendRequestTo(path, next) {
    user.email = uuid();
    const url = require('url').resolve('http://localhost:3000', path);
    const opts = {
        method: 'POST',
        json: {
            email: user.email,
            password: user.password,
            firstname: user.firstname,
            lastname: user.lastname

        },
        url
    };
    request(opts, (error, response, body) => {
        if(error) {
            console.error(`${path} - auth service request error: ${error}`);
        }
        if(response.statusCode !== 201) {
            console.error(`${path} - user create error: ${response.body.message}`);
        }
        return next(null);
    });

}
function sendXTimes(path, x) {
    let start = new Date().getTime();
    async.times(x,(n, next) => {
        let x = path;
        sendRequestTo(x, next);
    }, (err) => {
        let time = new Date().getTime() - start;
        console.log(`Request ${path} (${x} times taken: ${time}ms)`);
    });


}
let arg = parseInt(process.argv.slice(2)[0]);

if(arg === 1 ) {
    sendXTimes('/users', 50);
}
if(arg === 2) {
    sendXTimes('/users2', 50);
}
