import { useState } from 'react';
import { ARCH_CATEGORIES, ARCH_ICONS } from '../../utils/archIcons';
import { Search, GripVertical } from 'lucide-react';

export default function ShapeLibrary({ onDragStart }) {
    const [activeCategory, setActiveCategory] = useState('general');
    const [search, setSearch] = useState('');

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

    return (
        <div className="shape-library glass">
            <div className="shape-library-header">
                <h3>Components</h3>
                <div className="shape-library-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Search..."
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
                    All
                </button>
                {ARCH_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        className={`lib-tab ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="shape-library-grid">
                {filtered.map((icon) => (
                    <div
                        key={icon.id}
                        className="shape-library-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, icon)}
                        title={icon.label}
                    >
                        <div className="shape-icon-preview" style={{ color: icon.color }}>
                            <svg viewBox={icon.viewBox} fill="currentColor" width="28" height="28">
                                <path d={icon.path} />
                            </svg>
                        </div>
                        <span className="shape-icon-label">{icon.label}</span>
                        <GripVertical size={10} className="shape-drag-hint" />
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="shape-library-empty">No icons found</p>
                )}
            </div>
        </div>
    );
}
