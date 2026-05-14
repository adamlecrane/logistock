import { prisma } from "@/lib/prisma";

export const PLAN_PRICE = 9.99;
export const PLAN_CURRENCY = "EUR";
export const TRIAL_DAYS = 10;
export const PERIOD_DAYS = 30;

export type PlanState = {
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  hasAccess: boolean;
  daysLeft: number;
  isTrial: boolean;
  expiresAt: Date | null;
  trialEndsAt: Date | null;
};

export function computePlanState(user: {
  planStatus: string;
  planExpiresAt: Date | null;
  trialEndsAt: Date | null;
}): PlanState {
  const now = new Date();
  const trialEnd = user.trialEndsAt;
  const expires = user.planExpiresAt;

  // ACTIVE — paid plan
  if (user.planStatus === "ACTIVE" && expires && expires > now) {
    return {
      status: "ACTIVE",
      hasAccess: true,
      daysLeft: Math.ceil((expires.getTime() - now.getTime()) / 86400000),
      isTrial: false,
      expiresAt: expires,
      trialEndsAt: trialEnd,
    };
  }

  // TRIAL — still within trial window
  if (user.planStatus === "TRIAL" && trialEnd && trialEnd > now) {
    return {
      status: "TRIAL",
      hasAccess: true,
      daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000),
      isTrial: true,
      expiresAt: null,
      trialEndsAt: trialEnd,
    };
  }

  // CANCELLED — keep access until expiresAt if any
  if (user.planStatus === "CANCELLED" && expires && expires > now) {
    return {
      status: "CANCELLED",
      hasAccess: true,
      daysLeft: Math.ceil((expires.getTime() - now.getTime()) / 86400000),
      isTrial: false,
      expiresAt: expires,
      trialEndsAt: trialEnd,
    };
  }

  return {
    status: "EXPIRED",
    hasAccess: false,
    daysLeft: 0,
    isTrial: false,
    expiresAt: expires,
    trialEndsAt: trialEnd,
  };
}

export async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      planStatus: true,
      planExpiresAt: true,
      trialEndsAt: true,
      lastPaymentAt: true,
    },
  });
  if (!user) return null;
  // Owners (super-admin) bypass paywall
  if (user.role === "OWNER") {
    return {
      user,
      state: {
        status: "ACTIVE" as const,
        hasAccess: true,
        daysLeft: 9999,
        isTrial: false,
        expiresAt: null,
        trialEndsAt: null,
      },
    };
  }
  return { user, state: computePlanState(user) };
}
