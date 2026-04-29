import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { NodegoatClient } from "./nodegoat.js";

function makeClient() {
  return new NodegoatClient({
    baseUrl:   process.env.NODEGOAT_BASE_URL    ?? "https://demo.nodegoat.io",
    projectId: Number(process.env.NODEGOAT_PROJECT_ID ?? 1),
    apiKey:    process.env.NODEGOAT_API_KEY,
  });
}

function text(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function buildMcpServer() {
  const server = new McpServer({ name: "nodegoat", version: "0.1.0" });

  server.tool(
    "get_model",
    "Fetch the complete data model of the nodegoat project. Returns all Object Types with their fields and sub-object definitions. Call this first to understand type IDs and field IDs before building filters.",
    {},
    async () => text(await makeClient().getModel())
  );

  server.tool(
    "search_persons",
    "Search for persons by name. Provide givenName, familyName, or both. Returns matching Person objects including their object IDs, which you need for subsequent queries.",
    {
      givenName:  z.string().optional().describe("Given name or partial given name, e.g. 'Wilhelm'"),
      familyName: z.string().optional().describe("Family name or partial family name, e.g. 'Grimm'"),
    },
    async ({ givenName, familyName }) => {
      if (!givenName && !familyName)
        return text({ error: "Provide at least one of givenName or familyName." });
      return text(await makeClient().searchPersons(givenName, familyName));
    }
  );

  server.tool(
    "get_object",
    "Fetch a single object by type ID and object ID.",
    {
      typeId:   z.number().int().describe("Object Type ID — 1=Letter, 4=Person, 5=City"),
      objectId: z.number().int().describe("Object ID of the record to retrieve"),
    },
    async ({ typeId, objectId }) => text(await makeClient().getObject(typeId, objectId))
  );

  server.tool(
    "filter_objects",
    "Run an arbitrary nodegoat filter against any Object Type. Pass the complete filter JSON: { form: { <id>: { type_id, source, options, object_definitions?, ... } } }. Use get_model first to find type and field IDs.",
    {
      typeId: z.number().int().describe("Object Type ID to query"),
      filter: z.record(z.unknown()).describe("Complete nodegoat filter object"),
    },
    async ({ typeId, filter }) => text(await makeClient().getObjects(typeId, filter))
  );

  server.tool(
    "get_letters_by_sender",
    "Find all letters sent by a specific person. Use search_persons first to get the person's object ID.",
    {
      personObjectId: z.number().int().describe("Object ID of the sender Person"),
    },
    async ({ personObjectId }) => text(await makeClient().getLettersBySender(personObjectId))
  );

  server.tool(
    "get_letters_by_receiver",
    "Find all letters received by a specific person. Use search_persons first to get the person's object ID.",
    {
      personObjectId: z.number().int().describe("Object ID of the receiver Person"),
    },
    async ({ personObjectId }) => text(await makeClient().getLettersByReceiver(personObjectId))
  );

  server.tool(
    "get_letters_between",
    "Find all letters where one person is the sender AND another is the receiver. Use search_persons to get both object IDs first.",
    {
      senderObjectId:   z.number().int().describe("Object ID of the sender Person"),
      receiverObjectId: z.number().int().describe("Object ID of the receiver Person"),
    },
    async ({ senderObjectId, receiverObjectId }) =>
      text(await makeClient().getLettersBetween(senderObjectId, receiverObjectId))
  );

  return server;
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Railway healthcheck endpoint — must return 200 before traffic is routed
app.get("/health", (_req, res) => {
  res.json({ status: "ok", name: "nodegoat-mcp", version: "0.1.0" });
});

// Root info endpoint
app.get("/", (_req, res) => {
  res.json({ name: "nodegoat-mcp", mcp: "/mcp" });
});

// MCP endpoint — one stateless session per POST
app.post("/mcp", async (req, res) => {
  const server    = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`nodegoat MCP server listening on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
