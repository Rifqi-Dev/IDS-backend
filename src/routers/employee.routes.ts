import Elysia, { NotFoundError, t } from "elysia";
import jwt, { JWTPayloadSpec } from "@elysiajs/jwt";
import prisma from "../config/db.config";
import bearer from "@elysiajs/bearer";
import minioClient from "../config/minio.config";

const employeeRoutes = new Elysia({ prefix: "/employee" })
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
        .decorate("minio", minioClient)
        .post(
          "/",
          async ({ set, body, minio, user_role }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const {
                file,
                user_id,
                place_birth,
                date_birth,
                address,
                date_joined,
                gender,
                position,
                location,
              } = body;

              const user = await prisma.user.findFirst({
                where: { id: user_id },
              });

              if (!user) {
                throw new NotFoundError("User not found");
              }

              const updateduser = await prisma.employee.update({
                where: {
                  user_id: user_id,
                },
                data: {
                  picture_profile: file
                    ? `${user_id}.${file.name.split(".").pop()}`
                    : null,
                  full_name: user.name,
                  place_of_birth: place_birth,
                  date_of_birth: date_birth,
                  address: address,
                  date_joined: date_joined,
                  gender: gender,
                  position_id: Number(position),
                  location_id: Number(location),
                },
              });

              if (file) {
                const filename = `${user_id}.${file.name.split(".").pop()}`;
                const buffer = Buffer.from(await file.arrayBuffer());
                await minio.putObject("ids", filename, buffer);
              }

              return { message: `Employee ${user.name} Created` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
              user_id: t.String({ format: "uuid" }),
              file: t.Optional(
                t.Nullable(
                  t.File({
                    maxSize: "1m",
                    type: ["image/jpeg", "image/png"],
                  })
                )
              ),
              place_birth: t.String(),
              date_birth: t.String({ format: "date" }),
              address: t.String({ maxLength: 50 }),
              date_joined: t.String({ format: "date" }),
              gender: t.Enum({ Male: "Male", Female: "Female" }),
              position: t.String(),
              location: t.String(),
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
          async ({ set, user_role, minio, query }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }

              const { page, pageSize } = query;

              const total = await prisma.employee.count({
                where: {
                  position_id: {
                    not: 1,
                  },
                },
              });

              const employees = await prisma.employee
                .findMany({
                  where: {
                    position_id: {
                      not: 1,
                    },
                  },
                  include: {
                    user: {
                      select: {
                        email: true,
                      },
                    },
                    posisi: {
                      select: { id: true, name: true },
                    },
                    Location: {
                      select: { id: true, name: true },
                    },
                  },
                  skip: Number(page) * Number(pageSize),
                  take: Number(pageSize),
                })
                .then(async (r) => {
                  if (!r) return [];
                  return await Promise.all(
                    r.map(async (employee) => {
                      if (!employee.picture_profile) return employee;

                      let picture_profile = await minio.presignedUrl(
                        "GET",
                        "ids",
                        employee.picture_profile,
                        86400
                      );
                      employee.picture_profile = picture_profile;
                      return {
                        ...employee,
                      };
                    })
                  );
                });

              return {
                total: total,
                data: employees,
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
                    id: t.String({ format: "uuid" }),
                    user_id: t.String({ format: "uuid" }),
                    picture_profile: t.Nullable(t.String({ format: "uri" })),
                    full_name: t.String(),
                    place_of_birth: t.Nullable(t.String()),
                    date_of_birth: t.Nullable(t.Date()),
                    address: t.Nullable(t.String()),
                    date_joined: t.Nullable(t.Date()),
                    gender: t.Nullable(t.String()),
                    position_id: t.Nullable(t.Number()),
                    location_id: t.Nullable(t.Number()),
                    created_at: t.Nullable(t.Date()),
                    updated_at: t.Nullable(t.Date()),
                    posisi: t.Nullable(
                      t.Object({
                        id: t.Number(),
                        name: t.String(),
                      })
                    ),
                    Location: t.Nullable(
                      t.Object({
                        id: t.Number(),
                        name: t.String(),
                      })
                    ),
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
          async ({ set, user_role, body, minio }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }
              const {
                file,
                id,
                place_birth,
                full_name,
                date_birth,
                address,
                date_joined,
                gender,
                position,
                location,
              } = body;

              const existEmployee = await prisma.employee.findFirst({
                where: { id: id },
              });
              if (!existEmployee) throw new NotFoundError("User not found");

              const updateduser = await prisma.employee.update({
                where: {
                  id: id,
                },
                data: {
                  picture_profile: file
                    ? `${existEmployee.user_id}.${file.name.split(".").pop()}`
                    : null,
                  full_name: full_name,
                  place_of_birth: place_birth,
                  date_of_birth: date_birth,
                  address: address,
                  date_joined: date_joined,
                  gender: gender,
                  position_id: Number(position),
                  location_id: Number(location),
                },
              });

              if (file) {
                const filename = `${existEmployee.user_id}.${file.name
                  .split(".")
                  .pop()}`;
                const buffer = Buffer.from(await file.arrayBuffer());
                await minio.putObject("ids", filename, buffer);
              }

              return { message: `Employee ${existEmployee.full_name} Updated` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
              id: t.String({ format: "uuid" }),
              file: t.Optional(
                t.Nullable(
                  t.File({
                    maxSize: "1m",
                    type: ["image/jpeg", "image/png"],
                  })
                )
              ),
              place_birth: t.Optional(t.String()),
              full_name: t.Optional(t.String()),
              date_birth: t.Optional(t.String({ format: "date" })),
              address: t.Optional(t.String({ maxLength: 50 })),
              date_joined: t.Optional(t.String({ format: "date" })),
              gender: t.Optional(t.Enum({ Male: "Male", Female: "Female" })),
              position: t.Optional(t.String()),
              location: t.Optional(t.String()),
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
        .delete(
          "/",
          async ({ set, user_role, query, minio }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }

              const { id } = query;
              const existEmployee = await prisma.employee.findFirst({
                where: { id: id },
              });
              if (!existEmployee) throw new NotFoundError("Employee Not Found");

              await prisma.employee.delete({ where: { id: id } });

              if (existEmployee.picture_profile)
                await minio.removeObject("ids", existEmployee.picture_profile);

              const newEmployee = await prisma.employee.create({
                data: {
                  user_id: existEmployee?.user_id,
                  full_name: existEmployee?.full_name,
                  position_id: 1,
                },
              });

              return { message: `${existEmployee?.full_name} deleted` };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            query: t.Object({
              id: t.String({ format: "uuid" }),
            }),
            response: {
              200: t.Object({ message: t.String() }),
              400: t.Object({ message: t.String() }),
              401: t.Object({ message: t.String() }),
              500: t.Object({ message: t.String() }),
            },
          }
        )
  );
export default employeeRoutes;
