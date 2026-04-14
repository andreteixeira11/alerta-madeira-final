import { createTRPCRouter } from "./create-context";
import { accountRouter } from "./routes/account";
import { emailRouter } from "./routes/email";
import { onesignalRouter } from "./routes/onesignal";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  email: emailRouter,
  onesignal: onesignalRouter,
});

export type AppRouter = typeof appRouter;
