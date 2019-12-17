import * as bcrypt from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { User } from '../../entity/User';
import { invalidLogin, unconfirmedEmail } from './errorMessages';

const errorResponse = [
    {
        path: 'email',
        message: invalidLogin
    }
];

export const resolvers: ResolverMap = {
    Query: {
        dummy2: () => 'dummy'
    },
    Mutation: {
        login: async (
            _,
            { email, password }: GQL.ILoginOnMutationArguments
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

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return errorResponse;
            }

            return null;
        }
    }
};
