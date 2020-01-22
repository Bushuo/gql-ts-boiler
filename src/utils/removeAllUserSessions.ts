import { Redis } from 'ioredis';
import { USER_SESSION_ID_PREFIX, REDIS_SESSION_PREFIX } from '../constants';

export const removeAllUserSessions = async (userId: string, redis: Redis) => {
    const sessionIds = await redis.lrange(
        `${USER_SESSION_ID_PREFIX}${userId}`,
        0,
        -1
    );

    let promises: Promise<number>[] = [];
    sessionIds.forEach(s => {
        promises.push(redis.del(`${REDIS_SESSION_PREFIX}${s}`));
    });
    await Promise.all(promises);
};
