import { Metadata } from 'next';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import CampaignViewer from "@/components/CampaignViewer";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl && process.env.NODE_ENV === 'production') {
    console.warn("NEXT_PUBLIC_CONVEX_URL is not defined");
}
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// Helper to resolve image URL
async function getImageUrl(image: string) {
    if (!image || !convex) return null;
    if (image.startsWith('http')) return image;
    // It's a storage ID, fetch URL
    return await convex.query(api.campaigns.getFileUrl, { storageId: image });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    if (!convex) return { title: 'Configuration Error' };

    const campaign = await convex.query(api.campaigns.getBySlug, { slug });

    if (!campaign) {
        return {
            title: 'Campaign Not Found',
        };
    }

    const imageUrl = await getImageUrl(campaign.ogImage || "");

    return {
        title: campaign.title,
        description: campaign.ogDescription || 'LG전자 가전구독 공식 캠페인',
        openGraph: {
            title: campaign.title,
            description: campaign.ogDescription || 'LG전자 가전구독 공식 캠페인',
            images: imageUrl ? [imageUrl] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: campaign.title,
            description: campaign.ogDescription || 'LG전자 가전구독 공식 캠페인',
            images: imageUrl ? [imageUrl] : [],
        }
    };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CampaignViewer slug={slug} />;
}
