import { request } from 'graphql-request';
import { User } from '../../entity/User';
import * as bcrypt from 'bcryptjs';
import {
    duplicateEmail,
    emailNotLongEnough,
    invalidEmail,
    passwordNotLongEnough
} from './errorMessages';
import { createTypeormConnection } from '../../utils/createTypeormConnection';

const email = 'register@test.test';
const password = 'asdbf&dvjb2123';

const mutation = (e: string, p: string) => `
    mutation {
        register(email: "${e}", password: "${p}") {
            path
            message
        }
    }
`;

beforeAll(async () => {
    await createTypeormConnection();
});

describe('register user', () => {
    it('successful registration', async () => {
        // register a user
        const response = await request(
            process.env.TEST_HOST as string,
            mutation(email, password)
        );
        expect(response).toEqual({ register: null });
        // check for successful registration
        const users = await User.find({ where: { email } });
        expect(users).toHaveLength(1);
        const user = users[0];
        expect(user.email).toEqual(email);
        const correctPassword = await bcrypt.compare(password, user.password);
        expect(correctPassword).toBeTruthy();
    });

    it('duplicate emails', async () => {
        // test for duplicate emails
        const response = await request(
            process.env.TEST_HOST as string,
            mutation(email, password)
        );
        expect(response.register).toHaveLength(1);
        expect(response.register[0]).toEqual({
            path: 'email',
            message: duplicateEmail
        });
    });

    it('bad email', async () => {
        // catch bad email
        const response = await request(
            process.env.TEST_HOST as string,
            mutation('a', password)
        );
        expect(response).toEqual({
            register: [
                { path: 'email', message: emailNotLongEnough },
                { path: 'email', message: invalidEmail }
            ]
        });
    });

    it('bad password', async () => {
        // catch bad password
        const response = await request(
            process.env.TEST_HOST as string,
            mutation(email, 'ad')
        );
        expect(response).toEqual({
            register: [{ path: 'password', message: passwordNotLongEnough }]
        });
    });

    it('bad password & bad email', async () => {
        // catch bad password and bad email
        const response = await request(
            process.env.TEST_HOST as string,
            mutation('a', 'ad')
        );
        expect(response).toEqual({
            register: [
                { path: 'email', message: emailNotLongEnough },
                { path: 'email', message: invalidEmail },
                { path: 'password', message: passwordNotLongEnough }
            ]
        });
    });
});
