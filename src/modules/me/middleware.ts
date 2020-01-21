import { Resolver } from '../../types/graphql-utils';

export default async (
    resolver: Resolver,
    parent: any,
    args: any,
    context: any,
    info: any
) => {
    return await resolver(parent, args, context, info);
};
