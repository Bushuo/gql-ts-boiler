import { GraphQLServer } from 'graphql-yoga';
import { createTypeormConnection } from './utils/createTypeormConnection';
import { redis } from './redis';
import { confirmEmail } from './routes/confirmEmail';
import { genSchema } from './utils/generateSchema';

export const startServer = async () => {
    await createTypeormConnection();

    const server = new GraphQLServer({
        schema: genSchema(),
        context: ({ request }) => ({
            redis,
            url: request.protocol + '://' + request.get('host')
        })
    });

    server.express.get('/confirm/:id', confirmEmail);

    const app = await server.start({
        port: process.env.NODE_ENV === 'test' ? 0 : 4000
    });
    console.log('server is running on localhost:4000');

    return app;
};
