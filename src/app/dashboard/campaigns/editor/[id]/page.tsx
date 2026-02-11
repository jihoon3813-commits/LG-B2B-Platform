"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import {
    Type, Image as ImageIcon, Video, MoveVertical, Save, ExternalLink, ChevronLeft, MousePointer2, Pencil, Bold, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Layout, ImagePlus
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../../../convex/_generated/dataModel";

// Types
interface Block {
    id: string;
    type: 'text' | 'image' | 'video' | 'button' | 'spacer';
    content: {
        text?: string;
        url?: string;
        alt?: string;
        link?: string;
        autoPlay?: boolean;
    };
    style: {
        fontSize?: string;
        textAlign?: 'left' | 'center' | 'right';
        color?: string;
        backgroundColor?: string;
        fontWeight?: string;
        fontFamily?: string;
        borderRadius?: string;
        padding?: string;
        height?: string;
        width?: string;
    };
}

interface Section {
    id: string;
    type: 'section';
    style: {
        backgroundColor?: string;
        backgroundOpacity?: number;
        backgroundImage?: string;
        backgroundSize?: 'cover' | 'contain' | 'auto';
        padding?: string;
    };
    children: Block[];
}

const WIDGETS = [
    { type: 'text', label: '텍스트', icon: Type },
    { type: 'image', label: '이미지', icon: ImageIcon },
    { type: 'video', label: '동영상', icon: Video },
    { type: 'button', label: '버튼', icon: MousePointer2 },
    { type: 'spacer', label: '여백', icon: MoveVertical },
];

const generateId = (prefix: string) => prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

function StorageImage({ storageId, alt, style, className }: { storageId: string, alt?: string, style?: React.CSSProperties, className?: string }) {
    const url = useQuery(api.campaigns.getFileUrl, { storageId });
    if (!url) return <div className="bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400 w-full h-full min-h-[50px]">Loading...</div>;
    return <img src={url} alt={alt || ''} style={style} className={className} />;
}

const getRgba = (hex: string = '#ffffff', opacity: number = 1) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function CampaignEditorPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as Id<"campaigns">;

    const campaign = useQuery(api.campaigns.get, { id: campaignId });
    const updateCampaign = useMutation(api.campaigns.update);
    const generateUploadUrl = useMutation(api.campaigns.generateUploadUrl);

    const [sections, setSections] = useState<Section[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'block' | 'section' | null>(null);
    const [title, setTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Define Handlers first to avoid hoisting issues
    const addSection = useCallback(() => {
        const newSection: Section = {
            id: generateId('sec_'),
            type: 'section',
            style: { backgroundColor: '#ffffff', backgroundOpacity: 1, padding: '20px 0px' },
            children: []
        };
        setSections(prev => [...prev, newSection]);
        setSelectedId(newSection.id);
        setSelectedType('section');
    }, []);

    const updateSection = (id: string, updates: Partial<Section>) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        if (direction === 'up' && index > 0) {
            [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        }
        setSections(newSections);
    };

    const deleteSection = (id: string) => {
        if (!confirm("섹션을 삭제하면 내부 위젯도 모두 삭제됩니다. 계속하시겠습니까?")) return;
        setSections(prev => prev.filter(s => s.id !== id));
        setSelectedId(null);
        setSelectedType(null);
    };

    const getDefaultContent = (type: string) => {
        switch (type) {
            case 'text': return { text: '여기에 텍스트를 입력하세요.', link: '' };
            case 'button': return { text: '클릭하세요', url: '#' };
            case 'image': return { url: '', alt: '이미지 설명', link: '' };
            case 'video': return { url: '', autoPlay: false };
            default: return {};
        }
    };
    const getDefaultStyle = (type: string): Block['style'] => {
        switch (type) {
            case 'text': return { fontSize: '16px', color: '#000000', backgroundColor: 'transparent', textAlign: 'left', fontWeight: 'normal', fontFamily: 'sans-serif', padding: '10px' };
            case 'button': return { backgroundColor: '#000000', color: '#ffffff', borderRadius: '4px', padding: '12px 20px', width: '100%', textAlign: 'center', fontSize: '16px' };
            case 'image': return { width: '100%', borderRadius: '0px', textAlign: 'center' };
            case 'spacer': return { height: '20px' };
            default: return {};
        }
    };

    const addBlock = (type: string) => {
        let targetSectionId = null;
        if (selectedType === 'section') targetSectionId = selectedId;
        else if (selectedType === 'block') {
            const parent = sections.find(s => s.children.find(b => b.id === selectedId));
            if (parent) targetSectionId = parent.id;
        }

        if (!targetSectionId && sections.length > 0) targetSectionId = sections[sections.length - 1].id;
        if (!targetSectionId) { addSection(); return; }

        const newBlock: Block = {
            id: generateId('blk_'),
            type: type as Block['type'],
            content: getDefaultContent(type),
            style: getDefaultStyle(type),
        };

        setSections(prev => prev.map(s => {
            if (s.id === targetSectionId) return { ...s, children: [...s.children, newBlock] };
            return s;
        }));
        setSelectedId(newBlock.id);
        setSelectedType('block');
    };

    const updateBlock = (blockId: string, updates: Partial<Block>) => {
        setSections(prev => prev.map(s => ({
            ...s,
            children: s.children.map(b => b.id === blockId ? { ...b, ...updates } : b)
        })));
    };

    const moveBlock = (sectionId: string, blockIndex: number, direction: 'up' | 'down') => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const newChildren = [...s.children];
            if (direction === 'up' && blockIndex > 0) {
                [newChildren[blockIndex], newChildren[blockIndex - 1]] = [newChildren[blockIndex - 1], newChildren[blockIndex]];
            } else if (direction === 'down' && blockIndex < newChildren.length - 1) {
                [newChildren[blockIndex], newChildren[blockIndex + 1]] = [newChildren[blockIndex + 1], newChildren[blockIndex]];
            }
            return { ...s, children: newChildren };
        }));
    };

    const deleteBlock = (sectionId: string, blockId: string) => {
        if (!confirm("위젯을 삭제하시겠습니까?")) return;
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, children: s.children.filter(b => b.id !== blockId) };
        }));
        setSelectedId(null);
        setSelectedType(null);
    };

    useEffect(() => {
        if (campaign) {
            setTitle(campaign.title);
            const loadedBlocks = (campaign.blocks as (Section | Block)[]) || [];
            if (loadedBlocks.length > 0 && (loadedBlocks[0] as any).type !== 'section') {
                const defaultSection: Section = {
                    id: 'sec_migrated',
                    type: 'section',
                    style: { backgroundColor: '#ffffff', backgroundOpacity: 1, padding: '20px' },
                    children: loadedBlocks as Block[]
                };
                setSections([defaultSection]);
            } else {
                setSections(loadedBlocks as Section[]);
            }
            if (loadedBlocks.length === 0) addSection();
        }
    }, [campaign, addSection]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateCampaign({ id: campaignId, title, blocks: sections, status: "published" });
        setIsSaving(false);
        alert("저장되었습니다.");
    };

    const handleImageUpload = async (file: File) => {
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            return storageId;
        } catch (e) {
            console.error(e);
            alert("업로드 실패");
            return "";
        }
    };

    const changeFontSize = (current: string | undefined, delta: number) => ((parseInt(current || '16') + delta) + 'px');

    if (!campaign) return <div className="p-10 text-center">로딩 중...</div>;

    let selectedSection: Section | undefined;
    let selectedBlock: Block | undefined;

    if (selectedType === 'section') {
        selectedSection = sections.find(s => s.id === selectedId);
    } else if (selectedType === 'block') {
        selectedSection = sections.find(s => s.children.find(b => b.id === selectedId));
        if (selectedSection) selectedBlock = selectedSection.children.find(b => b.id === selectedId);
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center p-4 bg-white border-b shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-black"><ChevronLeft /></button>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold bg-transparent border-none focus:ring-0 outline-none placeholder-gray-300" />
                </div>
                <div className="flex gap-2">
                    <a href={`/campaign/${campaignId}`} target="_blank" className="btn btn-secondary text-sm"><ExternalLink className="w-4 h-4 mr-2" /> 미리보기</a>
                    <button onClick={handleSave} className="btn btn-primary text-sm" disabled={isSaving}><Save className="w-4 h-4 mr-2" /> {isSaving ? "저장 중..." : "저장하기"}</button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-64 bg-gray-50 border-r p-4 flex flex-col gap-2 overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">위젯 추가</h3>
                    {WIDGETS.map(widget => (
                        <button key={widget.type} onClick={() => addBlock(widget.type)} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-all hover:border-[var(--primary)] text-left group">
                            <widget.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                            <span className="text-sm font-medium">{widget.label}</span>
                        </button>
                    ))}
                    <div className="my-4 border-t pt-4">
                        <button onClick={addSection} className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-700 font-medium text-sm">
                            <Layout className="w-4 h-4" /> 섹션 추가
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-gray-100 flex justify-center items-center overflow-auto p-8" onClick={() => { setSelectedId(null); setSelectedType(null); }}>
                    <div className="w-[375px] min-h-[667px] bg-white shadow-2xl rounded-[40px] overflow-hidden border-[12px] border-gray-900 relative flex flex-col">
                        <div className="h-6 bg-gray-900 flex justify-center items-center"><div className="w-16 h-1 bg-gray-700 rounded-full"></div></div>

                        <div className="flex-1 overflow-y-auto bg-white relative">
                            {sections.map((section, sIndex) => (
                                <div
                                    key={section.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedId(section.id); setSelectedType('section'); }}
                                    className={`relative group border-2 transition-all min-h-[50px]
                                    ${(selectedType === 'section' && selectedId === section.id) ? "border-blue-500 z-10" : "border-transparent hover:border-blue-200"}
                                `}
                                    style={{
                                        backgroundColor: getRgba(section.style.backgroundColor, section.style.backgroundOpacity),
                                        backgroundImage: section.style.backgroundImage ? (section.style.backgroundImage.startsWith('http') ? `url(${section.style.backgroundImage})` : 'none') : 'none',
                                        backgroundSize: section.style.backgroundSize || 'cover',
                                        backgroundPosition: 'center',
                                        padding: section.style.padding
                                    }}
                                >
                                    {section.style.backgroundImage && !section.style.backgroundImage.startsWith('http') && (
                                        <div className="absolute inset-0 z-[-1] overflow-hidden">
                                            <StorageImage storageId={section.style.backgroundImage} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {(selectedType === 'section' && selectedId === section.id) && (
                                        <div className="absolute right-2 -top-10 flex gap-2 bg-blue-500 text-white rounded-lg shadow-lg px-3 py-1.5 z-50 text-xs font-bold items-center">
                                            <button onClick={(e) => { e.stopPropagation(); moveSection(sIndex, 'up'); }} className="hover:scale-125 transition-transform">▲</button>
                                            <button onClick={(e) => { e.stopPropagation(); moveSection(sIndex, 'down'); }} className="hover:scale-125 transition-transform">▼</button>
                                            <div className="w-[1px] h-3 bg-white/30 mx-1"></div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} className="text-red-200">DELETE</button>
                                        </div>
                                    )}

                                    {section.children.map((block, bIndex) => (
                                        <div
                                            key={block.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedId(block.id); setSelectedType('block'); }}
                                            className={`relative group/block cursor-pointer
                                            ${(selectedType === 'block' && selectedId === block.id) ? "ring-2 ring-purple-500 z-20" : "hover:ring-1 hover:ring-purple-200"}
                                        `}
                                        >
                                            {(selectedType === 'block' && selectedId === block.id) && (
                                                <div className="absolute left-2 -top-8 flex gap-2 z-50 bg-purple-500 p-1.5 rounded-lg shadow-xl text-white text-[10px] font-bold">
                                                    <button onClick={(e) => { e.stopPropagation(); moveBlock(section.id, bIndex, 'up'); }}>▲</button>
                                                    <button onClick={(e) => { e.stopPropagation(); moveBlock(section.id, bIndex, 'down'); }}>▼</button>
                                                    <div className="w-[1px] h-3 bg-white/30"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteBlock(section.id, block.id); }} className="text-red-100">DEL</button>
                                                </div>
                                            )}

                                            <div className="relative pointer-events-none">
                                                {block.type === 'text' && <div style={block.style} className="whitespace-pre-wrap">{block.content.text}</div>}
                                                {block.type === 'image' && (
                                                    <div style={{ textAlign: block.style.textAlign || 'center' }}>
                                                        {block.content.url ? (
                                                            block.content.url.startsWith('http')
                                                                ? <img src={block.content.url} alt="" style={block.style} />
                                                                : <StorageImage storageId={block.content.url} style={block.style} />
                                                        ) : <div className="bg-gray-100 h-20 flex items-center justify-center text-xs text-gray-400">이미지 없음</div>}
                                                    </div>
                                                )}
                                                {block.type === 'video' && <div className="bg-black aspect-video flex items-center justify-center text-[10px] text-gray-500">Video Preview</div>}
                                                {block.type === 'button' && <div style={{ textAlign: 'center', padding: '10px' }}><span style={{ display: 'inline-block', ...block.style }}>{block.content.text}</span></div>}
                                                {block.type === 'spacer' && <div style={{ height: block.style.height }}></div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-80 bg-white border-l p-5 overflow-y-auto shadow-inner">
                    {selectedType === 'section' && selectedSection && (
                        <div className="space-y-6">
                            <h3 className="font-bold border-b pb-3 flex items-center gap-2"><Layout className="w-4 h-4 text-blue-500" /> 섹션 설정</h3>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">배경색 & 투명도</label>
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-none" value={selectedSection.style.backgroundColor || '#ffffff'} onChange={(e) => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, backgroundColor: e.target.value } })} />
                                    <input type="range" min="0" max="1" step="0.1" className="flex-1" value={selectedSection.style.backgroundOpacity ?? 1} onChange={(e) => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, backgroundOpacity: parseFloat(e.target.value) } })} />
                                    <span className="text-[10px] font-mono">{Math.round((selectedSection.style.backgroundOpacity ?? 1) * 100)}%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">배경 이미지</label>
                                <label className="btn btn-sm btn-outline w-full cursor-pointer flex items-center justify-center gap-2 border-dashed h-12 bg-gray-50 hover:bg-white transition-colors">
                                    <ImagePlus className="w-4 h-4" /> 업로드
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const id = await handleImageUpload(file);
                                            if (id) updateSection(selectedSection!.id, { style: { ...selectedSection!.style, backgroundImage: id } });
                                        }
                                    }} />
                                </label>
                                {selectedSection.style.backgroundImage && <button onClick={() => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, backgroundImage: '' } })} className="mt-2 text-[10px] text-red-500 hover:underline">이미지 제거</button>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">내부 여백 (Padding)</label>
                                <input type="text" className="w-full p-2 border rounded-lg text-sm bg-gray-50" placeholder="20px 0px" value={selectedSection.style.padding} onChange={(e) => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, padding: e.target.value } })} />
                            </div>
                        </div>
                    )}

                    {selectedType === 'block' && selectedBlock && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="font-bold flex items-center gap-2 uppercase text-sm"><Pencil className="w-4 h-4 text-purple-500" /> {selectedBlock.type} 관리</h3>
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">ID: {selectedBlock.id.slice(-4)}</span>
                            </div>

                            {selectedBlock.type === 'text' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">내용</label>
                                        <textarea className="w-full p-3 border rounded-xl text-sm h-32 bg-gray-50 focus:bg-white transition-colors" value={selectedBlock.content.text || ''} onChange={(e) => updateBlock(selectedBlock!.id, { content: { ...selectedBlock!.content, text: e.target.value } })} />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-400 mb-1 block">크기</label>
                                            <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                                                <button className="w-6 h-6 hover:bg-white rounded" onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, fontSize: changeFontSize(selectedBlock!.style.fontSize, -1) } })}>-</button>
                                                <span className="flex-1 text-center text-xs font-mono">{selectedBlock.style.fontSize}</span>
                                                <button className="w-6 h-6 hover:bg-white rounded" onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, fontSize: changeFontSize(selectedBlock!.style.fontSize, 1) } })}>+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 mb-1 block">정렬</label>
                                            <div className="flex gap-1 border rounded-lg p-1 bg-gray-50 text-gray-400">
                                                {[
                                                    { v: 'left', i: AlignLeft },
                                                    { v: 'center', i: AlignCenter },
                                                    { v: 'right', i: AlignRight }
                                                ].map(a => (
                                                    <button key={a.v} onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, textAlign: a.v as any } })} className={`p-1 rounded ${selectedBlock!.style.textAlign === a.v ? "bg-white text-purple-600 shadow-sm" : "hover:bg-white"}`}><a.i className="w-4 h-4" /></button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className={`flex-1 flex justify-center items-center gap-2 p-2 rounded-lg border text-xs font-bold ${selectedBlock.style.fontWeight === 'bold' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-gray-50"}`} onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, fontWeight: selectedBlock!.style.fontWeight === 'bold' ? 'normal' : 'bold' } })}><Bold className="w-4 h-4" /> 굵게</button>
                                        <div className="flex-1 flex gap-2 p-2 rounded-lg border bg-gray-50 items-center justify-center">
                                            <input type="color" className="w-5 h-5 border-none cursor-pointer" value={selectedBlock.style.color} onChange={(e) => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, color: e.target.value } })} />
                                            <span className="text-[10px] font-mono">TEXT</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">배경색</label>
                                        <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border">
                                            <input type="color" className="w-6 h-6 border-none cursor-pointer" value={selectedBlock.style.backgroundColor === 'transparent' ? '#ffffff' : selectedBlock.style.backgroundColor} onChange={(e) => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, backgroundColor: e.target.value } })} />
                                            <button className="text-[10px] text-gray-400 hover:text-black" onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, backgroundColor: 'transparent' } })}>투명하게</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">클릭 시 이동 (Link)</label>
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                                            <LinkIcon className="w-3 h-3 text-gray-400" />
                                            <input type="text" className="flex-1 bg-transparent text-xs outline-none" placeholder="https://" value={selectedBlock.content.link || ''} onChange={(e) => updateBlock(selectedBlock!.id, { content: { ...selectedBlock!.content, link: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedBlock.type === 'image' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">모서리 둥글게 (Border Radius)</label>
                                        <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={selectedBlock.style.borderRadius} onChange={(e) => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, borderRadius: e.target.value } })}>
                                            <option value="0px">직각형</option>
                                            <option value="10px">약간 둥글게</option>
                                            <option value="25px">많이 둥글게</option>
                                            <option value="999px">완전 타원형</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">이미지 소스 (URL / Upload)</label>
                                        <input type="text" className="w-full p-2 border rounded-lg text-xs bg-gray-50 mb-2" value={selectedBlock.content.url || ''} onChange={(e) => updateBlock(selectedBlock!.id, { content: { ...selectedBlock!.content, url: e.target.value } })} />
                                        <label className="btn btn-sm btn-outline w-full cursor-pointer h-10 flex items-center justify-center gap-2 text-xs">
                                            직접 업로드
                                            <input type="file" className="hidden" onChange={async (e) => {
                                                if (e.target.files?.[0]) {
                                                    const id = await handleImageUpload(e.target.files[0]);
                                                    if (id) updateBlock(selectedBlock!.id, { content: { ...selectedBlock!.content, url: id } });
                                                }
                                            }} />
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className={`flex-1 p-2 border rounded ${selectedBlock.style.textAlign === 'left' ? "bg-purple-100" : "bg-gray-50"}`} onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, textAlign: 'left' } })}><AlignLeft className="w-4 h-4 mx-auto" /></button>
                                        <button className={`flex-1 p-2 border rounded ${selectedBlock.style.textAlign === 'center' ? "bg-purple-100" : "bg-gray-50"}`} onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, textAlign: 'center' } })}><AlignCenter className="w-4 h-4 mx-auto" /></button>
                                        <button className={`flex-1 p-2 border rounded ${selectedBlock.style.textAlign === 'right' ? "bg-purple-100" : "bg-gray-50"}`} onClick={() => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, textAlign: 'right' } })}><AlignRight className="w-4 h-4 mx-auto" /></button>
                                    </div>
                                </div>
                            )}

                            {selectedBlock.type === 'spacer' && (
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">공간 높이 (Height)</label>
                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                                        <input type="range" min="10" max="200" className="flex-1" value={parseInt(selectedBlock.style.height || '20')} onChange={(e) => updateBlock(selectedBlock!.id, { style: { ...selectedBlock!.style, height: e.target.value + 'px' } })} />
                                        <span className="text-xs font-mono">{selectedBlock.style.height}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
