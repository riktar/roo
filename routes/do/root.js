'use strict'

const {orderBy} = require("lodash");
const {executeStep} = require("../../utils/flow");

module.exports = async function (fastify, opts) {
  fastify.post('/filters/:key', async function (request, reply) {
    const {key} = request.params
    let {args} = request.body;
    let hook = {}
    try {
      hook = await fastify.db.getData(`/filters/${key}`);
    } catch (error) {
      return {}
    }
    const orderedStep = orderBy(hook.chain, ['priority'], ['asc'])
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
    const {args} = request.body;
    let hook
    try {
      hook = await fastify.db.getData(`/aggregate/${key}`);
    } catch (error) {
      return []
    }
    const orderedStep = orderBy(hook.chain, ['priority'], ['asc'])
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
    const {args} = request.body;
    let hook
    try {
      hook = await fastify.db.getData(`/actions/${key}`);
    } catch (error) {
      return {success: false};
    }
    const orderedStep = orderBy(hook.chain, ['priority'], ['asc'])
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