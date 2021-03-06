import 'reflect-metadata';
import 'dotenv/config';

import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import { GraphQLServer } from 'graphql-yoga';
import { createTypeormConnection } from './utils/createTypeormConnection';
import { redis } from './redis';
import { confirmEmail } from './routes/confirmEmail';
import { generateSchema } from './utils/generateSchema';
import { REDIS_SESSION_PREFIX } from './constants';
import { createTestConnection } from './testUtils/createTestConnection';

// tslint:disable-next-line: variable-name
const RedisStore = connectRedis(session);

export const startServer = async () => {
    if (process.env.NODE_ENV === 'test') {
        const p1 = createTestConnection(true);
        const p2 = redis.flushall();
        await Promise.all([p1, p2]);
    } else {
        try {
            await createTypeormConnection();
        } catch (error) {
            console.log(error);
            return;
        }
    }

    const server = new GraphQLServer({
        schema: generateSchema(),
        context: ({ request }) => ({
            redis,
            url: request.protocol + '://' + request.get('host'),
            session: request.session,
            req: request
        })
    });

    server.express.use(
        new RateLimit({
            store: new RateLimitRedisStore({ client: redis }),
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100
        })
    );

    server.express.use(
        session({
            store: new RedisStore({
                client: redis,
                prefix: REDIS_SESSION_PREFIX
            }),
            name: 'qid',
            secret: process.env.SESSION_SECRET as string,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            }
        })
    );

    const cors = {
        credentails: true,
        origin:
            process.env.NODE_ENV === 'test'
                ? '*'
                : (process.env.FRONTEND_URI as string)
    };

    server.express.get('/confirm/:id', confirmEmail);

    const app = await server.start({
        cors,
        port: process.env.NODE_ENV === 'test' ? 0 : 4000
    });
    console.log('server is running on localhost:4000');

    return app;
};
