import 'reflect-metadata';
import 'dotenv/config';

import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import { GraphQLServer } from 'graphql-yoga';
import { createTypeormConnection } from './utils/createTypeormConnection';
import { redis } from './redis';
import { confirmEmail } from './routes/confirmEmail';
import { genSchema } from './utils/generateSchema';

const RedisStore = connectRedis(session);

export const startServer = async () => {
    await createTypeormConnection();

    const server = new GraphQLServer({
        schema: genSchema(),
        context: ({ request }) => ({
            redis,
            session: request.session,
            url: request.protocol + '://' + request.get('host')
        })
    });

    server.express.use(
        session({
            store: new RedisStore({ client: redis }),
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
