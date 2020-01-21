// axios works well with cookies
import axios from 'axios';
import { Connection } from 'typeorm';
import { createTypeormConnection } from '../../utils/createTypeormConnection';
import { User } from '../../entity/User';

const email = 'logout@test.com';
const password = 'akjbuaoe878324';
let conn: Connection;
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

const loginMutation = (e: string, p: string) => `
    mutation {
        login(email: "${e}", password: "${p}") {
            path
            message
        }
    }
`;

const logoutMutation = `
mutation {
    logout
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

describe('logout', () => {
    test('test logging out a user', async () => {
        await axios.post(
            process.env.TEST_HOST as string,
            {
                query: loginMutation(email, password)
            },
            {
                withCredentials: true
            }
        );

        const response1 = await axios.post(
            process.env.TEST_HOST as string,
            {
                query: meQuery
            },
            {
                withCredentials: true
            }
        );

        expect(response1.data.data).toEqual({
            me: {
                id: userId,
                email
            }
        });

        await axios.post(
            process.env.TEST_HOST as string,
            {
                query: logoutMutation
            },
            {
                withCredentials: true
            }
        );

        const response2 = await axios.post(
            process.env.TEST_HOST as string,
            {
                query: meQuery
            },
            {
                withCredentials: true
            }
        );

        expect(response2.data.data.me).toBeNull();
    });
});
