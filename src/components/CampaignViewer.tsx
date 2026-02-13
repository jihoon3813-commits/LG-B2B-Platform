"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo } from "react";
import { Circle, Check, Square } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

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

interface CampaignViewerProps {
    campaignId?: Id<"campaigns">;
    slug?: string;
}

export default function CampaignViewer({ campaignId, slug }: CampaignViewerProps) {
    const campaignById = useQuery(api.campaigns.get, campaignId ? { id: campaignId } : "skip");
    const campaignBySlug = useQuery(api.campaigns.getBySlug, slug ? { slug } : "skip");

    const campaign = campaignId ? campaignById : campaignBySlug;

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
                                                        <div className="relative inline-block overflow-hidden" style={{ width: block.style.width || '100%', borderRadius: block.style.borderRadius }}>
                                                            {block.content.url ? (
                                                                block.content.url.startsWith('http') || block.content.url.startsWith('data:')
                                                                    ? <img src={block.content.url} alt={block.content.alt} style={{ width: '100%', height: '100%', objectFit: (block.style.width || block.style.height) === 'auto' ? 'contain' : 'cover', display: 'block' }} className="max-w-full h-auto" />
                                                                    : <StorageImage storageId={block.content.url} alt={block.content.alt} style={{ width: '100%', height: '100%', objectFit: (block.style.width || block.style.height) === 'auto' ? 'contain' : 'cover', display: 'block' }} className="max-w-full h-auto" />
                                                            ) : null}

                                                            {/* Overlay */}
                                                            <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: block.style.overlayOpacity ?? 0 }}></div>

                                                            {/* Text on Image */}
                                                            {block.content.overlayText && (
                                                                <div className="absolute inset-0 flex flex-col justify-center p-6 pointer-events-none" style={{ textAlign: block.style.textAlign || 'center' }}>
                                                                    <p className="whitespace-pre-wrap leading-relaxed" style={{
                                                                        fontSize: block.style.fontSize || '24px',
                                                                        color: block.style.color || '#ffffff',
                                                                        fontWeight: block.style.fontWeight,
                                                                        fontFamily: block.style.fontFamily,
                                                                        lineHeight: block.style.lineHeight,
                                                                        letterSpacing: block.style.letterSpacing,
                                                                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                                                                    }}>
                                                                        {block.content.overlayText}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
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
                                            {block.type === 'card' && (
                                                <div className="p-4">
                                                    <div
                                                        style={{
                                                            backgroundColor: block.style.backgroundColor,
                                                            borderRadius: block.style.borderRadius,
                                                            padding: block.style.padding,
                                                            boxShadow: block.style.boxShadow,
                                                            border: `${block.style.borderWidth || '1px'} solid ${block.style.borderColor || 'transparent'}`,
                                                            borderTop: block.style.accentSide === 'top' ? `4px solid ${block.style.accentColor}` : undefined,
                                                            borderBottom: block.style.accentSide === 'bottom' ? `4px solid ${block.style.accentColor}` : undefined,
                                                            borderLeft: block.style.accentSide === 'left' ? `4px solid ${block.style.accentColor}` : undefined,
                                                            borderRight: block.style.accentSide === 'right' ? `4px solid ${block.style.accentColor}` : undefined,
                                                            fontFamily: block.style.fontFamily,
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            height: block.style.height || 'auto'
                                                        }}
                                                    >
                                                        {block.content.badgeText && (
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '-10px',
                                                                    left: '15px',
                                                                    fontSize: '60px',
                                                                    fontWeight: '900',
                                                                    color: block.style.badgeColor || '#e0e7ff',
                                                                    opacity: 0.5,
                                                                    lineHeight: 1,
                                                                    pointerEvents: 'none',
                                                                    zIndex: 0
                                                                }}
                                                            >
                                                                {block.content.badgeText}
                                                            </div>
                                                        )}
                                                        <div className="relative z-10 h-full flex flex-col" style={{ height: block.style.height ? '100%' : 'auto' }}>
                                                            <h4 className="font-black mb-2" style={{ color: block.style.color, fontSize: `calc(${block.style.fontSize || '16px'} + 2px)`, textAlign: block.style.textAlign }}>{block.content.title}</h4>
                                                            <div className="flex flex-col gap-2" style={{
                                                                color: block.style.color,
                                                                fontSize: block.style.fontSize,
                                                                textAlign: block.style.textAlign,
                                                                lineHeight: block.style.lineHeight || '1.6',
                                                                letterSpacing: block.style.letterSpacing,
                                                                fontWeight: block.style.fontWeight,
                                                                whiteSpace: 'pre-wrap'
                                                            }}>
                                                                {(block.content.text || '').split('\n').map((line: string, i: number) => (
                                                                    <div key={i} className="flex gap-2 items-start">
                                                                        {block.content.bulletType && block.content.bulletType !== 'none' && (
                                                                            <div className="mt-1 flex-shrink-0">
                                                                                {block.content.bulletType === 'dot' && <Circle className="w-2 h-2 fill-current" />}
                                                                                {block.content.bulletType === 'check' && <Check className="w-3 h-3" strokeWidth={3} />}
                                                                                {block.content.bulletType === 'square' && <Square className="w-2 h-2 fill-current" />}
                                                                            </div>
                                                                        )}
                                                                        <p className="opacity-80 flex-1">{line}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {block.content.subText && (
                                                                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1" style={{
                                                                    color: block.style.color,
                                                                    opacity: 0.7,
                                                                    fontSize: `calc(${block.style.fontSize || '16px'} - 2px)`
                                                                }}>
                                                                    {(block.content.subText || '').split('\n').map((line: string, i: number) => (
                                                                        <div key={i} className="flex gap-2 items-start">
                                                                            <div className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-50 flex-shrink-0" />
                                                                            <p className="flex-1 leading-relaxed">{line}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}</div>
                                                    </div>
                                                </div>
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
