export type Role =
  | "platform_admin"
  | "tenant_admin"
  | "tenant_analyst"
  | "tenant_viewer"
  | "service_account";

export interface AuthContext {
  userId: string;
  email: string;
  tenantId: string;
  roles: Role[];
}

export interface RequestMeta {
  requestId: string;
  tenantId: string;
}

export interface ErrorResponse extends RequestMeta {
  error: {
    code: string;
    message: string;
  };
}
