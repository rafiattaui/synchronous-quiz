import dotenv from 'dotenv';
dotenv.config();

export const conf = {
  REDIS_URL: process.env.REDIS_URL,
};
