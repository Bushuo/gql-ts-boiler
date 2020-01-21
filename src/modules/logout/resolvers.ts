import { ResolverMap } from '../../types/graphql-utils';
import { USER_SESSION_ID_PREFIX, REDIS_SESSION_PREFIX } from '../../constants';

export const resolvers: ResolverMap = {
    Query: {
        dummy: () => 'dummy'
    },
    Mutation: {
        logout: async (_, __, { session, redis }) => {
            const { userId } = session;
            if (userId) {
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

                return true;
            }
            return false;
        }
    }
};
