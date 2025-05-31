import { migrateDatabase } from "@kokoro/db/migration";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";
import { afterAll, beforeAll } from "vitest";

export function useDatabaseContainer() {
  let postgresContainer: StartedPostgreSqlContainer | undefined;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer(
      "timescale/timescaledb-ha:pg16-all"
    )
      .withDatabase("postgres")
      .withUsername("postgres")
      .withPassword("password")
      .withExposedPorts({ container: 5432, host: 5432 })
      .start();

    await migrateDatabase(postgresContainer.getConnectionUri());
  }, 120000);

  afterAll(async () => {
    await postgresContainer?.stop();
  });

  return () => postgresContainer;
}

export function useEmbeddingServiceContainer() {
  let embeddingServiceContainer: StartedTestContainer | undefined;

  beforeAll(async () => {
    embeddingServiceContainer = await new GenericContainer(
      "ghcr.io/wosherco/all-minilm-l6-v2-restapi-service"
    )
      .withExposedPorts({ container: 3000, host: 3000 })
      .withWaitStrategy(Wait.forHttp("/health", 3000))
      .start();
  }, 30000);

  afterAll(async () => {
    await embeddingServiceContainer?.stop();
  });

  return () => embeddingServiceContainer;
}
