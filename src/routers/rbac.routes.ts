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
        // .post(
        //   "/",
        //   async ({ set, body, user_role }) => {
        //     return await prisma.$transaction(async (prisma) => {
        //       if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
        //         set.status = 403;
        //         return { message: "forbidden" };
        //       }
        //       const { url, title, icon, parent } = body;

        //       await prisma.accessMenu.create({
        //         data: {
        //           url: url,
        //           title: title,
        //           icon: icon,
        //           parent: parent,
        //         },
        //       });
        //       return {
        //         message: `Menu ${title} created`,
        //       };
        //     });
        //   },
        //   {
        //     headers: t.Object({
        //       authorization: t.TemplateLiteral("Bearer ${string}"),
        //     }),
        //     body: t.Object({
        //       url: t.String(),
        //       title: t.String(),
        //       icon: t.String(),
        //       parent: t.Number(),
        //     }),
        //     response: {
        //       200: t.Object({
        //         message: t.String(),
        //       }),
        //       400: t.Object({
        //         message: t.String(),
        //       }),
        //       401: t.Object({
        //         message: t.String(),
        //       }),
        //       403: t.Object({
        //         message: t.String(),
        //       }),
        //       500: t.Object({
        //         message: t.String(),
        //       }),
        //     },
        //   }
        // )
        // .get(
        //   "/",
        //   async ({ set, user_role, query }) => {
        //     return await prisma.$transaction(async (prisma) => {
        //       if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
        //         set.status = 403;
        //         return { message: "forbidden" };
        //       }
        //       const { page, pageSize } = query;

        //       const total = await prisma.accessMenu.count({
        //         where: { parent: null },
        //       });
        //       const accessMenu = await prisma.accessMenu.findMany({
        //         where: { parent: null },
        //         skip: Number(page) * Number(pageSize),
        //         take: Number(pageSize),
        //         select: {
        //           id: true,
        //           url: true,
        //           title: true,
        //           icon: true,
        //           child: true,
        //         },
        //       });

        //       return {
        //         total: total,
        //         data: accessMenu,
        //         page: Number(page),
        //         total_pages: Math.ceil(total / Number(pageSize)),
        //       };
        //     });
        //   },
        //   {
        //     headers: t.Object({
        //       authorization: t.TemplateLiteral("Bearer ${string}"),
        //     }),
        //     query: t.Object({
        //       page: t.String(),
        //       pageSize: t.String(),
        //     }),
        //     response: {
        //       200: t.Object({
        //         total: t.Number(),
        //         data: t.Array(
        //           t.Object({
        //             id: t.Number(),
        //             url: t.String(),
        //             title: t.String(),
        //             icon: t.String(),

        //             child: t.Array(
        //               t.Object({
        //                 id: t.Number(),
        //                 url: t.String(),
        //                 title: t.String(),
        //                 icon: t.String(),
        //               })
        //             ),
        //           })
        //         ),
        //         page: t.Number(),
        //         total_pages: t.Number(),
        //       }),
        //       400: t.Object({
        //         message: t.String(),
        //       }),
        //       401: t.Object({
        //         message: t.String(),
        //       }),
        //       403: t.Object({
        //         message: t.String(),
        //       }),
        //       500: t.Object({
        //         message: t.String(),
        //       }),
        //     },
        //   }
        // )
        // .put(
        //   "/",
        //   async ({ set, body, user_role }) => {
        //     return await prisma.$transaction(async (prisma) => {
        //       if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
        //         set.status = 403;
        //         return { message: "forbidden" };
        //       }
        //       const { id, url, title, icon, parent } = body;

        //       const existAccessMenu = await prisma.accessMenu.findFirst({
        //         where: {
        //           id: id,
        //         },
        //       });

        //       if (!existAccessMenu) {
        //         set.status = 404;
        //         return {
        //           message: `Role ${id} not found`,
        //         };
        //       }

        //       await prisma.accessMenu.update({
        //         where: { id: id },
        //         data: {
        //           url: url,
        //           title,
        //           icon,
        //           parent: parent,
        //         },
        //       });

        //       return { message: `Access Menu updated` };
        //     });
        //   },
        //   {
        //     headers: t.Object({
        //       authorization: t.TemplateLiteral("Bearer ${string}"),
        //     }),
        //     body: t.Object({
        //       id: t.Number(),
        //       name: t.String(),
        //       url: t.String(),
        //       title: t.String(),
        //       icon: t.String(),
        //       parent: t.Number(),
        //     }),
        //     response: {
        //       200: t.Object({
        //         message: t.String(),
        //       }),
        //       400: t.Object({
        //         message: t.String(),
        //       }),
        //       401: t.Object({
        //         message: t.String(),
        //       }),
        //       403: t.Object({
        //         message: t.String(),
        //       }),
        //       404: t.Object({
        //         message: t.String(),
        //       }),
        //       500: t.Object({
        //         message: t.String(),
        //       }),
        //     },
        //   }
        // )
        // .delete(
        //   "/",
        //   async ({ set, query, user_role }) => {
        //     return await prisma.$transaction(async (prisma) => {
        //       if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
        //         set.status = 403;
        //         return { message: "forbidden" };
        //       }
        //       const { id } = query;
        //       const accessMenus = await prisma.accessMenu.findMany({
        //         where: { id: Number(id) },
        //       });

        //       if (!accessMenus) {
        //         set.status = 404;
        //         return { message: `Role id ${id} not found` };
        //       }
        //       await prisma.accessMenu.deleteMany({
        //         where: { OR: [{ id: Number(id) }, { parent: Number(id) }] },
        //       });

        //       return { message: `Menu deleted` };
        //     });
        //   },
        //   {
        //     headers: t.Object({
        //       authorization: t.TemplateLiteral("Bearer ${string}"),
        //     }),
        //     query: t.Object({
        //       id: t.String(),
        //     }),
        //     response: {
        //       200: t.Object({
        //         message: t.String(),
        //       }),
        //       400: t.Object({
        //         message: t.String(),
        //       }),
        //       401: t.Object({
        //         message: t.String(),
        //       }),
        //       403: t.Object({
        //         message: t.String(),
        //       }),
        //       404: t.Object({
        //         message: t.String(),
        //       }),
        //       500: t.Object({
        //         message: t.String(),
        //       }),
        //     },
        //   }
        // )
        .get("/access_menu", async ({ set, user_role }) => {
          return await prisma.$transaction(async (prisma) => {
            const accessMenusArray = await prisma.position.findFirst({
              where: {
                name: user_role,
              },
              select: { access_menus: true },
            });
            if (!accessMenusArray) {
              set.status = 403;
              return {
                message: "forbidden",
              };
            }
            console.log(accessMenusArray.access_menus);

            const access = await prisma.accessMenu.findMany({
              where: {
                id: { in: accessMenusArray.access_menus },
                parent: null,
              },
              select: {
                id: true,
                url: true,
                title: true,
                icon: true,
                child: true,
              },
            });

            const filteredAccess = access.map((menu) => ({
              ...menu,
              child: menu.child.filter((childMenu) =>
                accessMenusArray.access_menus.includes(childMenu.id)
              ),
            }));
            return filteredAccess;
          });
        })
    // .get(
    //   "/list",
    //   async ({ set, query, user_role }) => {
    //     return await prisma.$transaction(async (prisma) => {
    //       if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
    //         set.status = 403;
    //         return { message: "forbidden" };
    //       }
    //       let { keyword } = query;

    //       if (!keyword) keyword = "";

    //       return await prisma.accessMenu.findMany({
    //         where: {
    //           title: {
    //             startsWith: `%${keyword}`,
    //             mode: "insensitive",
    //           },
    //         },
    //         select: { id: true, title: true },
    //       });
    //     });
    //   },
    //   {
    //     headers: t.Object({
    //       authorization: t.TemplateLiteral("Bearer ${string}"),
    //     }),
    //     query: t.Object({
    //       keyword: t.Optional(t.MaybeEmpty(t.String())),
    //     }),
    //     response: {
    //       200: t.Array(
    //         t.Object({
    //           id: t.Number(),
    //           title: t.String(),
    //         })
    //       ),
    //       400: t.Object({
    //         message: t.String(),
    //       }),
    //       401: t.Object({
    //         message: t.String(),
    //       }),
    //       403: t.Object({
    //         message: t.String(),
    //       }),
    //       404: t.Object({
    //         message: t.String(),
    //       }),
    //       500: t.Object({
    //         message: t.String(),
    //       }),
    //     },
    //   }
    // )
  );
export default rbacRoutes;
