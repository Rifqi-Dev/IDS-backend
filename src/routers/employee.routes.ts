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
        .decorate('minio', minioClient)
        .post('/create', async ({ set, body, minio, user_role }) => {
          return await prisma.$transaction(async (prisma) => {
            if (!["sa", "admin hr"].includes(user_role.toLowerCase())) {
              set.status = 403;
              return { message: "forbidden" };
            }
            const { file, user_id, place_birth, date_birth, address, date_joined, gender, position, location } = body

            const user = await prisma.user.findFirst({ where: { id: user_id } })

            if (!user) {
              throw new NotFoundError("User not found")
            }

            const updateduser = await prisma.employee.update({
              where: {
                user_id: user_id
              },
              data: {
                picture_profile: file ? `${user_id}.${file.name.split('.').pop()}` : null,
                full_name: user.name,
                place_of_birth: place_birth,
                date_of_birth: date_birth,
                address: address,
                date_joined: date_joined,
                gender: gender,
                position_id: Number(position),
                location_id: Number(location),

              }
            })

            if (file) {
              const filename = `${user_id}.${file.name.split('.').pop()}`
              const buffer = Buffer.from(await file.arrayBuffer());
              await minio.putObject('ids', filename, buffer)
            }

            return { message: `Employee ${user.name} Created` }
          })

        }, {
          headers: t.Object({
            authorization: t.TemplateLiteral('Bearer ${string}'),
          }),
          body: t.Object({
            user_id: t.String({ format: 'uuid' }),
            file: t.Optional(t.Nullable(t.File({
              maxSize: '1m',
              type: ["image/jpeg", "image/png"]
            }))),
            place_birth: t.String(),
            date_birth: t.String({ format: 'date' }),
            address: t.String({ maxLength: 50 }),
            date_joined: t.String({ format: 'date' }),
            gender: t.Enum({ Man: 'man', Woman: 'woman' }),
            position: t.String(),
            location: t.String()
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
          }
        }
        )
  );
export default employeeRoutes;
