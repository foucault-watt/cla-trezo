import { notFound } from "next/navigation";
import type { SubventionType } from "@/app/generated/prisma/enums";
import {
  EXCLUDE_DEMO_ASSO,
  EXCLUDE_DEMO_CAMPAIGN,
} from "@/lib/auth/demo-config";
import { prisma } from "@/lib/prisma";
import {
  getCampaignStatus,
  type CampaignStatus,
} from "@/lib/subventions/status";

export type SubventionCampaignOverview = {
  id: string;
  type: SubventionType;
  name: string;
  date: Date;
  publicationDate: Date | null;
  status: CampaignStatus;
  subventionsCount: number;
  totalAmountCents: number;
};

export type SubventionCampaignDetail = SubventionCampaignOverview & {
  subventions: {
    id: string;
    assoId: string;
    assoName: string;
    assoSlug: string;
    reason: string;
    amountCents: number;
    commentary: string | null;
    createdAt: Date;
  }[];
};

function toOverview(campaign: {
  id: string;
  type: SubventionType;
  name: string;
  date: Date;
  publicationDate: Date | null;
  subventions: { amountCents: number }[];
}): SubventionCampaignOverview {
  return {
    id: campaign.id,
    type: campaign.type,
    name: campaign.name,
    date: campaign.date,
    publicationDate: campaign.publicationDate,
    status: getCampaignStatus(campaign.publicationDate),
    subventionsCount: campaign.subventions.length,
    totalAmountCents: campaign.subventions.reduce(
      (sum, s) => sum + s.amountCents,
      0,
    ),
  };
}

export async function listSubventionCampaigns(): Promise<
  SubventionCampaignOverview[]
> {
  const campaigns = await prisma.subventionCampaign.findMany({
    where: EXCLUDE_DEMO_CAMPAIGN,
    orderBy: { date: "desc" },
    include: { subventions: { select: { amountCents: true } } },
  });

  return campaigns.map(toOverview);
}

export async function getSubventionCampaign(
  id: string,
): Promise<SubventionCampaignDetail | null> {
  const campaign = await prisma.subventionCampaign.findUnique({
    where: { id },
    include: {
      subventions: {
        orderBy: { createdAt: "desc" },
        include: { asso: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  if (!campaign) {
    return null;
  }

  return {
    ...toOverview(campaign),
    subventions: campaign.subventions.map((s) => ({
      id: s.id,
      assoId: s.asso.id,
      assoName: s.asso.name,
      assoSlug: s.asso.slug,
      reason: s.reason,
      amountCents: s.amountCents,
      commentary: s.commentary,
      createdAt: s.createdAt,
    })),
  };
}

export async function requireSubventionCampaign(
  id: string,
): Promise<SubventionCampaignDetail> {
  const campaign = await getSubventionCampaign(id);
  if (!campaign) {
    notFound();
  }
  return campaign;
}

export async function listAssosForSelect(): Promise<
  { id: string; name: string }[]
> {
  return prisma.asso.findMany({
    where: EXCLUDE_DEMO_ASSO,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
