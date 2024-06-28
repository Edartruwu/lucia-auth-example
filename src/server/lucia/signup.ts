"use server";

import { ExampleClient } from "@/lib/prisma";
import { hash } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { lucia } from "@/lib/lucia-auth";
import { redirect } from "next/navigation";

import { z } from "zod";

interface ActionResult {
  error: string;
}

const signupSchema = z.object({
  username: z
    .string()
    .min(4)
    .max(31)
    .regex(/^[a-z0-9_-]+$/),
  password: z.string().min(6).max(255),
});

export default async function signup(
  formData: FormData,
): Promise<ActionResult> {
  const username = formData.get("username");
  const password = formData.get("password");

  const parsedData = signupSchema.safeParse({ username, password });

  if (!parsedData.success) {
    return {
      error: "Invalid username or password",
    };
  }

  const { username: validUsername, password: validPassword } = parsedData.data;

  const passwordHash = await hash(validPassword, {
    // recommended minimum parameters
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Check if username is already used
  const existingUser = await ExampleClient.user.findUnique({
    where: {
      username: validUsername,
    },
  });

  if (existingUser) {
    return {
      error: "Username is already taken",
    };
  }

  await ExampleClient.user.create({
    data: {
      username: validUsername,
      password_hash: passwordHash,
    },
  });

  const userId = await ExampleClient.user.findUnique({
    where: { username: validUsername },
    select: { id: true },
  });

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/");
}
