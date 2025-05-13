FROM node:20.17-slim AS base

RUN npm install -g pnpm@9.12.2

WORKDIR /app

# Copying needed files
COPY ./package.json /app/package.json
COPY ./.npmrc /app/.npmrc
COPY ./.nvmrc /app/.nvmrc
COPY ./pnpm-lock.yaml /app/pnpm-lock.yaml
COPY ./pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY ./turbo.json /app/turbo.json
COPY ./.env.example /app/.env.example
COPY ./.infisical.json /app/.infisical.json

# Copying needed folders
COPY ./apps /app/apps
COPY ./packages /app/packages
COPY ./tooling /app/tooling
COPY ./turbo /app/turbo

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build

ENV NODE_ENV=production
ENV LOG_LEVEL=info

RUN pnpm -F envs ensure-env
RUN CI=1 pnpm build

##########################
#      apps/landing      #
##########################
FROM caddy:2-alpine AS landing
COPY --from=build /app/apps/landing/build /usr/share/caddy
COPY ./infra/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443

#######################
#       apps/docs     #
#######################
FROM caddy:2-alpine AS docs
COPY --from=build /app/apps/docs/build /usr/share/caddy
COPY ./infra/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
EXPOSE 443


##########################
#      apps/account      #
##########################
FROM build AS account-build
RUN pnpm deploy -F account /prod/account

FROM base AS account
COPY --from=account-build /prod/account /prod/account
WORKDIR /prod/account

ENV NODE_ENV=production

EXPOSE 5174

ENV PORT=5174
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "account", "start"]

################################
#       apps/authenticator     #
################################
FROM build AS authenticator-build
RUN pnpm deploy -F authenticator /prod/authenticator

FROM base AS authenticator
COPY --from=authenticator-build /prod/authenticator /prod/authenticator
WORKDIR /prod/authenticator

ENV NODE_ENV=production

EXPOSE 5173

ENV PORT=5173
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "authenticator", "start"]

###########################
#       apps/developers     #
###########################
FROM deps AS developers-build
RUN pnpm deploy -F developers /prod/developers

FROM base AS developers
COPY --from=developers-build /prod/developers /prod/developers
WORKDIR /prod/developers

ENV NODE_ENV=production

EXPOSE 5177

ENV PORT=5177
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "developers", "start"]

#########################
#       apps/server     #
#########################
FROM deps AS server-build
RUN pnpm deploy -F server /prod/server

FROM base AS server
COPY --from=server-build /prod/server /prod/server
WORKDIR /prod/server

ENV NODE_ENV=production

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "server", "start"]

###########################
#       apps/consumer     #
###########################
FROM deps AS consumer-build
RUN pnpm deploy -F consumer /prod/consumer

FROM base AS consumer
COPY --from=consumer-build /prod/consumer /prod/consumer
WORKDIR /prod/consumer

ENV NODE_ENV=production

EXPOSE 3005

ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "consumer", "start"]

###########################
#       apps/migrator     #
###########################
FROM deps AS migrator-build
RUN pnpm deploy -F db /prod/migrator

FROM base AS migrator
COPY --from=migrator-build /prod/migrator /prod/migrator
WORKDIR /prod/migrator

ENV NODE_ENV=production

CMD ["sh", "-c", "pnpm -F db exec drizzle-kit migrate && tail -f /dev/null"]
