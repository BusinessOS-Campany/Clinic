import { describe, expect, it } from "vitest";
import {
  ACTIONS,
  MODULES,
  PERMISSION_CATALOG,
  ROLE_CODES,
  ROLE_PERMISSIONS,
  type PermissionCode,
} from "./catalog";

describe("rbac catalog", () => {
  it("permission codes are unique", () => {
    const codes = PERMISSION_CATALOG.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every code is derived from a known module + action and description", () => {
    for (const p of PERMISSION_CATALOG) {
      expect(p.code, p.code).toBe(`${p.module}:${p.action}`);
      expect(MODULES).toContain(p.module);
      expect(ACTIONS).toContain(p.action);
      expect(p.descriptionAr.length).toBeGreaterThan(0);
      expect(p.descriptionEn.length).toBeGreaterThan(0);
    }
  });

  it("every role has a grant list", () => {
    for (const role of ROLE_CODES) {
      expect(ROLE_PERMISSIONS[role], role).toBeDefined();
    }
  });

  it("every grant references an existing permission", () => {
    const known = new Set(PERMISSION_CATALOG.map((p) => p.code as PermissionCode));
    for (const [role, grants] of Object.entries(ROLE_PERMISSIONS)) {
      for (const grant of grants) {
        expect(known.has(grant), `${role} grants unknown ${grant}`).toBe(true);
      }
    }
  });

  it("grant lists are unique per role", () => {
    for (const [role, grants] of Object.entries(ROLE_PERMISSIONS)) {
      expect(new Set(grants).size, role).toBe(grants.length);
    }
  });

  it("super_admin is granted every catalog permission", () => {
    expect(ROLE_PERMISSIONS.super_admin).toHaveLength(PERMISSION_CATALOG.length);
  });
});