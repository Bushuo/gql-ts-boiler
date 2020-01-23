import * as faker from 'faker';
import * as bcrypt from 'bcryptjs';

import { User } from '../../../entity/User';
import {
    duplicateEmail,
    emailNotLongEnough,
    invalidEmail,
    passwordNotLongEnough
} from './errorMessages';
import { Connection } from 'typeorm';
import { TestClient } from '../../../utils/testClient';
import { createTestConnection } from '../../../testUtils/createTestConnection';

let conn: Connection;
faker.seed(Date.now() * Math.random());

const email = faker.internet.email();
const password = faker.internet.password();

beforeAll(async () => {
    conn = await createTestConnection();
});
afterAll(async () => {
    conn.close();
});

describe('register user', () => {
    it('successful registration', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        const response = await client.register(email, password);
        expect(response.data).toEqual({ register: null });

        // check for successful registration
        const users = await User.find({ where: { email } });
        expect(users).toHaveLength(1);
        const user = users[0];
        expect(user.email).toEqual(email);
        const correctPassword = await bcrypt.compare(password, user.password);
        expect(correctPassword).toBeTruthy();
    });

    it('duplicate emails', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        const response = await client.register(email, password);
        expect(response.data.register).toHaveLength(1);
        expect(response.data.register[0]).toEqual({
            path: 'email',
            message: duplicateEmail
        });
    });

    it('bad email', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        const response = await client.register('a', password);

        expect(response.data).toEqual({
            register: [
                { path: 'email', message: emailNotLongEnough },
                { path: 'email', message: invalidEmail }
            ]
        });
    });

    it('bad password', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        const response = await client.register(email, 'ab');
        expect(response.data).toEqual({
            register: [{ path: 'password', message: passwordNotLongEnough }]
        });
    });

    it('bad password & bad email', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);

        const response = await client.register('a', 'ad');
        expect(response.data).toEqual({
            register: [
                { path: 'email', message: emailNotLongEnough },
                { path: 'email', message: invalidEmail },
                { path: 'password', message: passwordNotLongEnough }
            ]
        });
    });
});
