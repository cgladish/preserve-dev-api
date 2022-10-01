import { createClient } from "redis";

const client = createClient({
  url: process.env.REDISCLOUD_URL,
});
const connect = client.connect();

const getRedisClient = async () => {
  await connect;
  return client;
};

export default getRedisClient;
