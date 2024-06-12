import Elysia, { t } from "elysia";
import jwt, { JWTPayloadSpec } from "@elysiajs/jwt";
import prisma from "../config/db.config";
import bearer from "@elysiajs/bearer";

const locationRoutes = new Elysia({ prefix: "/location" })
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
        .post(
          "/",
          async ({ set, body, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const { name } = body;

              await prisma.location.create({
                data: {
                  name: name,
                },
              });
              return {
                message: `Location ${name} created`,
              };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
              name: t.String(),
            }),
            response: {
              200: t.Object({
                message: t.String(),
              }),
              400: t.Object({
                message: t.String(),
              }),
              401: t.Object({
                message: t.String(),
              }),
              403: t.Object({
                message: t.String(),
              }),
              500: t.Object({
                message: t.String(),
              }),
            },
          }
        )
        .get(
          "/",
          async ({ set, user_role, query }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const { page, pageSize } = query;

              const total = await prisma.location.count();
              const locations = await prisma.location.findMany({
                skip: Number(page) * Number(pageSize),
                take: Number(pageSize),
              });

              return {
                total: total,
                data: locations,
                page: Number(page),
                total_pages: Math.ceil(total / Number(pageSize)),
              };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            query: t.Object({
              page: t.String(),
              pageSize: t.String(),
            }),
            response: {
              200: t.Object({
                total: t.Number(),
                data: t.Array(
                  t.Object({
                    id: t.Number(),
                    name: t.String(),

                    created_at: t.Date(),
                    updated_at: t.Date(),
                  })
                ),
                page: t.Number(),
                total_pages: t.Number(),
              }),
              400: t.Object({
                message: t.String(),
              }),
              401: t.Object({
                message: t.String(),
              }),
              403: t.Object({
                message: t.String(),
              }),
              500: t.Object({
                message: t.String(),
              }),
            },
          }
        )
        .put(
          "/",
          async ({ set, body, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const { id, name } = body;

              const existLocation = await prisma.location.findFirst({
                where: {
                  id: id,
                },
              });

              if (!existLocation) {
                set.status = 404;
                return {
                  message: `Role ${id} not found`,
                };
              }

              await prisma.location.update({
                where: { id: id },
                data: {
                  name: name,
                },
              });

              return { message: `Location updated` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
              id: t.Number(),
              name: t.String(),
            }),
            response: {
              200: t.Object({
                message: t.String(),
              }),
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
        .delete(
          "/",
          async ({ set, query, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const { id } = query;
              const existLocation = await prisma.location.findFirst({
                where: { id: Number(id) },
                select: {
                  name: true,
                },
              });

              if (!existLocation) {
                set.status = 404;
                return { message: `Role id ${id} not found` };
              }
              await prisma.location.delete({
                where: { id: Number(id) },
              });

              return { message: `Location ${existLocation.name} deleted` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            query: t.Object({
              id: t.String(),
            }),
            response: {
              200: t.Object({
                message: t.String(),
              }),
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
        .get(
          "/list",
          async ({ set, query, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              let { keyword } = query;

              if (!keyword) keyword = "";

              return await prisma.location.findMany({
                where: {
                  name: {
                    startsWith: `%${keyword}`,
                    mode: "insensitive",
                  },
                },
                select: { id: true, name: true },
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
                  name: t.String(),
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
export default locationRoutes;
