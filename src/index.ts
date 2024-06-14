import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import authRoutes from "./routers/auth.routes";
import roleRoutes from "./routers/role.routes";
import locationRoutes from "./routers/location.routes";
import minioClient from "./config/minio.config";
import employeeRoutes from "./routers/employee.routes";
import userRoutes from "./routers/user.routes";
import rbacRoutes from "./routers/rbac.routes";

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
  //=========== Error Handler ======================
  .onError(({ code, error, set }) => {
    console.log("=============Error handler===========");
    // console.log("error ==>", error);
    console.log("Code ==>", code);

    switch (code) {
      case "VALIDATION":
        set.status = 400;
        let errors = error.all;
        console.log(errors);
        let message = "";

        switch (errors[0].schema.default) {
          case "File":
            message = `${errors[0].path.replace(
              /^\//,
              ""
            )} must be ${errors[0].schema.extension.join(
              " or "
            )} with max size of ${errors[0].schema.maxSize}`;
            break;

          default:
            message = `${errors[0].path.replace(/^\//, "")} ${
              errors[0].message
            }`;
        }

        return {
          message: message,
        };
      case "NOT_FOUND":
        set.status = 404;
        return {
          message: error.message,
        };
      default:
        set.status = 500;

        return {
          message: error.message,
        };
    }
  })
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
  .use(authRoutes)
  .use(roleRoutes)
  .use(locationRoutes)
  .use(employeeRoutes)
  .use(userRoutes)
  .use(rbacRoutes)
  .listen(process.env.APP_PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
