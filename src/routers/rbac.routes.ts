import Elysia, { t } from "elysia";
import jwt, { JWTPayloadSpec } from "@elysiajs/jwt";
import prisma from "../config/db.config";
import bearer from "@elysiajs/bearer";

const rbacRoutes = new Elysia({ prefix: "/rbac" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "1d",
    })
  )
  .use(bearer())
  .guard(
    {
      async beforeHandle({ bearer, set, jwt }) {
        if (!bearer) {
          set.status = 401;
          return {
            message: "Unauthorize",
          };
        }
        if (!(await jwt.verify(bearer))) {
          set.status = 401;
          return {
            message: "Unauthorize",
          };
        }
      },
    },
    (app) =>
      app
        .resolve(async ({ bearer, jwt }) => {
          let data: any = await jwt.verify(bearer).then((r) => {
            if (r) {
              return { user_id: r.user_id, user_role: r.user_role };
            }
          });
          return {
            user_id: data.user_id,
            user_role: data.user_role,
          };
        })
        .get(
          "/",
          async ({ set, query, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              let { keyword } = query;

              if (!keyword) keyword = "";

              return await prisma.accessMenu.findMany({
                where: {
                  title: {
                    startsWith: `%${keyword}`,
                    mode: "insensitive",
                  },
                },
                select: { id: true, title: true },
              });
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            query: t.Object({
              keyword: t.Optional(t.MaybeEmpty(t.String())),
            }),
            response: {
              200: t.Array(
                t.Object({
                  id: t.Number(),
                  title: t.String(),
                })
              ),
              400: t.Object({
                message: t.String(),
              }),
              401: t.Object({
                message: t.String(),
              }),
              403: t.Object({
                message: t.String(),
              }),
              404: t.Object({
                message: t.String(),
              }),
              500: t.Object({
                message: t.String(),
              }),
            },
          }
        )
  );
export default rbacRoutes;
