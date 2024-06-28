import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

export const ExampleClient = new PrismaClient();

export const adapter = new PrismaAdapter(
  ExampleClient.session,
  ExampleClient.user,
);
