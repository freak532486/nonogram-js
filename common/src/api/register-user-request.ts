import { Static, Type } from "typebox";

export const RegisterUserRequestSchema = Type.Object({
    username: Type.String(),
    password: Type.String(),
    emailAddress: Type.String()
});

export type RegisterUserRequest = Static<typeof RegisterUserRequestSchema>