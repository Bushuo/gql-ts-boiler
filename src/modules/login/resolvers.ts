import * as bcrypt from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { User } from '../../entity/User';
import {
    invalidLogin,
    unconfirmedEmail,
    forgotPasswordLockedError
} from './errorMessages';
import { USER_SESSION_ID_PREFIX } from '../../constants';

const errorResponse = [
    {
        path: 'email',
        message: invalidLogin
    }
];

export const resolvers: ResolverMap = {
    Query: {
        dummy3: () => 'dummy'
    },
    Mutation: {
        login: async (
            _,
            { email, password }: GQL.ILoginOnMutationArguments,
            { session, redis, req }
        ) => {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return errorResponse;
            }

            if (!user.confirmed) {
                return [
                    {
                        path: 'email',
                        message: unconfirmedEmail
                    }
                ];
            }

            if (user.forgotPasswordLocked) {
                return [
                    {
                        path: 'email',
                        message: forgotPasswordLockedError
                    }
                ];
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return errorResponse;
            }

            // login successful
            session.userId = user.id;
            if (req.sessionID) {
                await redis.lpush(
                    `${USER_SESSION_ID_PREFIX}${user.id}`,
                    req.sessionID
                );
            }

            return null;
        }
    }
};
