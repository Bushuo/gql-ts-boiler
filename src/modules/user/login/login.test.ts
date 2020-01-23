import * as faker from 'faker';

import { unconfirmedEmail, invalidLogin } from './errorMessages';
import { User } from '../../../entity/User';
import { Connection } from 'typeorm';
import { TestClient } from '../../../utils/testClient';
import { createTestConnection } from '../../../testUtils/createTestConnection';

const email = faker.internet.email();
const password = faker.internet.password();

let conn: Connection;
beforeAll(async () => {
    conn = await createTestConnection();
});
afterAll(async () => {
    conn.close();
});

const loginExpectError = async (
    client: TestClient,
    e: string,
    p: string,
    errMsg: string
) => {
    const response = await client.login(e, p);
    expect(response.data).toEqual({
        login: [
            {
                path: 'email',
                message: errMsg
            }
        ]
    });
};

describe('login', () => {
    it('error with invalid email', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);
        await client.register(email, password);
        await loginExpectError(
            client,
            'something@test.com',
            password,
            invalidLogin
        );
    });

    it('error before confirmation', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);
        await loginExpectError(client, email, password, unconfirmedEmail);
    });

    it('error with invalid password', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);
        await User.update({ email }, { confirmed: true });

        await loginExpectError(client, email, 'abcdeft123', invalidLogin);
    });

    it('successful login', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);
        const response = await client.login(email, password);
        expect(response.data).toEqual({
            login: null
        });
    });
});
