import fetch from 'node-fetch';

test('get invalid for bad confirmation link', async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/skadbv92`);
    const text = await response.text();
    expect(text).toEqual('invalid');
});
