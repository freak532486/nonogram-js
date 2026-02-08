import { Static, Type } from "typebox";

export const CheckLoginStatusResponseSchema = Type.Object({
    username: Type.Optional(Type.String())
});

export type CheckLoginStatusResponse = Static<typeof CheckLoginStatusResponseSchema>;