/* eslint-disable @typescript-eslint/only-throw-error */
import { redirect } from "@sveltejs/kit";

export function GET() {
  throw redirect(302, "/");
}
