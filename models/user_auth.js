'use strict';

const mongoose = require('mongoose')
    , _ = require('lodash')
    , Schema = mongoose.Schema
    , schema = new Schema(
    {
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        createdAt: {type: Date},
        updatedAt: {type: Date}
    },
    {collection: `user_auth`}
);

schema.pre('save', function (next) {
    const now = new Date();

    if (this.isNew) {
        this.createdAt = now;
    }

    this.updatedAt = now;

    next();
});

module.exports = mongoose.model('UserAuth', schema);

