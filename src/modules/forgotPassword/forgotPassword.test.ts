import * as Redis from 'ioredis';
import * as faker from 'faker';

import { Connection } from 'typeorm';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testClient';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';
import { forgotPasswordLockAccount } from '../../utils/forgotPasswordLockAccount';
import { forgotPasswordLockedError } from '../login/errorMessages';
import { passwordNotLongEnough } from '../register/errorMessages';
import { forgotPasswordExpiredKeyError } from './errorMessages';
import { createTestConnection } from '../../testUtils/createTestConnection';

const email = faker.internet.email();
const password = faker.internet.password();
const newPassword = faker.internet.password();
let conn: Connection;
const redis = new Redis();
let userId: string;
beforeAll(async () => {
    conn = await createTestConnection();
    const user = await User.create({
        email,
        password,
        confirmed: true
    }).save();
    userId = user.id;
});

afterAll(async () => {
    if (conn) {
        conn.close();
    }
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
