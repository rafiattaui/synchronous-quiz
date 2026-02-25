import * as qi from '../quizinterface.ts';
import { conf } from '../lib/conf.ts';
import { createClient } from 'redis';

const url = conf.REDIS_URL;

let client: ClientType | null = null;

type ClientType = ReturnType<typeof createClient>;

/*
 * Singleton function for Redis client dependency
 * Initializes the redis client if it has not been initialized.
 */
export async function getRedisClient(): Promise<ClientType> {
  if (!url) {
    throw new Error('REDIS_URL environment variable undefined!');
  }

  if (!client) {
    client = createClient({ url });
    client.on('error', (err) => console.error('Redis Client Error:', err));
  }

  if (!client.isReady) {
    await client.connect();
  }

  return client;
}
