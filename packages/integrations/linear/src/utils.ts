import type { Connection, LinearFetch } from "@linear/sdk";

export async function resolveLinearPaginatedRequest<T>(
  linearReq: LinearFetch<Connection<T>>,
): Promise<T[]> {
  const recursiveFetch = async (
    req: LinearFetch<Connection<T>>,
    acc: T[],
  ): Promise<T[]> => {
    const res = await req;

    const data = [...acc, ...res.nodes];

    if (res.pageInfo.hasNextPage) {
      return recursiveFetch(res.fetchNext(), data);
    }

    return data;
  };

  return recursiveFetch(linearReq, []);
}
