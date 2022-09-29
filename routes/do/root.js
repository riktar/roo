import {executeStep} from "../../utils/flow.js";

export default async function (fastify, opts) {
  fastify.post('/filters/:key', async function (request, reply) {
    const {key} = request.params
    const db = await fastify.db();
    let {args} = request.body;
    let hook = db.chain.get(`filters.${key}`, null).value();
    if (!hook) return {}
    const orderedStep = db.chain.get(`filters.${key}.chain`).orderBy(['priority'], ['asc']).value();

    let lastOutput = {}
    for (const step of orderedStep) {
      try {
        lastOutput = await executeStep(step, args, fastify);
        args = [...args, lastOutput]
      } catch (error) {
        console.error(error)
        if (hook?.blockOnException) return fastify.httpErrors.badRequest(`Exception in step ${step.id}: ${error.message}`);
      }

    }
    return args[args.length - 1];
  })

  fastify.post('/aggregate/:key', async function (request, reply) {
    const {key} = request.params
    const db = await fastify.db();
    let {args} = request.body;
    let hook = db.chain.get(`aggregate.${key}`, null).value();
    if (!hook) return {}
    const orderedStep = db.chain.get(`aggregate.${key}.chain`).orderBy(['priority'], ['asc']).value();
    let output = []
    for (const step of orderedStep) {
      try {
        const stepOutput = await executeStep(step, args, fastify);
        console.log('out', stepOutput)
        output = [...output, stepOutput];
      } catch (error) {
        console.error(error)
        if (hook?.blockOnException) return fastify.httpErrors.badRequest(`Exception in step ${step.id}: ${error.message}`);
        output = [...output, {error: error.message}]
      }
    }
    return output;
  })

  fastify.post('/actions/:key', async function (request, reply) {
    const {key} = request.params
    const db = await fastify.db();
    let {args} = request.body;
    let hook = db.chain.get(`actions.${key}`, null).value();
    if (!hook) return {}
    const orderedStep = db.chain.get(`actions.${key}.chain`).orderBy(['priority'], ['asc']).value();
    for (const step of orderedStep) {
      try {
        await executeStep(step, args, fastify)
      } catch (error) {
        console.error(error)
        if (hook?.blockOnException) return fastify.httpErrors.badRequest(`Exception in step ${step.id}: ${error.message}`);
      }
    }
    return {success: true};
  })
}