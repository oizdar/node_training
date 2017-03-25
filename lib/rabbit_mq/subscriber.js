'use strict';

const _ = require('lodash')
    , Ack = require('./ack')
    , debug = require('debug')('RabbitMq2:Subscriber');

class Subscriber {
    /**
     * @param {object} params
     * @param {Channel} params.channel
     * @param {string} params.queue
     */
    constructor(params) {
        this.channel = params.channel;
        this.queue = params.queue;
        this.msgHandler = (msg, headers, deliveryInfo, ack) => {
        };
    }

    /**
     * @param {object} options
     * @param {boolean} [options.ack=true]
     * @param {number} [options.prefetchCount=100]
     * @param {function} onMessage
     */
    subscribe(options, onMessage) {
        const opts = _.merge({ack: true, prefetchCount: 100}, options);

        this.channel.prefetch(opts.prefetchCount);
        this.msgHandler = onMessage;

        this.channel.consume(this.queue, this.onMessage.bind(this), {noAck: !opts.ack});
    }

    /**
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
    onMessage(msg) {
        debug(`Got raw message`, JSON.stringify(msg));

        let parsedMsg;
        const rawMsg = msg.content.toString('utf8');

        try {
            parsedMsg = JSON.parse(rawMsg);
        } catch (err) {
            debug(`content is not json: ${rawMsg}`);
            parsedMsg = {};
        }

        this.msgHandler(parsedMsg, msg.properties.headers, msg.fields, new Ack(this.channel, msg));
    }
}

module.exports = Subscriber;
