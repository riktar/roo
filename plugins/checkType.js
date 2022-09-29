import fp from 'fastify-plugin'

export default fp(async function (fastify, opts) {
  const validType = ['filters', 'aggregate', 'actions']

  fastify.addHook('preHandler', (request, reply, done) => {
    const {type} = request.params;
    if (!type) {
      done()
      return
    }
    if (!validType.includes(type)) throw new Error('Invalid type for hook: supported types are: filters, aggregate, actions')
    done()
  })
})
