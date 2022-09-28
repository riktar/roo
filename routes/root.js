'use strict'

const {isEmpty} = require("lodash");
module.exports = async function (fastify, opts) {

  fastify.get('/:type', async function (request, reply) {
    try {
      const data = await fastify.db.getData(`/${request.params.type}`);
      return data
    } catch (error) {
      return {}
    }
  })

  fastify.post('/:type', async function (request, reply) {
    const {type} = request.params
    const {key, step = {}, blockOnException = false} = request.body;
    try {
      await fastify.db.getData(`/${type}/${key}`);
      return fastify.httpErrors.badRequest('hook already registered');
    } catch (error) {
      await fastify.db.push(`/${type}/${key}`, { blockOnException, chain: [], }, true);
    }
    if(!isEmpty(step)) {
      const index = await fastify.db.getIndex(`/${type}/${key}/chain`, step.id);
      if (index > -1) return fastify.httpErrors.badRequest('This id already exists in chain')
      await fastify.db.push(`/${type}/${key}/chain[]`, step);
    }
    return fastify.db.getData(`/${type}/${key}`);
  })

  fastify.post('/:type/:key/step', async function (request, reply) {
    const {type, key} = request.params;
    const step = request.body || {};
    try {
      await fastify.db.getData(`/${type}/${key}`);
    } catch (error) {
      return fastify.httpErrors.badRequest('hook not registered');
    }
    const index = await fastify.db.getIndex(`/${type}/${key}/chain`, step.id);
    if (index > -1) return fastify.httpErrors.badRequest('This id already exists in chain')
    await fastify.db.push(`/${type}/${key}/chain[]`, step);
    return fastify.db.getData(`/${type}/${key}`);
  })

  fastify.delete('/:type/:key', async function (request, reply) {
    const {type, key} = request.params;
    return fastify.db.delete(`/${type}/${key}`);
  })

  fastify.get('/:type/:key/step/:id', async function (request, reply) {
    const {type, key, id} = request.params;
    const index = await fastify.db.getIndex(`/${type}/${key}/chain`, id);
    if (index > -1) {
      return fastify.db.getData(`/${type}/${key}/chain[${index}]`);
    } else return fastify.httpErrors.badRequest('This id does not exist in chain')
  })

  fastify.delete('/:type/:key/step/:id', async function (request, reply) {
    const {type, key, id} = request.params;
    const index = await fastify.db.getIndex(`/${type}/${key}/chain`, id);
    if (index > -1) {
      return fastify.db.delete(`/${type}/${key}/chain[${index}]`);
    } else return fastify.httpErrors.badRequest('This id does not exist in chain')
  })

  fastify.put('/:type/:key/step/:id', async function (request, reply) {
    const {type, key, id} = request.params;
    const index = await fastify.db.getIndex(`/${type}/${key}/chain`, id);
    if (index > -1) {
      return fastify.db.push(`/${type}/${key}/chain[${index}]`, request.body, true);
    } else return fastify.httpErrors.badRequest('This id does not exist in chain')
  })
}
