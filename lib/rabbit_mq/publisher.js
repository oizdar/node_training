'use strict';

const _ = require('lodash')
    , debug = require('debug')('RabbitMq2:Publisher');

class Publisher {
    /**
     * @param {object} params
     * @param {Channel} params.channel
     * @param {string} params.exchange
     */
    constructor(params) {
        this.channel = params.channel;
        this.exchange = params.exchange;
    }

    /**
     * @param {string} routingKey
     * @param {object} data
     * @param {object} options
     * @param {number} [options.deliveryMode=2]
     * @param {string} [options.contentType='application/json']
     * @param {boolean} [options.mandatory=true]
     * @param {function} cb
     */
    publish(routingKey, data, options, cb) {
        const
            strMessage = JSON.stringify(data)
            , content = Buffer.from(strMessage, 'utf8')
            , publishOpts = _.merge({deliveryMode: 2, contentType: 'application/json', mandatory: true}
            , {
                deliveryMode: options.deliveryMode,
                contentType: options.contentType,
                mandatory: options.mandatory
            });

        this.channel.publish(this.exchange, routingKey, content, publishOpts, (err/*, ok*/) => {
            if (err) {
                debug(`Message can't be published: ${err.message}`);
                return cb(err);
            }

            debug(`Message published: ${strMessage}`);

            cb(null);
        });
    }
}

module.exports = Publisher;
