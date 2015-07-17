var Mongo = require('carrier-mongo');

Mongo.init = function(app) {
  Mongo.host = app.config.mongo.host;
  Mongo.hosts = app.config.mongo.replset.split(',');
  Mongo.port = app.config.mongo.port;
  Mongo.db = app.config.mongo.defaultDB;
  Mongo.schemaDb = app.config.schema.db;
  Mongo.schemaCollection = app.config.schema.collection;
  Mongo.controlDb = app.config.control.db;
  Mongo.controlCollection = app.config.control.collection;
};

module.exports = Mongo;
