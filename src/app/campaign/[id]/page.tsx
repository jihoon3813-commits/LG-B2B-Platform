"use client";

import { useParams } from "next/navigation";
import CampaignViewer from "../../../components/CampaignViewer";
import { Id } from "../../../convex/_generated/dataModel";

export default function CampaignViewerPage() {
    const params = useParams();
    const campaignId = params.id as Id<"campaigns">;

    return <CampaignViewer campaignId={campaignId} />;
}
