import { createTRPCRouter } from "./create-context";
import { emailRouter } from "./routes/email";
import { onesignalRouter } from "./routes/onesignal";

export const appRouter = createTRPCRouter({
  email: emailRouter,
  onesignal: onesignalRouter,
});

export type AppRouter = typeof appRouter;
