// src/inngest/client.ts
import { Inngest } from "inngest"

/** Shared Inngest client instance used to send events and register functions.*/
export const inngest = new Inngest({ id: "nodemation" })
