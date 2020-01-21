import { Connection } from 'typeorm';
import { createTypeormConnection } from '../../utils/createTypeormConnection';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testclient';

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

describe('logout', () => {
    test('multiple session', async () => {
        const session1 = new TestClient(process.env.TEST_HOST as string);
        const session2 = new TestClient(process.env.TEST_HOST as string);

        await session1.login(email, password);
        await session2.login(email, password);

        expect(await session1.me()).toEqual(await session2.me());
        await session1.logout();
        // transitive relation. session2 should also be null
        expect(await session2.me()).toEqual({ data: { me: null } });
    });

    test('single session', async () => {
        const client = new TestClient(process.env.TEST_HOST as string);
        await client.login(email, password);

        const response1 = await client.me();
        expect(response1.data).toEqual({
            me: {
                id: userId,
                email
            }
        });

        await client.logout();

        const response2 = await client.me();

        expect(response2.data.me).toBeNull();
    });
});
