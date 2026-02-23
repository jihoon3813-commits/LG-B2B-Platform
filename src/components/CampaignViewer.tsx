"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Circle, Check, Square, Activity, Award, BarChart3, Bell, Calendar, CheckCircle2, Clock, Cloud, Code, Database, FileText, Gift, Globe, Heart, HelpCircle, Info, Key, Laptop, Layers, LifeBuoy, Lightbulb, Lock, Mail, MapPin, MessageSquare, Monitor, Package, Phone, PieChart, Play, Shield, ShoppingCart, Smartphone, Star, Sun, Target, Trash2, User, Users, Zap, Smile, Send } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const ICON_LIST = {
    Smile, Activity, Award, BarChart3, Bell, Calendar, CheckCircle2, Clock, Cloud, Code, Database, FileText, Gift, Globe, Heart, HelpCircle, Info, Key, Laptop, Layers, LifeBuoy, Lightbulb, Lock, Mail, MapPin, MessageSquare, Monitor, Package, Phone, PieChart, Play, Shield, ShoppingCart, Smartphone, Star, Sun, Target, Trash2, User, Users, Zap
};

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

const formatPhoneNumber = (value: string) => {
    if (!value) return "";
    const raw = value.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.startsWith('02')) {
        if (raw.length > 2 && raw.length <= 5) formatted = raw.replace(/(\d{2})(\d{1,3})/, '$1-$2');
        else if (raw.length > 5 && raw.length <= 9) formatted = raw.replace(/(\d{2})(\d{3})(\d{1,4})/, '$1-$2-$3');
        else if (raw.length > 9) formatted = raw.replace(/(\d{2})(\d{4})(\d{1,4})/, '$1-$2-$3');
    } else {
        if (raw.length > 3 && raw.length <= 6) formatted = raw.replace(/(\d{3})(\d{1,3})/, '$1-$2');
        else if (raw.length > 6 && raw.length <= 10) formatted = raw.replace(/(\d{3})(\d{3})(\d{1,4})/, '$1-$2-$3');
        else if (raw.length > 10) formatted = raw.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }
    return formatted;
};

function InquiryForm({ block, campaignId }: { block: any, campaignId: Id<"campaigns"> }) {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState<Record<string, string>>({});
    const submitInquiry = useMutation(api.campaignInquiries.submit);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        try {
            await submitInquiry({
                campaignId: campaignId,
                name: formData['성함'] || formData['이름'] || formData['고객명'] || formData['신청자'] || Object.values(formData)[0] || '익명',
                phoneNumber: formData['연락처'] || formData['휴대폰'] || formData['전화번호'] || formData['핸드폰'] || formData['전화'] || formData['폰번호'] || '',
                company: formData['회사명'] || formData['소속'] || formData['업체명'],
                email: formData['이메일'] || formData['메일'],
                memo: formData['상담 내용'] || formData['상담내용'] || formData['문의사항'] || formData['문의 내용'] || formData['메모'],
                formData: formData
            });
            setStatus("success");
            setFormData({});
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "오류가 발생했습니다. 다시 시도해 주세요.");
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="p-10 text-center animate-fade-in" style={{ backgroundColor: block.style.backgroundColor, borderRadius: block.style.borderRadius }}>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">신청 완료!</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{block.content.successMessage}</p>
                <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm font-bold text-gray-400 hover:text-gray-600 underline"
                >다시 작성하기</button>
            </div>
        );
    }

    const variant = block.content.variant || 'default';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" style={{ backgroundColor: block.style.backgroundColor, padding: block.style.padding, borderRadius: block.style.borderRadius, boxShadow: block.style.boxShadow }}>
            {block.content.formFields?.map((field: any, i: number) => {
                const inputId = `field-${i}`;
                const baseInputClass = "w-full transition-all outline-none ";
                const variantClasses = {
                    default: "p-3 border rounded-lg focus:ring-2 focus:ring-opacity-20 ",
                    underline: "p-3 border-b border-t-0 border-l-0 border-r-0 rounded-none focus:border-b-2 ",
                    minimal: "p-2 bg-gray-50 rounded focus:bg-white "
                }[variant as 'default' | 'underline' | 'minimal'] || "p-3 border rounded-lg ";

                const style = {
                    borderColor: variant === 'underline' ? block.style.accentColor : undefined,
                };

                return (
                    <div key={i} className="flex flex-col gap-1.5">
                        <label htmlFor={inputId} className="text-xs font-black text-gray-500 ml-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                            <textarea
                                id={inputId}
                                required={field.required}
                                placeholder={field.placeholder}
                                className={baseInputClass + variantClasses + " h-24"}
                                value={formData[field.label] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                            />
                        ) : field.type === 'select' ? (
                            <select
                                id={inputId}
                                required={field.required}
                                className={baseInputClass + variantClasses}
                                value={formData[field.label] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                            >
                                <option value="">선택해 주세요</option>
                                {field.options?.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={inputId}
                                type={field.type}
                                required={field.required}
                                placeholder={field.placeholder}
                                inputMode={field.type === 'tel' ? 'numeric' : undefined}
                                pattern={field.type === 'tel' ? '[0-9-]*' : undefined}
                                className={baseInputClass + variantClasses}
                                value={field.type === 'tel' ? formatPhoneNumber(formData[field.label]) : (formData[field.label] || '')}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (field.type === 'tel') val = val.replace(/[^0-9]/g, '');
                                    setFormData({ ...formData, [field.label]: val });
                                }}
                            />
                        )}
                    </div>
                );
            })}
            <button
                type="submit"
                disabled={status === "submitting"}
                className={`mt-2 w-full p-4 rounded-xl font-black text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${status === "submitting" ? "opacity-70" : "hover:brightness-110"}`}
                style={{ backgroundColor: block.style.accentColor }}
            >
                {status === "submitting" ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        {block.content.submitButtonText}
                    </>
                )}
            </button>
            {status === "error" && <p className="text-center text-xs text-red-500 font-bold">{errorMessage}</p>}
        </form>
    );
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
                                                                    ? <img src={block.content.url} alt={block.content.alt} style={{ width: '100%', height: block.style.height || 'auto', objectFit: block.style.height ? 'cover' : 'contain', display: 'block' }} className="max-w-full h-auto" />
                                                                    : <StorageImage storageId={block.content.url} alt={block.content.alt} style={{ width: '100%', height: block.style.height || 'auto', objectFit: block.style.height ? 'cover' : 'contain', display: 'block' }} className="max-w-full h-auto" />
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
                                            {block.type === 'icon' && (
                                                <LinkWrapper>
                                                    <div style={{ padding: block.style.padding, textAlign: block.style.textAlign || 'center' }}>
                                                        {(() => {
                                                            const IconComp = (ICON_LIST as any)[block.content.iconName || 'Smile'];
                                                            return IconComp ? <IconComp style={{ fontSize: block.style.fontSize, color: block.style.color, width: block.style.fontSize, height: block.style.fontSize, display: 'inline-block' }} /> : null;
                                                        })()}
                                                    </div>
                                                </LinkWrapper>
                                            )}
                                            {block.type === 'stats' && (() => {
                                                const variant = block.content.variant || 'default';
                                                const align = block.style.textAlign || 'center';
                                                const IconComp = block.content.iconName && (ICON_LIST as any)[block.content.iconName];

                                                return (
                                                    <LinkWrapper>
                                                        <div style={{ padding: block.style.padding }}>
                                                            {variant === 'default' && (
                                                                <div style={{ backgroundColor: block.style.backgroundColor, borderRadius: block.style.borderRadius, padding: '30px', textAlign: align as any }}>
                                                                    {IconComp && <div className="mb-3"><IconComp style={{ color: block.style.color, width: '40px', height: '40px', margin: align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0' }} /></div>}
                                                                    <div style={{ color: block.style.color, fontSize: block.style.fontSize, fontWeight: '900', lineHeight: 1.1 }}>{block.content.value}</div>
                                                                    <div style={{ color: '#64748b', fontSize: '15px', marginTop: '8px', fontWeight: 'bold' }}>{block.content.label}</div>
                                                                </div>
                                                            )}
                                                            {variant === 'outline' && (
                                                                <div style={{ backgroundColor: 'transparent', border: `2px solid ${block.style.color}`, borderRadius: block.style.borderRadius, padding: '30px', textAlign: align as any }}>
                                                                    {IconComp && <div className="mb-3"><IconComp style={{ color: block.style.color, width: '40px', height: '40px', margin: align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0' }} /></div>}
                                                                    <div style={{ color: block.style.color, fontSize: block.style.fontSize, fontWeight: '900', lineHeight: 1.1 }}>{block.content.value}</div>
                                                                    <div style={{ color: '#64748b', fontSize: '15px', marginTop: '8px', fontWeight: 'bold' }}>{block.content.label}</div>
                                                                </div>
                                                            )}
                                                            {variant === 'row' && (
                                                                <div style={{ backgroundColor: block.style.backgroundColor, borderRadius: block.style.borderRadius, padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', gap: '20px' }}>
                                                                    {IconComp && <div className="flex-shrink-0"><IconComp style={{ color: block.style.color, width: '48px', height: '48px' }} /></div>}
                                                                    <div style={{ textAlign: 'left' }}>
                                                                        <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>{block.content.label}</div>
                                                                        <div style={{ color: block.style.color, fontSize: block.style.fontSize, fontWeight: '900', lineHeight: 1 }}>{block.content.value}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </LinkWrapper>
                                                );
                                            })()}
                                            {block.type === 'steps' && (() => {
                                                const variant = block.content.variant || 'horizontal';

                                                return (
                                                    <LinkWrapper>
                                                        <div style={{ padding: block.style.padding }}>
                                                            {variant === 'horizontal' && (
                                                                <div className="flex justify-between items-start">
                                                                    {block.content.items?.map((item: any, i: number) => (
                                                                        <div key={i} className="flex-1 flex flex-col items-center relative">
                                                                            {i < (block.content.items?.length || 0) - 1 && (
                                                                                <div className="absolute top-5 left-1/2 w-full h-[2px]" style={{ backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
                                                                            )}
                                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10" style={{ backgroundColor: block.style.accentColor, color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                                                <span className="text-xs font-bold">{i + 1}</span>
                                                                            </div>
                                                                            <div className="mt-3 text-center">
                                                                                <div style={{ fontSize: '13px', fontWeight: '900', color: block.style.accentColor }}>{item.title}</div>
                                                                                <div style={{ fontSize: block.style.fontSize, color: block.style.color, marginTop: '4px', lineHeight: 1.4 }}>{item.desc}</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {variant === 'vertical' && (
                                                                <div className="flex flex-col gap-6 pl-4">
                                                                    {block.content.items?.map((item: any, i: number) => (
                                                                        <div key={i} className="flex items-start relative pb-6 last:pb-0 border-b border-dashed border-gray-100 last:border-0">
                                                                            {i < (block.content.items?.length || 0) - 1 && (
                                                                                <div className="absolute top-10 left-5 w-[2px] h-[calc(100%-40px)]" style={{ backgroundColor: '#e2e8f0', zIndex: 0 }}></div>
                                                                            )}
                                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 flex-shrink-0" style={{ backgroundColor: block.style.accentColor, color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                                                <span className="text-xs font-bold">{i + 1}</span>
                                                                            </div>
                                                                            <div className="ml-5 pt-1">
                                                                                <div style={{ fontSize: '15px', fontWeight: '900', color: block.style.accentColor }}>{item.title}</div>
                                                                                <div style={{ fontSize: block.style.fontSize, color: block.style.color, marginTop: '6px', lineHeight: 1.5 }}>{item.desc}</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </LinkWrapper>
                                                );
                                            })()}
                                            {block.type === 'inquiry' && campaign?._id && (
                                                <div style={{ padding: '20px' }}>
                                                    <InquiryForm block={block} campaignId={campaign._id} />
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
