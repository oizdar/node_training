'use strict';

const mongoose = require('mongoose')
    , path = require('path')
    , _ = require('lodash')
    , debug = require('debug')(`mongo_db`)
    ;

class MongoDb {
    /**
     * @param {object} config
     * @param {string} config.connectionUri
     * @param {string} config.modelDir
     */
    constructor(config) {
        this.config = config;

        this.ERR_CODES = {
            DUPLICATE_KEY_ERROR: 11000
        };
    }

    /**
     * @param {function} cb
     */
    init(cb) {
        mongoose.Promise = global.Promise;
        mongoose.connect(this.config.connectionUri);

        mongoose.connection.once('connected', cb);
        mongoose.connection.once('error', cb);

        mongoose.connection.on('connecting', this.onDebug.bind(this, 'connecting'));
        mongoose.connection.on('connected', this.onDebug.bind(this, 'connected'));
        mongoose.connection.on('open', this.onDebug.bind(this, 'open'));
        mongoose.connection.on('disconnecting', this.onDebug.bind(this, 'disconnecting'));
        mongoose.connection.on('disconnected', this.onDebug.bind(this, 'disconnected'));
        mongoose.connection.on('close', this.onDebug.bind(this, 'close'));
        mongoose.connection.on('reconnected', this.onDebug.bind(this, 'reconnected'));
        mongoose.connection.on('error', this.onDebug.bind(this, 'error'));
        mongoose.connection.on('fullsetup', this.onDebug.bind(this, 'fullsetup'));
    }

    onDebug(name) {
        debug(`MongoDb event: ${name}`);
    }

    getConnection() {
        return mongoose.connection;
    }

    getCollections(cb) {
        mongoose.connection.db.listCollections().toArray(cb);
    }

    getModel(name) {
        return require(path.join(this.config.modelDir, _.snakeCase(name)));
    }
}

module.exports = MongoDb;
