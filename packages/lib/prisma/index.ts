// Look how beautiful and standard this is now!
import { PrismaClient } from "@prisma/client";

declare global {
  var prismadb: PrismaClient | undefined;
}

export const prisma = global.prismadb || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismadb = prisma;
}