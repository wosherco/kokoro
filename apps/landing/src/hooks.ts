import type { Reroute } from "@sveltejs/kit";
import { deLocalizeUrl } from "$lib/paraglide/runtime";

export const reroute: Reroute = (request) => {
  const { pathname, search, hash } = deLocalizeUrl(request.url);
  return `${pathname}${search}${hash}`;
};
