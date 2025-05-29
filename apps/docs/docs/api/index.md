---
title: "Getting Started with Kokoro API"
sidebar_position: 1
---

Our API follows [OpenAPI](https://www.openapis.org/) and [OAuth 2.0](https://oauth.net/2/) standards. Thanks to that, you can quickly implement our API in your application.

## Authentication

For authentication, we use [OAuth 2.0](https://oauth.net/2/). Any library that supports OAuth 2.0 should work with our API. Feel free to use whatever you prefer.

To get your OAuth cretentials, you need to create an app on [https://developers.kokoro.ws](https://developers.kokoro.ws).

Currently there are 3 scopes available:

- `openid` - allows you to get the user's email and name
- `read-memories` - allows you to read user memories
- `write-memories` - allows you to write user memories

To authenticate the user, you will need to format the authotization URL accordingly, and make the request to `https://auth.kokoro.ws/authorize`. You have a really nice URL generator inside your app's page.

For authorizing the code, you will need to make a request to `https://api.kokoro.ws/v1/oauth/token`.

### PKCE and Code Challenge

To make the authorization process more secure, we use [PKCE](https://oauth.net/2/pkce/).

- It is optional for server-side applications.
- It is required for client-side applications.

## API Reference

Our API is available at [https://api.kokoro.ws/v1/docs](https://api.kokoro.ws/v1/docs). There you will find all the endpoints and their parameters. You can also find the OpenAPI specification in the same page.
