import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia, t } from "elysia";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "API Documentation",
          version: "1.0.0",
        },
      },
    })
  )
  .use(cors())
  .get(
    "/",
    () => {
      return { message: "Hello Elysia 🦊" };
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .listen(process.env.APP_PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
