---
title: "Kokoro MCP"
sidebar_position: 1
parent: "Using Kokoro"
---

Kokoro MCP allows **any AI** to interact with Kokoro. This basically means that any AI will have access to your other platforms, and the capability of mutating them.

## How to use it?

It's pretty simple. Independent of what AI you're using, you'll first need to install [nodejs](https://nodejs.org/en/download/).

Once installed, you'll have to login to the Kokoro MCP using the following command:

```bash
npx -y @kokoro.ws/mcp login
```

Just follow the instructions on the screen. Once done, follow the instructions for the AI you're using.

:::info
If you're self-hosting Kokoro, you'll have to run `npx -y @kokoro.ws/mcp host custom` to point the MCP to your server.
:::

### Cursor

Open `~/.cursor/mcp.json` and add the following:

```json title="~/.cursor/mcp.json"
{
  "mcpServers": {
    "kokoro-mcp": {
      "command": "npx",
      "args": ["-y", "@kokoro.ws/mcp"]
    }
    // ...your other mcps
  }
}
```

<details>
    <summary>Snippet</summary>

```json
"kokoro-mcp": {
  "command": "npx",
  "args": ["-y", "@kokoro.ws/mcp"]
}
```

</details>

To edit the file quickly, do `cursor ~/.cursor/mcp.json` or open it with nano `nano ~/.cursor/mcp.json`.

### Windsurf

:::warning

This is a work in progress. Feel free to open a PR to add Windsurf instructions.

:::

### Claude

:::warning

This is a work in progress. Feel free to open a PR to add Claude instructions.

:::
