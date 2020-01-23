import * as faker from 'faker';

import { Connection } from 'typeorm';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testClient';
import { createTestConnection } from '../../testUtils/createTestConnection';

let userId: string;
const email = faker.internet.email();
const password = faker.internet.password();
let conn: Connection;
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

describe('me', () => {
    test('return null if no cookie', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        const response = await client.me();

        expect(response.data.me).toBeNull();
    });

    test('get current user', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        await client.login(email, password);
        const response = await client.me();

        expect(response.data).toEqual({
            me: {
                id: userId,
                email
            }
        });
    });
});
