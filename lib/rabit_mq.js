'use strict';

const amqp = require('amqplib/callback_api')
    , async = require('async')
    , _ = require('lodash')
    , uuid = require('uuid')
    , debug = require('debug')('RabbitMq2')
    , Subscriber = require('./rabbit_mq/subscriber')
    , Publisher = require('./rabbit_mq/publisher')
;

class RabbitMq {
    /**
     * @param {object} config
     * @param {string} config.connectionUri
     * @param {object} config.options
     * @param {object} config.options.heartbeat
     */
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    /**
     * @param {function} cb
     */
    init(cb) {
        amqp.connect(this.config.connectionUri, this.config.options, (err, conn) => {
            if (err) {
                console.error(`RabbitMq connection error: ${err.message} - ${JSON.stringify(this.config)}`);
                return cb(err);
            }

            console.log(`RabbitMq:init - connected`);

            this.connection = conn;
            cb(null);

            process.once('SIGINT', function () {
                conn.close();
            });
        });
    }

    /**
     * @param {object} params
     * @param {object} params.exchange
     * @param {string} params.exchange.name
     * @param {string} params.exchange.type
     * @param {string} [params.exchange.autoDelete=false]
     * @param {string} [params.exchange.durable=true]
     * @param {object} params.queue
     * @param {string} params.queue.name
     * @param {string} [params.queue.durable=true]
     * @param {string} [params.queue.autoDelete=false]
     * @param {string} [params.queue.exclusive=false]
     * @param {string|string[]} params.routing
     * @param {function} cb
     */
    getSubscriber(params, cb) {
        const ctx = {id: `RabbitMq:getSubscriber:${uuid.v4()}`}
            , routingKeys = _.isString(params.routing) ? [params.routing] : params.routing
            , exchangeOpts = _.merge({autoDelete: false, durable: true}, {
                autoDelete: params.exchange.autoDelete,
                durable: params.exchange.durable
            })
            , queueOpts = _.merge({durable: true, autoDelete: false, exclusive: false}, {
                autoDelete: params.queue.autoDelete,
                durable: params.queue.durable,
                exclusive: params.queue.exclusive
            })
        ;

        async.waterfall([
            // create channel
            (next) => {
                this.connection.createChannel((err, ch) => {
                    if (err) {
                        return next(err);
                    }

                    console.log(`${ctx.id} - channel created`);

                    ctx.channel = ch;
                    return next(null);
                });
            },
            // create exchange
            (next) => {
                ctx.channel.assertExchange(params.exchange.name, params.exchange.type, exchangeOpts,
                    (err/*, ok*/) => {
                        if (err) {
                            return next(err);
                        }

                        console.log(`${ctx.id} - exchange ${params.exchange.name} created`);

                        next(null);
                    });
            },
            // create queue
            (next) => {
                ctx.channel.assertQueue(params.queue.name, queueOpts, (err/*, ok*/) => {
                    if (err) {
                        return next(err);
                    }

                    console.log(`${ctx.id} - queue ${params.queue.name} created`);

                    next(null);
                });
            },
            // create bindings
            (next) => {
                const bindOpts = {};

                async.eachSeries(routingKeys, (routingKey, done) => {
                    ctx.channel.bindQueue(params.queue.name, params.exchange.name, routingKey, bindOpts
                        , (err/*, ok*/) => {
                            if (err) {
                                return done(err);
                            }

                            console.log(`${ctx.id} - bound ${params.exchange.name}(${routingKey})` +
                                `-> ${params.queue.name}`);

                            done(null);
                        });
                }, next);
            }
        ], (err) => {
            if (err) {
                console.error(`${ctx.id} - error - ${err.message}`);
                return cb(err);
            }

            cb(null, new Subscriber({channel: ctx.channel, queue: params.queue.name}));
        });
    }

    /**
     * @param {object} params
     * @param {object} params.exchange
     * @param {string} params.exchange.name
     * @param {string} params.exchange.type
     * @param {string} [params.exchange.autoDelete=false]
     * @param {string} [params.exchange.durable=true]
     * @param {function} cb
     */
    getPublisher(params, cb) {
        const ctx = {id: `RabbitMq:getPublisher:${uuid.v4()}`}
            , exchangeOpts = _.merge({autoDelete: false, durable: true}, {
            autoDelete: params.exchange.autoDelete,
            durable: params.exchange.durable
        });

        async.waterfall([
            // create channel
            (next) => {
                this.connection.createConfirmChannel((err, ch) => {
                    if (err) {
                        return next(err);
                    }

                    console.log(`${ctx.id} - channel created`);

                    ctx.channel = ch;
                    ctx.channel.on('return', this.onReturn.bind(this));

                    return next(null);
                });
            },
            // create exchange
            (next) => {
                ctx.channel.assertExchange(params.exchange.name, params.exchange.type, exchangeOpts,
                    (err/*, ok*/) => {
                        if (err) {
                            return next(err);
                        }

                        console.log(`${ctx.id} - exchange ${params.exchange.name} created`);

                        next(null);
                    });
            }
        ], (err) => {
            if (err) {
                console.error(`${ctx.id} - error - ${err.message}`);
                return cb(err);
            }

            cb(null, new Publisher({channel: ctx.channel, exchange: params.exchange.name}));
        });
    }

    /**
     * Message in mandatory mode that can't be routed
     *
     * @param {object} msg
     * @param {Buffer} msg.content
     * @param {object} msg.fields
     * @param {string} msg.fields.consumerTag
     * @param {number} msg.fields.deliveryTag
     * @param {boolean} msg.fields.redelivered
     * @param {string} msg.fields.exchange
     * @param {string} msg.fields.routingKey
     * @param {object} msg.properties
     * @param {object} msg.properties.headers
     * @param {number} msg.properties.deliveryMode
     */
    onReturn(msg) {
        debug(`Returned raw message`, JSON.stringify(msg));

        const rawMsg = msg.content.toString('utf8');


        console.warn(`MESSAGE_CANT_BE_ROUTED ` +
            `- ${rawMsg} ` +
            `- ${JSON.stringify(msg.fields)} ` +
            `- ${JSON.stringify(msg.properties)}`);
    }
}

module.exports = RabbitMq;