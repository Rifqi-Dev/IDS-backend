import Elysia, { NotFoundError, t } from "elysia";
import jwt, { JWTPayloadSpec } from "@elysiajs/jwt";
import prisma from "../config/db.config";
import bearer from "@elysiajs/bearer";
import minioClient from "../config/minio.config";

const userRoutes = new Elysia({ prefix: "/user" })
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
        .get(
          "/profile",
          async ({ set, user_id, minio }) => {
            return await prisma.$transaction(async (prisma) => {
              const info = await prisma.employee
                .findFirst({
                  where: { user_id: user_id },
                  include: {
                    user: {
                      select: {
                        email: true,
                        phone: true,
                      },
                    },
                    posisi: {
                      select: {
                        name: true,
                      },
                    },
                    Location: {
                      select: {
                        name: true,
                      },
                    },
                  },
                })
                .then(async (r) => {
                  if (!r) throw new NotFoundError("User Not Found");
                  return {
                    id: r.id,
                    user_id: r.user_id,
                    picture_profile: r.picture_profile
                      ? await minio.presignedUrl(
                          "GET",
                          "ids",
                          r.picture_profile,
                          86400
                        )
                      : null,
                    full_name: r.full_name,
                    place_birth: r.place_of_birth,
                    date_birth: r.date_of_birth,
                    address: r.address,
                    date_joined: r.date_joined,
                    gender: r.gender,
                    email: r.user.email,
                    phone: r.user.phone,
                    role: r.posisi?.name,
                    location: r.Location?.name,
                  };
                });

              return info;
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            response: {
              200: t.Object({
                id: t.String(),
                user_id: t.String(),
                picture_profile: t.Nullable(t.String()),
                full_name: t.MaybeEmpty(t.String()),
                place_birth: t.Nullable(t.String()),
                date_birth: t.Nullable(t.Date()),
                address: t.Nullable(t.String()),
                date_joined: t.Nullable(t.Date()),
                gender: t.Nullable(t.String()),
                email: t.String(),
                phone: t.String(),
                role: t.MaybeEmpty(t.String()),
                location: t.MaybeEmpty(t.String()),
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
          "/profile",
          async ({ set, user_id, user_role, minio, body }) => {
            return await prisma.$transaction(async (prisma) => {
              const {
                file,
                place_birth,
                full_name,
                date_birth,
                address,
                gender,
              } = body;

              console.log(user_role);

              if (user_role === "Guest") {
                set.status = 403;
                return {
                  message: "Forbidden",
                };
              }

              const updatedProfile = await prisma.employee.update({
                data: {
                  picture_profile: file
                    ? `${user_id}.${file.name.split(".").pop()}`
                    : null,
                  full_name: full_name,
                  place_of_birth: place_birth,
                  date_of_birth: date_birth,
                  address: address,

                  gender: gender,
                },
                where: { user_id: user_id },
              });

              if (file) {
                const filename = `${user_id}.${file.name.split(".").pop()}`;
                const buffer = Buffer.from(await file.arrayBuffer());
                await minio.putObject("ids", filename, buffer);
              }

              return {
                message: "Profile updated",
              };
            });
          },
          {
            headers: t.Object({
              authorization: t.TemplateLiteral("Bearer ${string}"),
            }),
            body: t.Object({
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
              gender: t.Optional(t.Enum({ Male: "Male", Female: "Female" })),
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
          "/list",
          async ({ set, user_role, query }) => {
            return await prisma.$transaction(async (prisma) => {
              if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
                set.status = 403;
                return { message: "forbidden" };
              }

              const { keyword } = query;

              return await prisma.user.findMany({
                where: {
                  OR: [
                    {
                      email: { startsWith: `%${keyword}`, mode: "insensitive" },
                    },
                    {
                      phone: { startsWith: `%${keyword}`, mode: "insensitive" },
                    },
                  ],
                  logins: {
                    position_id: 1,
                  },
                },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
                take: 10,
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
                  id: t.String({ format: "uuid" }),
                  name: t.String(),
                  email: t.String({ format: "email" }),
                  phone: t.String(),
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
export default userRoutes;
