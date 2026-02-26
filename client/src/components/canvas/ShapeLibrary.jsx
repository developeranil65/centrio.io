import { useState } from 'react';
import { ARCH_CATEGORIES, ARCH_ICONS } from '../../utils/archIcons';
import { Search, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

export default function ShapeLibrary({ onDragStart }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState({});

    const filtered = ARCH_ICONS.filter((icon) => {
        const matchCategory = activeCategory === 'all' || icon.category === activeCategory;
        const matchSearch = !search || icon.label.toLowerCase().includes(search.toLowerCase());
        return matchCategory && matchSearch;
    });

    const handleDragStart = (e, icon) => {
        e.dataTransfer.setData('application/json', JSON.stringify(icon));
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart?.(icon);
    };

    // Group filtered icons by category for 'all' view
    const categories = activeCategory === 'all'
        ? ARCH_CATEGORIES.filter(cat => filtered.some(i => i.category === cat.id))
        : [ARCH_CATEGORIES.find(c => c.id === activeCategory)].filter(Boolean);

    const getCategoryCount = (catId) => ARCH_ICONS.filter(i => i.category === catId).length;

    return (
        <div className="shape-library glass">
            <div className="shape-library-header">
                <h3>Components</h3>
                <div className="shape-library-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Search components..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="shape-library-tabs">
                <button
                    className={`lib-tab ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('all')}
                >
                    All <span className="lib-tab-count">{ARCH_ICONS.length}</span>
                </button>
                {ARCH_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        className={`lib-tab ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label} <span className="lib-tab-count">{getCategoryCount(cat.id)}</span>
                    </button>
                ))}
            </div>

            <div className="shape-library-content">
                {categories.map((cat) => {
                    const catIcons = filtered.filter(i => i.category === cat.id);
                    if (catIcons.length === 0) return null;
                    const isCollapsed = collapsed[cat.id];
                    return (
                        <div key={cat.id} className="shape-category">
                            {activeCategory === 'all' && (
                                <button
                                    className="shape-category-header"
                                    onClick={() => setCollapsed(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                                >
                                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                    <span>{cat.label}</span>
                                    <span className="shape-cat-count">{catIcons.length}</span>
                                </button>
                            )}
                            {!isCollapsed && (
                                <div className="shape-library-grid">
                                    {catIcons.map((icon) => (
                                        <div
                                            key={icon.id}
                                            className="shape-library-item"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, icon)}
                                            title={`Drag to add ${icon.label}`}
                                        >
                                            <div className="shape-icon-preview" style={{ background: `${icon.color}15` }}>
                                                <svg viewBox={icon.viewBox} fill={icon.color} width="28" height="28">
                                                    <path d={icon.path} />
                                                </svg>
                                            </div>
                                            <span className="shape-icon-label">{icon.label}</span>
                                            <GripVertical size={10} className="shape-drag-hint" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <p className="shape-library-empty">No icons found</p>
                )}
            </div>
        </div>
    );
}
