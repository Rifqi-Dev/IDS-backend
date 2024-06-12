import Elysia, { t } from "elysia";
import jwt, { JWTPayloadSpec } from "@elysiajs/jwt";
import prisma from "../config/db.config";
import bearer from "@elysiajs/bearer";

const roleRoutes = new Elysia({ prefix: "/role" })
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
          async ({ set, body, user_id, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              console.log(user_id);
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const { name, accessMenus } = body;

              const newRole = await prisma.position.create({
                data: {
                  name: name,
                  access_menus: accessMenus,
                },
              });

              return { message: `role ${name} created` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
              name: t.String(),
              accessMenus: t.Array(t.Number()),
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
              const total = await prisma.position.count();
              const roles = await prisma.position.findMany({
                skip: Number(page) * Number(pageSize),
                take: Number(pageSize),
              });

              const rolesWithAccessMenus = await Promise.all(
                roles.map(async (role) => {
                  const access_menus = await prisma.accessMenu.findMany({
                    where: {
                      id: {
                        in: role.access_menus,
                      },
                    },
                    select: {
                      id: true,
                      url: true,
                      title: true,
                      icon: true,
                    },
                  });
                  return {
                    ...role,
                    access_menus: access_menus,
                  };
                })
              );

              return {
                total: total,
                data: rolesWithAccessMenus,
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
                    access_menus: t.Array(
                      t.Object({
                        id: t.Number(),
                        url: t.String(),
                        icon: t.MaybeEmpty(t.String()),
                      })
                    ),
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
              const { id, name, accessMenus } = body;

              const existRole = await prisma.position.findFirst({
                where: {
                  id: id,
                },
              });

              if (!existRole) {
                set.status = 404;
                return {
                  message: `Role ${id} not found`,
                };
              }

              await prisma.position.update({
                where: { id: id },
                data: {
                  name: name,
                  access_menus: accessMenus,
                },
              });

              return { message: `role id ${existRole.id} updated` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
              id: t.Number(),
              name: t.String(),
              accessMenus: t.Array(t.Number()),
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
              const existRole = await prisma.position.findFirst({
                where: { id: Number(id) },
                select: {
                  name: true,
                },
              });

              if (!existRole) {
                set.status = 404;
                return { message: `Role id ${id} not found` };
              }
              await prisma.position.delete({
                where: { id: Number(id) },
              });

              return { message: `role ${existRole.name} deleted` };
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

              return await prisma.position.findMany({
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
export default roleRoutes;
