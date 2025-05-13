import type { ContactSource } from "@kokoro/validators/db";
import { GOOGLE_PEOPLE, LINEAR } from "@kokoro/validators/db";

import { GoogleContactsSource } from "./google";
import { LinearContactsSource } from "./linear";

const CONTACT_SOURCES = {
  [LINEAR]: new LinearContactsSource(),
  [GOOGLE_PEOPLE]: new GoogleContactsSource(),
} as const;

export function getContactSource<T extends ContactSource>(
  source: T,
): (typeof CONTACT_SOURCES)[T] {
  return CONTACT_SOURCES[source];
}
