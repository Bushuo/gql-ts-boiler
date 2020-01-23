import 'reflect-metadata';
import 'dotenv/config';

import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import * as passport from 'passport';
import { Strategy } from 'passport-twitter';
import { GraphQLServer } from 'graphql-yoga';
import { createTypeormConnection } from './utils/createTypeormConnection';
import { redis } from './redis';
import { confirmEmail } from './routes/confirmEmail';
import { genSchema } from './utils/generateSchema';
import { REDIS_SESSION_PREFIX } from './constants';
import { User } from './entity/User';

// tslint:disable-next-line: variable-name
const RedisStore = connectRedis(session);

export const startServer = async () => {
    const con = await createTypeormConnection();

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

    passport.use(
        new Strategy(
            {
                consumerKey: process.env.TWITTER_CONSUMER_KEY as string,
                consumerSecret: process.env.TWITTER_CONSUMER_SECRET as string,
                callbackURL: 'http://localhost:4000/auth/twitter/callback',
                includeEmail: true
            },
            async (_, __, profile, done) => {
                console.log(profile);
                const { id, emails } = profile;

                const query = con
                    .getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.twitterId = :id', { id });
                let email: string | null = null;

                if (emails) {
                    email = emails[0].value;
                    query.orWhere('user.email = :email', { email });
                }
                let user = await query.getOne();

                if (!user) {
                    user = await User.create({
                        twitterId: id,
                        email
                    }).save();
                } else if (!user.twitterId) {
                    // we found user by email => already registered but not with twitter OAuth
                    user.twitterId = id;
                    await user.save();
                } else {
                    // we have twitterId
                    // login
                }

                return done(null, { id: user.id });
            }
        )
    );

    server.express.use(passport.initialize());

    server.express.get('/auth/twitter', passport.authenticate('twitter'));
    server.express.get(
        '/auth/twitter/callback',
        passport.authenticate('twitter', { session: false }),
        (req, res) => {
            (req.session as any).userId = (req.user as any).id;
            // @todo successful authentication, redirect to frontend
            res.redirect('/');
        }
    );

    const app = await server.start({
        cors,
        port: process.env.NODE_ENV === 'test' ? 0 : 4000
    });
    console.log('server is running on localhost:4000');

    return app;
};
