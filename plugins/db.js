import fp from 'fastify-plugin'
import { join, dirname  } from 'path'
import { Low, JSONFile } from 'lowdb'
import lodash from 'lodash'
import { fileURLToPath } from 'url'

export default fp(async function (fastify, opts) {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  class LowWithLodash extends Low {
    chain = lodash.chain(this).get('data')
  }

  const connection = async () => {
    const file = join(`${__dirname}/../`, 'db.json')
    const adapter = new JSONFile(file)
    const db = new LowWithLodash(adapter)
    await db.read()
    return db
  }

  fastify.decorate('db', connection)
})
