import { Group, Rect, Text, Line } from 'react-konva';

const ROW_HEIGHT = 26;
const HEADER_HEIGHT = 36;
const MIN_TABLE_WIDTH = 220;
const SIDE_PAD = 12;

/**
 * EREntity — Konva group rendering a database table entity.
 * Now shows NN (not null), UQ (unique), IDX (index) badges alongside PK/FK.
 */
export default function EREntity({ shape, isSelected, onSelect, onDragEnd, onDoubleClick, tool }) {
    const fields = shape.fields || [];

    // Auto-calculate width based on longest field name
    const longestName = fields.reduce((max, f) => Math.max(max, (f.name || '').length), (shape.tableName || 'table').length);
    const TABLE_WIDTH = Math.max(MIN_TABLE_WIDTH, longestName * 8.5 + 120);
    const totalHeight = HEADER_HEIGHT + Math.max(fields.length, 1) * ROW_HEIGHT + 6;

    const TYPE_COLORS = {
        'string': '#94a3b8', 'text': '#94a3b8', 'number': '#6ee7b7', 'integer': '#6ee7b7',
        'bigint': '#6ee7b7', 'float': '#6ee7b7', 'decimal': '#6ee7b7',
        'boolean': '#fbbf24', 'date': '#818cf8', 'timestamp': '#818cf8',
        'uuid': '#c084fc', 'json': '#fb923c', 'enum': '#f472b6',
        'binary': '#64748b', 'array': '#22d3ee',
    };

    return (
        <Group
            id={shape.id}
            x={shape.x}
            y={shape.y}
            draggable={tool === 'select'}
            onClick={onSelect}
            onDblClick={onDoubleClick}
            onDragEnd={onDragEnd}
        >
            {/* Shadow */}
            <Rect
                x={3}
                y={3}
                width={TABLE_WIDTH}
                height={totalHeight}
                fill="rgba(0,0,0,0.35)"
                cornerRadius={8}
            />

            {/* Background */}
            <Rect
                width={TABLE_WIDTH}
                height={totalHeight}
                fill="#12121e"
                stroke={isSelected ? '#6366f1' : '#2a2a3e'}
                strokeWidth={isSelected ? 2.5 : 1}
                cornerRadius={8}
            />

            {/* Header gradient */}
            <Rect
                width={TABLE_WIDTH}
                height={HEADER_HEIGHT}
                fill="#1a1a2e"
                cornerRadius={[8, 8, 0, 0]}
            />
            {/* Header accent line */}
            <Rect
                x={0}
                y={HEADER_HEIGHT - 2}
                width={TABLE_WIDTH}
                height={2}
                fill="rgba(99, 102, 241, 0.4)"
            />

            {/* Table icon */}
            <Text
                x={SIDE_PAD}
                y={10}
                text="⊞"
                fill="#6366f1"
                fontSize={14}
                fontFamily="Inter, sans-serif"
            />

            {/* Table name */}
            <Text
                x={SIDE_PAD + 20}
                y={10}
                text={shape.tableName || 'table'}
                fill="#f1f5f9"
                fontSize={14}
                fontStyle="bold"
                fontFamily="Inter, sans-serif"
                width={TABLE_WIDTH - SIDE_PAD - 30}
            />

            {/* Field count badge */}
            <Text
                x={TABLE_WIDTH - 42}
                y={12}
                text={`${fields.length}F`}
                fill="#64748b"
                fontSize={10}
                fontFamily="Inter, sans-serif"
            />

            {/* Field rows */}
            {fields.length === 0 ? (
                <Text
                    x={SIDE_PAD}
                    y={HEADER_HEIGHT + 6}
                    text="No fields — double-click to edit"
                    fill="#64748b"
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                />
            ) : (
                fields.map((field, i) => {
                    const rowY = HEADER_HEIGHT + i * ROW_HEIGHT;
                    const badges = [];
                    if (field.pk) badges.push({ label: 'PK', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' });
                    if (field.fk) badges.push({ label: 'FK', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' });
                    if (field.required) badges.push({ label: 'NN', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' });
                    if (field.unique) badges.push({ label: 'UQ', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' });
                    if (field.indexed) badges.push({ label: 'IX', color: '#10b981', bg: 'rgba(16,185,129,0.12)' });

                    const typeColor = TYPE_COLORS[(field.type || 'string').toLowerCase()] || '#94a3b8';

                    return (
                        <Group key={i}>
                            {/* Row background */}
                            <Rect
                                x={0}
                                y={rowY}
                                width={TABLE_WIDTH}
                                height={ROW_HEIGHT}
                                fill={i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                            />
                            {/* Type color indicator */}
                            <Rect
                                x={2}
                                y={rowY + 6}
                                width={3}
                                height={ROW_HEIGHT - 12}
                                fill={typeColor}
                                cornerRadius={2}
                                opacity={0.6}
                            />
                            {/* Field name */}
                            <Text
                                x={SIDE_PAD}
                                y={rowY + 6}
                                text={field.name || 'field'}
                                fill={field.pk ? '#f59e0b' : '#e2e8f0'}
                                fontSize={12}
                                fontStyle={field.pk ? 'bold' : 'normal'}
                                fontFamily="monospace"
                                width={TABLE_WIDTH * 0.4}
                            />
                            {/* Field type */}
                            <Text
                                x={TABLE_WIDTH * 0.44}
                                y={rowY + 6}
                                text={field.type || 'string'}
                                fill={typeColor}
                                fontSize={11}
                                fontFamily="monospace"
                                width={TABLE_WIDTH * 0.22}
                            />
                            {/* Badges */}
                            {badges.map((badge, bIdx) => {
                                const bx = TABLE_WIDTH * 0.66 + bIdx * 28;
                                return (
                                    <Group key={bIdx}>
                                        <Rect
                                            x={bx}
                                            y={rowY + 4}
                                            width={24}
                                            height={16}
                                            fill={badge.bg}
                                            cornerRadius={3}
                                        />
                                        <Text
                                            x={bx + 3}
                                            y={rowY + 7}
                                            text={badge.label}
                                            fill={badge.color}
                                            fontSize={9}
                                            fontStyle="bold"
                                            fontFamily="Inter, sans-serif"
                                        />
                                    </Group>
                                );
                            })}
                            {/* Row separator */}
                            {i < fields.length - 1 && (
                                <Line
                                    points={[8, rowY + ROW_HEIGHT, TABLE_WIDTH - 8, rowY + ROW_HEIGHT]}
                                    stroke="rgba(255,255,255,0.04)"
                                    strokeWidth={1}
                                />
                            )}
                        </Group>
                    );
                })
            )}
        </Group>
    );
}
