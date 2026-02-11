"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { useMemo } from "react";

function StorageImage({ storageId, alt, style, className }: { storageId: string, alt?: string, style?: any, className?: string }) {
    const url = useQuery(api.campaigns.getFileUrl, { storageId });
    if (!url) return <div className="bg-gray-100 animate-pulse w-full h-full min-h-[50px]" style={style}></div>;
    return <img src={url} alt={alt || ''} style={style} className={className} />;
}

const getRgba = (hex: string = '#ffffff', opacity: number = 1) => {
    // Basic hex to rgb
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export default function CampaignViewerPage() {
    const params = useParams();
    const campaignId = params.id as any;
    const campaign = useQuery(api.campaigns.get, { id: campaignId });

    // Normalize Data: Support both old (Block[]) and new (Section[]) formats
    const sections = useMemo(() => {
        if (!campaign || !campaign.blocks) return [];

        // Check if new format (first item is section)
        if (campaign.blocks.length > 0 && campaign.blocks[0].type === 'section') {
            return campaign.blocks;
        }

        // Old format: Wrap in one default section
        return [{
            id: 'default_section',
            type: 'section',
            style: { backgroundColor: '#ffffff', backgroundOpacity: 1, padding: '20px' },
            children: campaign.blocks
        }];
    }, [campaign]);

    if (campaign === undefined) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    if (campaign === null) return <div className="flex h-screen items-center justify-center text-gray-500">존재하지 않거나 삭제된 캠페인입니다.</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center shadow-lg">
            <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl flex flex-col relative">
                <div className="flex-1 overflow-x-hidden pb-10">
                    {sections.length === 0 && <div className="p-10 text-center text-gray-400">내용이 없습니다.</div>}

                    {sections.map((section: any) => (
                        <div
                            key={section.id}
                            className="relative"
                            style={{
                                backgroundColor: getRgba(section.style.backgroundColor, section.style.backgroundOpacity),
                                backgroundImage: section.style.backgroundImage ? (section.style.backgroundImage.startsWith('http') ? `url(${section.style.backgroundImage})` : 'none') : 'none',
                                backgroundSize: section.style.backgroundSize || 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                padding: section.style.padding
                            }}
                        >
                            {/* Storage Image Background Layer */}
                            {section.style.backgroundImage && !section.style.backgroundImage.startsWith('http') && (
                                <div className="absolute inset-0 z-0">
                                    <StorageImage storageId={section.style.backgroundImage} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="relative z-10">
                                {section.children && section.children.map((block: any) => {
                                    const LinkWrapper = ({ children }: { children: React.ReactNode }) => {
                                        if (block.content.link) {
                                            return <a href={block.content.link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:opacity-90">{children}</a>;
                                        }
                                        return <>{children}</>;
                                    };

                                    return (
                                        <div key={block.id} className="relative mb-2 last:mb-0">
                                            {block.type === 'text' && (
                                                <LinkWrapper>
                                                    <div style={block.style} className="whitespace-pre-wrap">{block.content.text}</div>
                                                </LinkWrapper>
                                            )}
                                            {block.type === 'image' && (
                                                <LinkWrapper>
                                                    <div style={{ textAlign: block.style.textAlign || 'center' }}>
                                                        {block.content.url ? (
                                                            block.content.url.startsWith('http') || block.content.url.startsWith('data:')
                                                                ? <img src={block.content.url} alt={block.content.alt} style={block.style} className="max-w-full h-auto inline-block" />
                                                                : <StorageImage storageId={block.content.url} alt={block.content.alt} style={block.style} className="max-w-full h-auto inline-block" />
                                                        ) : null}
                                                    </div>
                                                </LinkWrapper>
                                            )}
                                            {block.type === 'video' && (
                                                <div style={{ padding: '0' }}>
                                                    {block.content.url ? (
                                                        <div className="aspect-video w-full bg-black">
                                                            {block.content.url.includes('youtube') || block.content.url.includes('youtu.be') ? (
                                                                <iframe
                                                                    width="100%" height="100%"
                                                                    src={`https://www.youtube.com/embed/${getYouTubeId(block.content.url)}`}
                                                                    frameBorder="0" allow="accelerometer" allowFullScreen
                                                                ></iframe>
                                                            ) : (
                                                                <video src={block.content.url} controls className="w-full h-full" autoPlay={block.content.autoPlay} muted playsInline />
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                            {block.type === 'button' && (
                                                <div style={{ padding: '10px', textAlign: 'center' }}>
                                                    <a
                                                        href={block.content.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'inline-block', ...block.style, textDecoration: 'none' }}
                                                    >
                                                        {block.content.text}
                                                    </a>
                                                </div>
                                            )}
                                            {block.type === 'spacer' && (
                                                <div style={{ height: block.style.height }}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 border-t z-20 relative">
                    Powered by <strong>LG B2B Platform</strong>
                </div>
            </div>
        </div>
    );
}
