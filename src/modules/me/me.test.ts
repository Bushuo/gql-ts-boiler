// axios works well with cookies
import axios from 'axios';
import { Connection } from 'typeorm';
import { createTypeormConnection } from '../../utils/createTypeormConnection';
import { User } from '../../entity/User';

const loginMutation = (e: string, p: string) => `
    mutation {
        login(email: "${e}", password: "${p}") {
            path
            message
        }
    }
`;

const meQuery = ` 
{
    me {
        id
        email
    }        
}
`;

let userId: string;
const email = 'authMiddleware@test.com';
const password = 'akjbuaoe878324';
let conn: Connection;
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

describe('me', () => {
    test('return null if no cookie', async () => {
        const response = await axios.post(process.env.TEST_HOST as string, {
            query: meQuery
        });

        expect(response.data.data.me).toBeNull();
    });

    test('get current user', async () => {
        await axios.post(
            process.env.TEST_HOST as string,
            {
                query: loginMutation(email, password)
            },
            {
                withCredentials: true
            }
        );

        const response = await axios.post(
            process.env.TEST_HOST as string,
            {
                query: meQuery
            },
            {
                withCredentials: true
            }
        );

        expect(response.data.data).toEqual({
            me: {
                id: userId,
                email
            }
        });
    });
});
