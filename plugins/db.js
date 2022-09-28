'use strict'

const fp = require('fastify-plugin')
const { JsonDB, Config } = require('node-json-db');

module.exports = fp(async function (fastify, opts) {
  const db = new JsonDB(new Config("db", true, false, '/'));
  fastify.decorate('db', db)
})
