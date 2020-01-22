import { Connection } from 'typeorm';
import { createTypeormConnection } from '../../utils/createTypeormConnection';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testclient';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';
import * as Redis from 'ioredis';
import { forgotPasswordLockAccount } from '../../utils/forgotPasswordlockAccount';
import { forgotPasswordLockedError } from '../login/errorMessages';
import { passwordNotLongEnough } from '../register/errorMessages';
import { forgotPasswordExpiredKeyError } from './errorMessages';

const email = 'forgotPassword@test.com';
const password = 'akjbuaoe878324';
const newPassword = 'asdfh18973bfa';
let conn: Connection;
const redis = new Redis();
let userId: string;
beforeAll(async () => {
    conn = await createTypeormConnection();
    const user = await User.create({
        email: email,
        password: password,
        confirmed: true
    }).save();
    userId = user.id;
});

afterAll(async () => {
    if (conn) conn.close();
});

describe('forgot password', () => {
    test('check functionality', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        // basically forgot password link functionality
        await forgotPasswordLockAccount(userId, redis);
        const url = await createForgotPasswordLink('', userId, redis);
        const key = url.split('/').pop();

        // make sure no login after locket account
        expect((await client.login(email, password)).data).toEqual({
            login: [
                {
                    path: 'email',
                    message: forgotPasswordLockedError
                }
            ]
        });

        // try changing to too short password
        expect(
            (await client.forgotPasswordChange('ab', key as string)).data
        ).toEqual({
            forgotPasswordChange: [
                {
                    path: 'newPassword',
                    message: passwordNotLongEnough
                }
            ]
        });

        const response = await client.forgotPasswordChange(
            newPassword,
            key as string
        );
        expect(response.data).toEqual({
            forgotPasswordChange: null
        });

        // make sure redis key expires after use
        expect(
            (
                await client.forgotPasswordChange(
                    'aalkskjd1231afs',
                    key as string
                )
            ).data
        ).toEqual({
            forgotPasswordChange: [
                {
                    path: 'key',
                    message: forgotPasswordExpiredKeyError
                }
            ]
        });

        expect((await client.login(email, newPassword)).data).toEqual({
            login: null
        });
    });
});
