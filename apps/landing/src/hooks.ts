import { deLocalizeUrl } from "$lib/paraglide/runtime";
import type { Reroute } from "@sveltejs/kit";

export const reroute: Reroute = (request) => {
  const { pathname, search, hash } = deLocalizeUrl(request.url);
  return `${pathname}${search}${hash}`;
};
