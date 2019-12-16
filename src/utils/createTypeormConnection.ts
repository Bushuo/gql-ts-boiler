import { createConnection, getConnectionOptions } from 'typeorm';

export const createTypeormConnection = async () => {
    const conOpts = await getConnectionOptions(process.env.NODE_ENV);
    return createConnection({ ...conOpts, name: 'default' });
};
