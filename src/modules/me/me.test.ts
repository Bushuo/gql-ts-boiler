import { Connection } from 'typeorm';
import { createTypeormConnection } from '../../utils/createTypeormConnection';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testClient';

let userId: string;
const email = 'authMiddleware@test.com';
const password = 'akjbuaoe878324';
let conn: Connection;
beforeAll(async () => {
    conn = await createTypeormConnection();
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
