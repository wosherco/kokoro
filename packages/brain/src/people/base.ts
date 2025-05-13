import type { TransactableDBType } from "@kokoro/db/client";
import type { GoogleContactEmailPlatformData } from "@kokoro/db/schema";
import type { ContactSource } from "@kokoro/validators/db";

interface BaseContactData {
  platformContactId: string;
  platformContactListId: string;
  source: ContactSource;
}

export interface ContactData extends BaseContactData {
  deleted: false;
  photoUrl?: string;
  emails?: {
    email: string;
    displayName?: string;
    primary?: boolean;
    platformData?: GoogleContactEmailPlatformData;
  }[];
  names?: {
    givenName: string;
    middleName?: string;
    familyName?: string;
    displayName: string;
    primary?: boolean;
  }[];
}

export interface DeletedContactData extends BaseContactData {
  deleted: true;
}

export type DeletableContactData = DeletedContactData | ContactData;

export interface ProcessContactContext {
  userId: string;
  platformAccountId: string;
  platformContactListId: string;
  contactListId: string;
}

export abstract class ReadOnlyContactsSource<PlatformContact> {
  abstract processContact(
    context: ProcessContactContext,
    contact: PlatformContact,
    tx?: TransactableDBType,
  ): Promise<void>;

  abstract syncContacts(
    integrationAccountId: string,
    contactListId: string,
  ): Promise<void>;

  abstract fetchPlatformContact(
    integrationAccountId: string,
    platformContactId: string,
  ): Promise<PlatformContact>;
}
