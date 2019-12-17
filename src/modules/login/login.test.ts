import { request } from 'graphql-request';
import { createTypeormConnection } from '../../utils/createTypeormConnection';
import { unconfirmedEmail, invalidLogin } from './errorMessages';
import { User } from '../../entity/User';

const email = 'login@test.com';
const password = 'asdbf&dvjb2123';

const registerMutation = (e: string, p: string) => `
    mutation {
        register(email: "${e}", password: "${p}") {
            path
            message
        }
    }
`;

const loginMutation = (e: string, p: string) => `
    mutation {
        login(email: "${e}", password: "${p}") {
            path
            message
        }
    }
`;

const loginExpectError = async (e: string, p: string, errMsg: string) => {
    const response = await request(
        process.env.TEST_HOST as string,
        loginMutation(e, p)
    );
    expect(response).toEqual({
        login: [
            {
                path: 'email',
                message: errMsg
            }
        ]
    });
};

beforeAll(async () => {
    await createTypeormConnection();
    // register a user
    await request(
        process.env.TEST_HOST as string,
        registerMutation(email, password)
    );
});

describe('login user', () => {
    it('error with invalid email', async () => {
        await loginExpectError('something@test.com', password, invalidLogin);
    });

    it('error before confirmation', async () => {
        await loginExpectError(email, password, unconfirmedEmail);
    });

    it('error with invalid password', async () => {
        await User.update({ email }, { confirmed: true });

        await loginExpectError(email, 'abcdeft123', invalidLogin);
    });

    it('successful login', async () => {
        const response = await request(
            process.env.TEST_HOST as string,
            loginMutation(email, password)
        );
        expect(response).toEqual({
            login: null
        });
    });
});
