import { Redis } from 'ioredis';

export type Resolver = (
    parent: any,
    args: any,
    context: { redis: Redis; session: Session; url: string },
    info: any
) => any;

export type GraphQLMiddlewareFunc = (
    resolver: Resolver,
    parent: any,
    args: any,
    context: { redis: Redis; session: Session; url: string },
    info: any
) => any;

export interface ResolverMap {
    [key: string]: {
        [key: string]: Resolver;
    };
}

export interface Session extends Express.Session {
    userId?: string;
}
