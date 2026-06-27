// Common-area units are non-leasable building areas (parking lots, shared
// exterior, etc.) used as an anchor for building-level maintenance. They carry
// no lease and must be excluded from every occupancy / vacancy / tenant count.
export const COMMON_AREA_STATUS = "COMMON_AREA";

export const isCommonArea = (u: { status: string }) => u.status === COMMON_AREA_STATUS;

// Prisma where-fragment: exclude tenants attached to a common-area unit
// (keeps real tenants and tenants with no unit assigned).
export const notCommonAreaTenant = { unit: { status: { not: COMMON_AREA_STATUS } } };
