export interface IntegrationUserInfo {
  id: string;
  name: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface IntegrationAccountDetails<T> {
  platformAccountId: string;
  userId: string;
  client: T;
}
