# Kokoro Actions

This part contains all the schema stuff for the actions. This is shared between the client and the server.

## Add action

To add an action, find the type where your action will be created. If the action is related to calendar (for example), we'll grab the calendar.ts file, and add the action there. These are the steps:

1. Create a constant for the name. Please, follow the same naming convention.
2. Create the schema for the payload. Please, follow the same naming convention.
3. Add the constant for the action name to the constant array containing all the action names, and then add the schema to the object containing all the schemas.

## Add types of action

If you want to add a new type of action (such as tasks for example), you'll need to add a new file in the `src/actions` folder.

1. Create a new file in the `src/actions` folder.
2. Follow the steps [above](#add-action) to add the action. You'll need to create the name arrays and the object containing the schemas yourself. Check other files for reference.
3. Add the exported array of names to the `KokoroActions` array in the `actions/index.ts` file.
4. Add the schemas to the `KokoroActionPayloadSchemas` object in the `actions/index.ts` file.
5. Export everything from the file in the `index.ts` file at the bottom.
