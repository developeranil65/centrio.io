import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, X, Database } from 'lucide-react';

const FIELD_TYPES = ['string', 'number', 'boolean', 'timestamp', 'uuid', 'text', 'json', 'float', 'enum'];

/**
 * EREditModal — HTML overlay modal for editing an ER table entity.
 * Props:
 *   shape: the er-table shape data
 *   onSave: (updatedShape) => void
 *   onClose: () => void
 */
export default function EREditModal({ shape, onSave, onClose }) {
    const [tableName, setTableName] = useState(shape?.tableName || '');
    const [fields, setFields] = useState(shape?.fields || []);

    useEffect(() => {
        if (shape) {
            setTableName(shape.tableName || '');
            setFields(shape.fields || []);
        }
    }, [shape]);

    const addField = () => {
        setFields([...fields, { name: '', type: 'string', pk: false, fk: false }]);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateField = (index, key, value) => {
        const updated = fields.map((f, i) => (i === index ? { ...f, [key]: value } : f));
        setFields(updated);
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
                        <Database size={18} />
                        <h2>Edit Table</h2>
                    </div>
                    <button className="btn btn-ghost btn-icon sm" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="er-modal-body">
                    <div className="input-group">
                        <label>Table Name</label>
                        <input
                            className="input"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="users"
                            autoFocus
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
                                <span>PK</span>
                                <span>FK</span>
                                <span></span>
                            </div>
                            {fields.map((field, i) => (
                                <div key={i} className="er-field-row">
                                    <input
                                        className="input input-sm"
                                        placeholder="field_name"
                                        value={field.name}
                                        onChange={(e) => updateField(i, 'name', e.target.value)}
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
                                    <button className="btn btn-ghost btn-icon sm" onClick={() => removeField(i)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <p className="er-no-fields">No fields yet. Click "Add Field" to begin.</p>
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
