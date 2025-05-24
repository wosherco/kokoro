import { migrateDatabase } from "@kokoro/db/migration";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Wait } from "testcontainers";

export async function createDatabaseContainer() {
  const postgresContainer = await new PostgreSqlContainer(
    "timescale/timescaledb-ha:pg16-all"
  )
    .withDatabase("postgres")
    .withUsername("postgres")
    .withPassword("password")
    .withExposedPorts({ container: 5432, host: 5432 })
    .start();

  const uri = postgresContainer.getConnectionUri();

  await migrateDatabase(uri);

  return { postgresContainer, uri };
}

export async function createEmbeddingServiceContainer() {
  const embeddingServiceContainer = await new GenericContainer(
    "ghcr.io/wosherco/all-minilm-l6-v2-restapi-service"
  )
    .withExposedPorts({ container: 3000, host: 3000 })
    .withWaitStrategy(Wait.forHttp("/health", 3000))
    .start();

  return embeddingServiceContainer;
}
