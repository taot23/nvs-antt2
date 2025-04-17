import { db } from "./server/db";
import { users } from "./shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  const hashedPassword = await hashPassword("admin123");
  
  try {
    const [user] = await db
      .insert(users)
      .values({
        username: "admin",
        password: hashedPassword,
      })
      .returning();
    
    console.log("Usuário administrador criado com sucesso:", user);
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();