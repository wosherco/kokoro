import { orpc } from "../orpc";
import { getAuthToken } from "./config";

export async function getUser() {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  return await orpc.auth.getUser();
}

export async function isLoggedIn() {
  try {
    const user = await getUser();
    return user !== null;
  } catch {
    return false;
  }
}
