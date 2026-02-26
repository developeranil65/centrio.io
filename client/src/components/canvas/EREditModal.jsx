import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, X, Database, Key, Hash, Shield, Zap } from 'lucide-react';

const FIELD_TYPES = [
    'string', 'text', 'number', 'integer', 'bigint', 'float', 'decimal',
    'boolean', 'date', 'timestamp', 'uuid', 'json', 'enum', 'binary', 'array',
];

const TEMPLATES = [
    {
        name: 'Users',
        tableName: 'users',
        fields: [
            { name: 'id', type: 'uuid', pk: true, fk: false, required: true, unique: true, indexed: false, defaultVal: '' },
            { name: 'email', type: 'string', pk: false, fk: false, required: true, unique: true, indexed: true, defaultVal: '' },
            { name: 'name', type: 'string', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: '' },
            { name: 'password_hash', type: 'string', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: '' },
            { name: 'created_at', type: 'timestamp', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: 'now()' },
        ],
    },
    {
        name: 'Products',
        tableName: 'products',
        fields: [
            { name: 'id', type: 'uuid', pk: true, fk: false, required: true, unique: true, indexed: false, defaultVal: '' },
            { name: 'name', type: 'string', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: '' },
            { name: 'price', type: 'decimal', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: '0' },
            { name: 'category', type: 'string', pk: false, fk: false, required: false, unique: false, indexed: true, defaultVal: '' },
            { name: 'in_stock', type: 'boolean', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: 'true' },
        ],
    },
    {
        name: 'Orders',
        tableName: 'orders',
        fields: [
            { name: 'id', type: 'uuid', pk: true, fk: false, required: true, unique: true, indexed: false, defaultVal: '' },
            { name: 'user_id', type: 'uuid', pk: false, fk: true, required: true, unique: false, indexed: true, defaultVal: '' },
            { name: 'total', type: 'decimal', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: '0' },
            { name: 'status', type: 'enum', pk: false, fk: false, required: true, unique: false, indexed: true, defaultVal: 'pending' },
            { name: 'created_at', type: 'timestamp', pk: false, fk: false, required: true, unique: false, indexed: false, defaultVal: 'now()' },
        ],
    },
];

/**
 * EREditModal — Enhanced modal for editing ER table entities.
 */
export default function EREditModal({ shape, onSave, onClose }) {
    const [tableName, setTableName] = useState(shape?.tableName || '');
    const [fields, setFields] = useState(() => {
        return (shape?.fields || []).map(f => ({
            ...f,
            required: f.required ?? false,
            unique: f.unique ?? false,
            indexed: f.indexed ?? false,
            defaultVal: f.defaultVal ?? '',
        }));
    });

    useEffect(() => {
        if (shape) {
            setTableName(shape.tableName || '');
            setFields((shape.fields || []).map(f => ({
                ...f,
                required: f.required ?? false,
                unique: f.unique ?? false,
                indexed: f.indexed ?? false,
                defaultVal: f.defaultVal ?? '',
            })));
        }
    }, [shape]);

    const addField = () => {
        setFields([...fields, { name: '', type: 'string', pk: false, fk: false, required: false, unique: false, indexed: false, defaultVal: '' }]);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateField = (index, key, value) => {
        const updated = fields.map((f, i) => (i === index ? { ...f, [key]: value } : f));
        setFields(updated);
    };

    const applyTemplate = (template) => {
        setTableName(template.tableName);
        setFields(template.fields.map(f => ({ ...f })));
    };

    const handleSave = () => {
        onSave({
            ...shape,
            tableName: tableName || 'untitled',
            fields: fields.filter((f) => f.name.trim()),
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal er-edit-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="er-modal-header">
                    <div className="er-modal-title">
                        <div className="er-modal-icon">
                            <Database size={20} />
                        </div>
                        <div>
                            <h2>Edit Table</h2>
                            <span className="er-modal-subtitle">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon sm" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Templates */}
                {!shape?.tableName && (
                    <div className="er-templates">
                        <span className="er-templates-label">Quick start:</span>
                        {TEMPLATES.map((t) => (
                            <button key={t.name} className="er-template-btn" onClick={() => applyTemplate(t)}>
                                <Zap size={10} /> {t.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="er-modal-body">
                    <div className="input-group">
                        <label>Table Name</label>
                        <input
                            className="input"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="users"
                            autoFocus
                            style={{ fontFamily: 'monospace', fontWeight: 600 }}
                        />
                    </div>

                    <div className="er-fields-section">
                        <div className="er-fields-header">
                            <label>Fields</label>
                            <button className="btn btn-ghost btn-sm" onClick={addField}>
                                <Plus size={14} /> Add Field
                            </button>
                        </div>

                        <div className="er-fields-list">
                            <div className="er-field-row er-field-header-row">
                                <span>Name</span>
                                <span>Type</span>
                                <span title="Primary Key"><Key size={10} /></span>
                                <span title="Foreign Key"><Hash size={10} /></span>
                                <span title="Required (NOT NULL)"><Shield size={10} /></span>
                                <span title="Unique">UQ</span>
                                <span></span>
                            </div>
                            {fields.map((field, i) => (
                                <div key={i} className="er-field-row">
                                    <input
                                        className="input input-sm"
                                        placeholder="field_name"
                                        value={field.name}
                                        onChange={(e) => updateField(i, 'name', e.target.value)}
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                    <select
                                        className="input input-sm"
                                        value={field.type}
                                        onChange={(e) => updateField(i, 'type', e.target.value)}
                                    >
                                        {FIELD_TYPES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <label className="er-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={field.pk || false}
                                            onChange={(e) => updateField(i, 'pk', e.target.checked)}
                                        />
                                        <span className="er-check-mark pk" />
                                    </label>
                                    <label className="er-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={field.fk || false}
                                            onChange={(e) => updateField(i, 'fk', e.target.checked)}
                                        />
                                        <span className="er-check-mark fk" />
                                    </label>
                                    <label className="er-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={field.required || false}
                                            onChange={(e) => updateField(i, 'required', e.target.checked)}
                                        />
                                        <span className="er-check-mark nn" />
                                    </label>
                                    <label className="er-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={field.unique || false}
                                            onChange={(e) => updateField(i, 'unique', e.target.checked)}
                                        />
                                        <span className="er-check-mark uq" />
                                    </label>
                                    <button className="btn btn-ghost btn-icon sm" onClick={() => removeField(i)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <p className="er-no-fields">No fields yet. Click "Add Field" or use a template above.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save Table</button>
                </div>
            </motion.div>
        </div>
    );
}
