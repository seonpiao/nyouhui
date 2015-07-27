var Mongo = require('carrier-mongo');

Mongo.init = function(config) {
  Mongo.host = config.mongo.restHost;
  Mongo.hosts = config.mongo.hosts.split(',');
  Mongo.port = config.mongo.restPort;
  Mongo.db = config.mongo.defaultDB;
  Mongo.schemaDb = Mongo.db;
  Mongo.schemaCollection = config.mongo.collections.schema;
  Mongo.controlDb = Mongo.db;
  Mongo.controlCollection = config.mongo.collections.control;
};

module.exports = Mongo;
