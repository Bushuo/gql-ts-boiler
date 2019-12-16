import { v4 } from 'uuid';
import { Redis } from 'ioredis';
// takes
// http://localhost:4000 or
// http://asite.com
// => url/confirm/<id>

export const createEmailConfirmationLink = async (
    url: string,
    userId: string,
    redis: Redis
) => {
    const id = v4();
    await redis.set(id, userId, 'ex', 24 * 60 * 60);
    return `${url}/confirm/${id}`;
};
