import { Button, Html, Tailwind, Text } from "@react-email/components";

import { env } from "../env";

export const GoogleCalendarInvalidGrant = ({
  googleAccountEmail,
}: {
  googleAccountEmail: string;
}) => {
  return (
    <Html>
      <Tailwind>
        <Text>
          Your Google account {googleAccountEmail} has been invalidated. For
          your calendar to continue working, please re-authorize your account.
        </Text>
        <Button
          href={`${env.PUBLIC_ACCOUNT_URL}/skills/calendar`}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Re-authorize
        </Button>
      </Tailwind>
    </Html>
  );
};

export default GoogleCalendarInvalidGrant;
