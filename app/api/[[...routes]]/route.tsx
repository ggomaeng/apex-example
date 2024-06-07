/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { readFileSync, writeFileSync } from "fs";

const app = new Frog<{
  State: {
    status: "idle" | "loading" | "success" | "error";
    uuid?: string;
  };
}>({
  assetsPath: "/",
  basePath: "/api",
  initialState: {
    status: "idle",
  },
});

const root = process.cwd();

// this can be a long api call in another route
async function someLongApiCall(id: string) {
  const failOrSuccess = Math.random() > 0.5 ? "success" : "error";
  // completes after 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 5000));
  // use your fav database
  writeFileSync(
    `${root}/out/${id}.json`,
    JSON.stringify({ status: failOrSuccess })
  );
}

app.frame("/", (c) => {
  const { buttonValue, deriveState, inputText, status } = c;

  const state = deriveState((prev) => {
    if (buttonValue === "api") {
      const randomID = Math.random().toString(36).substring(7);
      prev.uuid = randomID;
      someLongApiCall(randomID);
    }
  });

  // task exists
  if (state.uuid) {
    const path = `${root}/out/${state.uuid}.json`;
    try {
      const data = JSON.parse(readFileSync(path, "utf-8"));
      return c.res({
        image: (
          <div tw="flex items-center justify-center text-white text-3xl w-full h-full">
            {JSON.stringify(data)}
          </div>
        ),
      });
    } catch {
      console.log("not done yet");
    }

    return c.res({
      image: (
        <div tw="flex items-center justify-center text-white text-3xl w-full h-full">
          refresh
        </div>
      ),
      intents: [<Button value="refresh">refresh</Button>],
    });
  }

  // default
  return c.res({
    image: (
      <div tw="flex items-center justify-center text-white text-3xl w-full h-full">
        long api call
      </div>
    ),
    intents: [<Button value="api">long api call</Button>],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
