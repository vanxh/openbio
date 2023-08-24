import { api } from "@/trpc/server";

export default async function Page() {
  const h = await api.example.hello.query({
    text: "world",
  });
  return <div>{h.greeting}</div>;
}
