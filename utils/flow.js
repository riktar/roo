// const {JsonPlaceholderReplacer} = require("json-placeholder-replacer");
import _ from "lodash";
import {request} from "undici";

const {isEmpty} = _;

export const executeStep = async (step, args, fastify) => {
  const {request: requestInfo} = step;
  const {protocol} = requestInfo;
  if (protocol === 'http') {
    return httpStep(requestInfo, args, fastify);
  }
}

export const httpStep = async (requestInfo, args, fastify) => {
  const {endpoint, method, headers} = requestInfo;
  const opts = {method}
  const body = args.length > 0 ? {args: [args[args.length - 1]]} : {args: []};
  if (headers && !isEmpty(headers)) opts.headers = {...headers, 'Content-Type': 'application/json'};
  else {
    opts.headers = {'Content-Type': 'application/json'};
  }

  if (body && !isEmpty(body)) opts.body = JSON.stringify(body);
  console.log('opts', opts)

  const res = await request(endpoint, opts);
  return res.body.json();
}