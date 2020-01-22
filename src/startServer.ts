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
import { genSchema } from './utils/generateSchema';
import { REDIS_SESSION_PREFIX } from './constants';

// tslint:disable-next-line: variable-name
const RedisStore = connectRedis(session);

export const startServer = async () => {
    await createTypeormConnection();

    const server = new GraphQLServer({
        schema: genSchema(),
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
