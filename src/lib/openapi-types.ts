/**
 * Minimal typing for the OpenAPI 3.x spec shapes we actually consume in the
 * API-docs UI.  We only type what we render — we don't try to replicate the
 * full specification object model.
 */

export interface OpenApiInfo {
  title: string;
  description?: string;
  version: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  $ref?: string;
  required?: string[];
  default?: unknown;
  enum?: unknown[];
  additionalProperties?: OpenApiSchema | boolean;
}

export interface OpenApiParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
}

export interface OpenApiRequestBody {
  required?: boolean;
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
}

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options";

export type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>>;

export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  paths?: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: { name: string; description?: string }[];
}

/** Flat representation used for rendering individual endpoint rows */
export interface FlatEndpoint {
  path: string;
  method: HttpMethod;
  operation: OpenApiOperation;
  tags: string[];
}

/** Extract a flat list of endpoints from a spec */
export function flattenEndpoints(spec: OpenApiSpec): FlatEndpoint[] {
  const endpoints: FlatEndpoint[] = [];
  const methods: HttpMethod[] = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "head",
    "options",
  ];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of methods) {
      const op = pathItem[method];
      if (op) {
        endpoints.push({
          path,
          method,
          operation: op,
          tags: op.tags ?? ["Other"],
        });
      }
    }
  }

  return endpoints;
}

/** Group flat endpoints by their first tag */
export function groupByTag(
  endpoints: FlatEndpoint[]
): Map<string, FlatEndpoint[]> {
  const map = new Map<string, FlatEndpoint[]>();
  for (const ep of endpoints) {
    const tag = ep.tags[0] ?? "Other";
    if (!map.has(tag)) map.set(tag, []);
    map.get(tag)!.push(ep);
  }
  return map;
}
