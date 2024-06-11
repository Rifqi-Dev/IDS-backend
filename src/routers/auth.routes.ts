import Elysia, { t } from "elysia";
import jwt, { JWTPayloadSpec } from "@elysiajs/jwt";
import prisma from "../config/db.config";
import bearer from "@elysiajs/bearer";

const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "1d",
    })
  )
  .use(bearer())
  .post(
    "/register",
    async ({ set, body, jwt }) => {
      return await prisma.$transaction(async (prisma) => {
        const { email, password, name, phone } = body;

        const passwordHash: string = await Bun.password.hashSync(
          password.toString(),
          {
            algorithm: "bcrypt",
            cost: Number(process.env.PASSWORD_COST) || 10,
          }
        );

        const newUser = await prisma.user.create({
          data: {
            email: email,
            name: name,
            phone: phone,
            password: passwordHash,
          },
        });

        const newEmployee = await prisma.employee.create({
          data: {
            user_id: newUser.id,
            full_name: name,
            position_id: 1,
          },
        });

        const role = await prisma.position.findFirst({
          where: {
            id: newEmployee.position_id,
          },
        });

        const token = await jwt.sign({
          user_id: newUser.id,
          user_role: role?.name || "Guest",
        });

        set.status = 201;
        return {
          message: "User Created",
          token: token,
        };
      });
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
        }),
        password: t.String({
          minLength: 6,
        }),
        name: t.String(),
        phone: t.String(),
      }),
      response: {
        200: t.Object({
          message: t.String(),
          token: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
        500: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .post(
    "/login",
    async ({ body, set, jwt }) => {
      return await prisma.$transaction(async (prisma) => {
        const { email, password } = body;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              {
                email: email,
              },
              {
                phone: email,
              },
            ],
          },
          include: {
            logins: {
              include: {
                posisi: true,
              },
            },
          },
        });

        if (!user) {
          set.status = 404;
          return {
            message: "User Not Found",
          };
        }

        if (!(await Bun.password.verifySync(password, user.password))) {
          set.status = 400;
          return {
            message: "Wrong Password",
          };
        }

        const token = await jwt.sign({
          user_id: user?.id,
          user_role: user?.logins?.posisi?.name || "Guess",
        });

        return {
          message: "Login Success",
          token: token,
        };
      });
    },
    {
      body: t.Object({ email: t.String(), password: t.String() }),
      response: {
        200: t.Object({
          message: t.String(),
          token: t.String(),
        }),
        400: t.Object({
          message: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
      },
    }
  )
  .put(
    "/change-password",
    async ({ set, body, bearer, jwt }) => {
      return await prisma.$transaction(async (prisma) => {
        const jwtValid: JWTPayloadSpec | false = await jwt.verify(bearer);
        const jwtPayload: boolean | any = jwtValid.valueOf();
        const { newPassword, confirmPassword, lastPassword } = body;

        const user = await prisma.user.findFirst({
          where: {
            id: jwtPayload.user_id,
          },
        });

        if (!user) {
          set.status = 404;
          return {
            message: "User Not Found",
          };
        }

        if (newPassword !== confirmPassword) {
          set.status = 400;
          return {
            message: "new password and confirm password missmatch",
          };
        }

        if (!(await Bun.password.verifySync(lastPassword, user.password))) {
          set.status = 400;
          return {
            message: "incorrect last password",
          };
        }

        if (!(await Bun.password.verifySync(newPassword, user.password))) {
          const passwordHash = await Bun.password.hashSync(newPassword, {
            algorithm: "bcrypt",
            cost: Number(process.env.PASSWORD_COST) || 10,
          });
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              password: passwordHash,
            },
          });
        }

        return {
          message: "Password Changed",
        };
      });
    },
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
      headers: t.Object({
        authorization: t.String(),
      }),

      body: t.Object({
        newPassword: t.String({
          minLength: 6,
        }),
        confirmPassword: t.String({
          minLength: 6,
        }),
        lastPassword: t.String({
          minLength: 6,
        }),
      }),

      response: {
        200: t.Object({ message: t.String() }),
        400: t.Object({ message: t.String() }),
        401: t.Object({ message: t.String() }),
      },
    }
  );

export default authRoutes;
