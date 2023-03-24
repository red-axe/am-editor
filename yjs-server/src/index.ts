import startServer from '@aomao/plugin-yjs-websocket/server'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV ?? 'development'}`),
})

startServer({
  persistenceOptions: {
    provider: 'mongodb',
    url: `${process.env.MONGO_URL}`,
  },
})
