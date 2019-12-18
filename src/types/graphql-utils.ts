import { Redis } from 'ioredis';

export interface ResolverMap {
    [key: string]: {
        [key: string]: (
            parent: any,
            args: any,
            context: { redis: Redis; session: Session; url: string },
            info: any
        ) => any;
    };
}

export interface Session {
    userId?: string;
}
