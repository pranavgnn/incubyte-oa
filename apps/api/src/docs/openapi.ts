import {
  authResponseSchema,
  createVehicleRequestSchema,
  errorResponseSchema,
  healthResponseSchema,
  loginRequestSchema,
  purchaseRequestSchema,
  registerRequestSchema,
  restockRequestSchema,
  updateVehicleRequestSchema,
  userSchema,
  vehicleIdParamsSchema,
  vehicleSchema,
  vehicleSearchQuerySchema,
} from "@dealership/shared";
import { z } from "zod";

type JsonSchema = Record<string, unknown>;
type OpenApiObject = Record<string, unknown>;

// Request schemas are converted in input mode, because what the client
// sends is the input side of a transform or coercion (an untrimmed email,
// a numeric string in the query). Responses describe what the API emits.
function toSchema(schema: z.ZodType, io: "input" | "output"): JsonSchema {
  const json: JsonSchema = z.toJSONSchema(schema, { io });
  // OpenAPI 3.1 already implies the 2020-12 dialect.
  delete json.$schema;
  return json;
}

function ref(name: string): JsonSchema {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonContent(schema: JsonSchema): OpenApiObject {
  return { "application/json": { schema } };
}

// One OpenAPI parameter per property of a Zod object schema.
function parameters(schema: z.ZodType, location: "path" | "query"): OpenApiObject[] {
  const { properties = {}, required = [] } = toSchema(schema, "input") as {
    properties?: Record<string, JsonSchema>;
    required?: string[];
  };
  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: location,
    required: location === "path" || required.includes(name),
    schema: property,
  }));
}

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "VALIDATION_ERROR: the request failed validation",
  401: "UNAUTHORIZED: missing, invalid or expired bearer token",
  403: "FORBIDDEN: the caller is not an admin",
  404: "NOT_FOUND: no vehicle with this id",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE: the JSON body is over 10kb",
  500: "INTERNAL_ERROR: unexpected server error",
  503: "SERVICE_UNAVAILABLE: the database is unreachable",
};

type Access = "public" | "user" | "admin";

type OperationSpec = {
  operationId: string;
  summary: string;
  description?: string;
  tag: string;
  access: Access;
  params?: z.ZodType;
  query?: z.ZodType;
  body?: { schema: z.ZodType; required: boolean };
  success: { status: number; description: string; schema?: JsonSchema };
  // Statuses specific to this operation. Statuses implied by access,
  // validation and the body are added automatically.
  errors?: Partial<Record<number, string>>;
};

function operation(spec: OperationSpec): OpenApiObject {
  const errors: Partial<Record<number, string>> = {};
  const validated = spec.params !== undefined || spec.query !== undefined || spec.body;
  if (validated) errors[400] = ERROR_DESCRIPTIONS[400];
  if (spec.access !== "public") errors[401] = ERROR_DESCRIPTIONS[401];
  if (spec.access === "admin") errors[403] = ERROR_DESCRIPTIONS[403];
  if (spec.body) errors[413] = ERROR_DESCRIPTIONS[413];
  for (const [status, description] of Object.entries(spec.errors ?? {})) {
    errors[Number(status)] = description ?? ERROR_DESCRIPTIONS[Number(status)];
  }
  errors[500] = ERROR_DESCRIPTIONS[500];

  const responses: OpenApiObject = {
    [spec.success.status]: {
      description: spec.success.description,
      ...(spec.success.schema && { content: jsonContent(spec.success.schema) }),
    },
  };
  for (const [status, description] of Object.entries(errors)) {
    responses[status] = { description, content: jsonContent(ref("ErrorResponse")) };
  }

  const description = [spec.access === "admin" ? "Admin only." : undefined, spec.description]
    .filter(Boolean)
    .join(" ");

  return {
    operationId: spec.operationId,
    summary: spec.summary,
    ...(description && { description }),
    tags: [spec.tag],
    ...(spec.access !== "public" && { security: [{ bearerAuth: [] }] }),
    ...((spec.params || spec.query) && {
      parameters: [
        ...(spec.params ? parameters(spec.params, "path") : []),
        ...(spec.query ? parameters(spec.query, "query") : []),
      ],
    }),
    ...(spec.body && {
      requestBody: {
        required: spec.body.required,
        content: jsonContent(toSchema(spec.body.schema, "input")),
      },
    }),
    responses,
  };
}

const vehicleList: JsonSchema = { type: "array", items: ref("Vehicle") };

// Builds the OpenAPI 3.1 document from the shared Zod contracts, so the
// docs cannot drift from what the validate middleware enforces.
export function buildOpenApiDocument(): OpenApiObject {
  return {
    openapi: "3.1.0",
    info: {
      title: "Car Dealership Inventory API",
      version: "1.0.0",
      description:
        "Every non-2xx response uses the ErrorResponse shape. Protected routes take a JWT from /api/auth/register or /api/auth/login as a bearer token.",
    },
    servers: [{ url: "/" }],
    tags: [{ name: "Health" }, { name: "Auth" }, { name: "Vehicles" }, { name: "Inventory" }],
    paths: {
      "/api/health": {
        get: operation({
          operationId: "checkHealth",
          summary: "Check that the API and its database are up",
          tag: "Health",
          access: "public",
          success: { status: 200, description: "Healthy", schema: ref("HealthResponse") },
          errors: { 503: undefined },
        }),
      },
      "/api/auth/register": {
        post: operation({
          operationId: "register",
          summary: "Create a user account",
          description:
            "Always creates role user. The email is trimmed and lowercased before the format check. The password must be 8 characters to 72 UTF-8 bytes.",
          tag: "Auth",
          access: "public",
          body: { schema: registerRequestSchema, required: true },
          success: { status: 201, description: "Registered", schema: ref("AuthResponse") },
          errors: { 409: "CONFLICT: the email is already registered" },
        }),
      },
      "/api/auth/login": {
        post: operation({
          operationId: "login",
          summary: "Sign in and receive a token",
          tag: "Auth",
          access: "public",
          body: { schema: loginRequestSchema, required: true },
          success: { status: 200, description: "Signed in", schema: ref("AuthResponse") },
          errors: { 401: "UNAUTHORIZED: invalid credentials" },
        }),
      },
      "/api/auth/me": {
        get: operation({
          operationId: "getCurrentUser",
          summary: "Get the signed-in user",
          tag: "Auth",
          access: "user",
          success: { status: 200, description: "The current user", schema: ref("User") },
        }),
      },
      "/api/vehicles": {
        get: operation({
          operationId: "listVehicles",
          summary: "List all vehicles",
          tag: "Vehicles",
          access: "user",
          success: { status: 200, description: "All vehicles", schema: vehicleList },
        }),
        post: operation({
          operationId: "createVehicle",
          summary: "Add a vehicle",
          tag: "Vehicles",
          access: "admin",
          body: { schema: createVehicleRequestSchema, required: true },
          success: { status: 201, description: "Created", schema: ref("Vehicle") },
        }),
      },
      "/api/vehicles/search": {
        get: operation({
          operationId: "searchVehicles",
          summary: "Search vehicles",
          description:
            "q is a partial, case-insensitive match on make or model. Price bounds are inclusive integers and minPrice must not exceed maxPrice.",
          tag: "Vehicles",
          access: "user",
          query: vehicleSearchQuerySchema,
          success: { status: 200, description: "Matching vehicles", schema: vehicleList },
        }),
      },
      "/api/vehicles/{id}": {
        put: operation({
          operationId: "updateVehicle",
          summary: "Update vehicle details",
          description:
            "At least one field is required. Quantity changes only through purchase and restock. A null imageUrl removes the image.",
          tag: "Vehicles",
          access: "admin",
          params: vehicleIdParamsSchema,
          body: { schema: updateVehicleRequestSchema, required: true },
          success: { status: 200, description: "Updated", schema: ref("Vehicle") },
          errors: { 404: undefined },
        }),
        delete: operation({
          operationId: "deleteVehicle",
          summary: "Delete a vehicle",
          tag: "Vehicles",
          access: "admin",
          params: vehicleIdParamsSchema,
          success: { status: 204, description: "Deleted" },
          errors: { 404: undefined },
        }),
      },
      "/api/vehicles/{id}/purchase": {
        post: operation({
          operationId: "purchaseVehicle",
          summary: "Buy one unit of a vehicle",
          description: "Takes exactly one unit. The body may be omitted or {}.",
          tag: "Inventory",
          access: "user",
          params: vehicleIdParamsSchema,
          body: { schema: purchaseRequestSchema, required: false },
          success: { status: 200, description: "Purchased", schema: ref("Vehicle") },
          errors: { 404: undefined, 409: "OUT_OF_STOCK: the vehicle has no units left" },
        }),
      },
      "/api/vehicles/{id}/restock": {
        post: operation({
          operationId: "restockVehicle",
          summary: "Add units to a vehicle",
          tag: "Inventory",
          access: "admin",
          params: vehicleIdParamsSchema,
          body: { schema: restockRequestSchema, required: true },
          success: { status: 200, description: "Restocked", schema: ref("Vehicle") },
          errors: { 404: undefined },
        }),
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        ErrorResponse: toSchema(errorResponseSchema, "output"),
        HealthResponse: toSchema(healthResponseSchema, "output"),
        User: toSchema(userSchema, "output"),
        AuthResponse: toSchema(authResponseSchema, "output"),
        Vehicle: toSchema(vehicleSchema, "output"),
      },
    },
  };
}
