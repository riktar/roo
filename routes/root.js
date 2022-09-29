import _ from "lodash";

const {isEmpty, set} = _;
export default async function (fastify, opts) {

  fastify.get('/:type', async function (request, reply) {
    const {type} = request.params;
    try {
      const db = await fastify.db();
      return db.data[type]
    } catch (error) {
      return {}
    }
  })

  fastify.post('/:type', async function (request, reply) {
    const db = await fastify.db();
    const {type} = request.params
    const {key, step = {}, blockOnException = false} = request.body;
    if (db.chain.get(`${type}.${key}`).value()) {
      return fastify.httpErrors.badRequest('hook already registered');
    } else {
      set(db.data, `${type}.${key}`, {chain: [], blockOnException})
      await db.write()
    }
    if(!isEmpty(step)) {
      const index = db.chain.get(`${type}.${key}.chain`).findIndex(['id', step.id]).value();
      if (index > -1) return fastify.httpErrors.badRequest('This id already exists in chain')
      db.data[type][key].chain.push(step)
      await db.write()
    }
    return db.chain.get(`${type}.${key}`).value()
  })

  fastify.post('/:type/:key/step', async function (request, reply) {
    const {type, key} = request.params;
    const db = await fastify.db();
    const step = request.body || {};
    if(!db.chain.get(`${type}.${key}`, null).value()) {
      return fastify.httpErrors.badRequest('hook not registered');
    }
    const index = db.chain.get(`${type}.${key}.chain`).findIndex(['id', step.id]).value();
    if (index > -1) return fastify.httpErrors.badRequest('This id already exists in chain')
    db.data[type][key].chain.push(step)
    await db.write()
    return db.chain.get(`${type}.${key}`).value()
  })

  fastify.delete('/:type/:key', async function (request, reply) {
    const {type, key} = request.params;
    const db = await fastify.db();
    if(db.chain.get(`${type}.${key}`, null).value()) {
      delete db.data[type][key]
      await db.write()
    }
    return db.data[type]
  })

  fastify.get('/:type/:key/step/:id', async function (request, reply) {
    const {type, key, id} = request.params;
    const db = await fastify.db();
    const index = db.chain.get(`${type}.${key}.chain`).findIndex(['id', id]).value();
    if (index > -1) {
      return db.chain.get(`${type}.${key}.chain[${index}]`);
    } else return fastify.httpErrors.badRequest('This id does not exist in chain')
  })

  fastify.delete('/:type/:key/step/:id', async function (request, reply) {
    const {type, key, id} = request.params;
    const db = await fastify.db();
    const index = db.chain.get(`${type}.${key}.chain`).findIndex(['id', id]).value();
    if (index > -1) {
      db.data[type][key].chain.splice(index, 1)
      await db.write()
      return
    } else return fastify.httpErrors.badRequest('This id does not exist in chain')
  })

  fastify.put('/:type/:key/step/:id', async function (request, reply) {
    const {type, key, id} = request.params;
    const db = await fastify.db();
    const index = db.chain.get(`${type}.${key}.chain`).findIndex(['id', id]).value();
    if (index > -1) {
      set(db.data, `${type}.${key}.chain[${index}]`, request.body)
      await db.write()
      return db.chain.get(`${type}.${key}.chain[${index}]`).value()
    } else return fastify.httpErrors.badRequest('This id does not exist in chain')
  })
}
