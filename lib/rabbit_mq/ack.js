'use strict';

const _ = require('lodash')
    , debug = require('debug')('RabbitMq2:Ack')
    ;

class Ack {
    /**
     * @param {Channel} channel
     * @param {object} msg
     */
    constructor(channel, msg) {
        this.channel = channel;
        this.msg = msg;
    }

    /**
     * @param {boolean} [requeue=true]
     */
    reject(requeue) {
        debug(`Reject(requeue=${requeue})`);

        this.channel.nack(
            this.msg,
            false,
            _.isBoolean(requeue) ? requeue : true
        );
    }

    /**
     * @param {boolean} [all=false]
     */
    acknowledge(all) {
        debug(`Acknowledge(all=${all})`);

        if (all) {
            return this.channel.ackAll();
        }

        this.channel.ack(this.msg);
    }
}

module.exports = Ack;
