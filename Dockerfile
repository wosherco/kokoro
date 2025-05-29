FROM node:20.17-slim AS base

# Install pnpm
RUN npm install -g pnpm@9.12.2

WORKDIR /app

# Copy only package management files first (better caching)
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./.npmrc ./.nvmrc ./.env.example ./.infisical.json ./

# Copy only package.json files to leverage dependency caching
COPY ./apps/*/package.json ./apps/
COPY ./packages/*/package.json ./packages/
COPY ./tooling/*/package.json ./tooling/

# Install dependencies with better caching
FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=cache,id=pnpm-meta,target=/root/.local/share/pnpm \
    pnpm install --frozen-lockfile

# Copy source code in a separate layer for better invalidation
FROM deps AS source
COPY ./apps ./apps
COPY ./packages ./packages
COPY ./tooling ./tooling
COPY ./turbo ./turbo

# Build stage with selective building capability
FROM source AS build-base
ENV NODE_ENV=production
ENV LOG_LEVEL=info
RUN pnpm -F envs ensure-env

# Individual service builds
FROM build-base AS build-landing
RUN CI=1 pnpm -F landing build 

FROM build-base AS build-docs  
RUN CI=1 pnpm -F docs build 

FROM build-base AS build-account
RUN CI=1 pnpm -F account build 

FROM build-base AS build-authenticator
RUN CI=1 pnpm -F authenticator build 

FROM build-base AS build-developers
RUN CI=1 pnpm -F developers build 


##########################
#      apps/landing      #
##########################
FROM caddy:2-alpine AS landing
COPY --from=build-landing /app/apps/landing/build /usr/share/caddy
COPY ./infra/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443

#######################
#       apps/docs     #
#######################
FROM caddy:2-alpine AS docs
COPY --from=build-docs /app/apps/docs/build /usr/share/caddy
COPY ./infra/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443

##########################
#      apps/account      #
##########################
FROM build-account AS account-build
RUN pnpm deploy -F account /prod/account

FROM base AS account
COPY --from=account-build /prod/account /prod/account
WORKDIR /prod/account
ENV NODE_ENV=production
ENV PORT=5174
ENV HOSTNAME="0.0.0.0"
EXPOSE 5174
CMD ["pnpm", "-F", "account", "start"]

################################
#       apps/authenticator     #
################################
FROM build-authenticator AS authenticator-build
RUN pnpm deploy -F authenticator /prod/authenticator

FROM base AS authenticator
COPY --from=authenticator-build /prod/authenticator /prod/authenticator
WORKDIR /prod/authenticator
ENV NODE_ENV=production
ENV PORT=5173
ENV HOSTNAME="0.0.0.0"
EXPOSE 5173
CMD ["pnpm", "-F", "authenticator", "start"]

#############################
#       apps/developers     #
#############################
FROM build-developers AS developers-build
RUN pnpm deploy -F developers /prod/developers

FROM base AS developers
COPY --from=developers-build /prod/developers /prod/developers
WORKDIR /prod/developers
ENV NODE_ENV=production
ENV PORT=5177
ENV HOSTNAME="0.0.0.0"
EXPOSE 5177
CMD ["pnpm", "-F", "developers", "start"]

#########################
#       apps/server     #
#########################
FROM source AS server-build
RUN pnpm deploy -F server /prod/server

FROM base AS server
COPY --from=server-build /prod/server /prod/server
WORKDIR /prod/server
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
EXPOSE 3001
CMD ["pnpm", "-F", "server", "start"]

###########################
#       apps/consumer     #
###########################
FROM source AS consumer-build
RUN pnpm deploy -F consumer /prod/consumer

FROM base AS consumer
COPY --from=consumer-build /prod/consumer /prod/consumer
WORKDIR /prod/consumer
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"
EXPOSE 3005
CMD ["pnpm", "-F", "consumer", "start"]

###########################
#       apps/migrator     #
###########################
FROM source AS migrator-build
RUN pnpm deploy -F db /prod/migrator

FROM base AS migrator
COPY --from=migrator-build /prod/migrator /prod/migrator
WORKDIR /prod/migrator
ENV NODE_ENV=production
CMD ["sh", "-c", "pnpm -F db exec drizzle-kit migrate && tail -f /dev/null"] 