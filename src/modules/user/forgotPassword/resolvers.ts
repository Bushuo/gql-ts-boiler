import * as yup from 'yup';
import * as bcrypt from 'bcryptjs';

import { ResolverMap } from '../../../types/graphql-utils';
import { createForgotPasswordLink } from '../../../utils/createForgotPasswordLink';
import { forgotPasswordLockAccount } from '../../../utils/forgotPasswordLockAccount';
import { User } from '../../../entity/User';
import {
    userNotFoundError,
    forgotPasswordExpiredKeyError
} from './errorMessages';
import { FORGOT_PASSWORD_PREFIX } from '../../../constants';
import { registerPasswordValidation } from '../../../yupSchemas';
import { formatYupError } from '../../../utils/formatYupError';

const schema = yup.object().shape({
    newPassword: registerPasswordValidation
});

export const resolvers: ResolverMap = {
    Mutation: {
        sendForgotPasswordEmail: async (
            _,
            { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
            { redis }
        ) => {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                // Maybe rethink this.
                // Or someone could try and guess the user account names
                return [
                    {
                        path: 'email',
                        message: userNotFoundError
                    }
                ];
            }

            await forgotPasswordLockAccount(user.id, redis);

            // @todo add frontend url
            await createForgotPasswordLink('', user.id, redis);
            // @todo send email with url
            return true;
        },
        forgotPasswordChange: async (
            _,
            { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
            { redis }
        ) => {
            const redisKey = `${FORGOT_PASSWORD_PREFIX}${key}`;
            const userId = await redis.get(redisKey);
            if (!userId) {
                return [
                    {
                        path: 'key',
                        message: forgotPasswordExpiredKeyError
                    }
                ];
            }

            try {
                await schema.validate({ newPassword }, { abortEarly: false });
            } catch (err) {
                return formatYupError(err);
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updatePromise = User.update(
                { id: userId },
                {
                    forgotPasswordLocked: false,
                    password: hashedPassword
                }
            );

            const delteKeyPromise = redis.del(redisKey);

            await Promise.all([updatePromise, delteKeyPromise]);

            return null;
        }
    }
};
