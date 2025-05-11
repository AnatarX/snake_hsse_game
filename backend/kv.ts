/// <reference lib="deno.unstable" />
import { serve } from "https://deno.land/std/http/server.ts";
import { serveDir } from "https://deno.land/std/http/file_server.ts";

const kv = await Deno.openKv();

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/scores") {
    const { value } = await kv.get<[string, string], any[]>(["scores", "all"]);
    const list = value ?? [];
    return new Response(JSON.stringify(list), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST" && url.pathname === "/score") {
    const { name, score } = await req.json();
    const now = new Date().toISOString();
    const { value: stored } = await kv.get<[string, string], any[]>(["scores", "all"]);
    const list = (stored ?? []).concat({ name, score, time: now });
    await kv.set(["scores", "all"], list);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return serveDir(req, {
    fsRoot: "./frontend",
    urlRoot: "",
    showDirListing: false,
    enableCors: true,
  });
});