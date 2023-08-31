import { ImageResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const calSans = await fetch(
    new URL("../../../../public/fonts/CalSans-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());
  const inter = await fetch(
    new URL("../../../../public/fonts/Inter-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") ?? "OpenBio";
  const description =
    searchParams.get("description") ??
    "Create beautiful link in bio pages for free.";

  return new ImageResponse(
    (
      <div tw="relative flex flex-col bg-white text-black items-center justify-center w-full h-full">
        <div tw="max-w-[75vw] relative flex flex-col">
          <h1 style={{ fontFamily: "Cal Sans" }} tw="text-7xl">
            {title}
          </h1>
          <p tw="text-black/50 text-3xl">
            {description.slice(0, 100).replace(/(<([^>]+)>)/gi, "")}

            {description.length > 100 ? "..." : ""}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          data: calSans,
          name: "Cal Sans",
          style: "normal",
          weight: 600,
        },
        {
          data: inter,
          name: "Inter",
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
