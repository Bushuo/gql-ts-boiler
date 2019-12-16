import * as Redis from 'ioredis';
import fetch from 'node-fetch';

import { createEmailConfirmationLink } from './createEmailConfirmationLink';
import { createTypeormConnection } from './createTypeormConnection';
import { User } from '../entity/User';

let userId: string;
const redis = new Redis();

beforeAll(async () => {
    await createTypeormConnection();
    const user = await User.create({
        email: 'confirmEmailLink@test.test',
        password: 'confirmEmail'
    }).save();
    userId = user.id;
});

describe('test email confirmation link', () => {
    test('link hit confirms user & clears redis link key', async () => {
        const url = await createEmailConfirmationLink(
            process.env.TEST_HOST as string,
            userId,
            redis
        );

        const response = await fetch(url);
        const text = await response.text();
        expect(text).toEqual('ok');

        const user = await User.findOne({ where: { id: userId } });
        expect((user as User).confirmed).toBeTruthy();
        const chunks = url.split('/');
        const key = chunks[chunks.length - 1];
        const value = await redis.get(key);
        expect(value).toBeNull();
    });

    test('get invalid for bad confirmation link', async () => {
        const response = await fetch(
            `${process.env.TEST_HOST}/confirm/skadbv92`
        );
        const text = await response.text();
        expect(text).toEqual('invalid');
    });
});
