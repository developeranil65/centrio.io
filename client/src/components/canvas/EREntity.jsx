import { Group, Rect, Text, Line } from 'react-konva';

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 32;
const COL_WIDTHS = { name: 100, type: 80, badge: 40 };
const TABLE_WIDTH = COL_WIDTHS.name + COL_WIDTHS.type + COL_WIDTHS.badge;

/**
 * EREntity — Konva group rendering a database table entity.
 * Props:
 *   shape: { id, type:'er-table', x, y, tableName, fields:[{name,type,pk,fk}] }
 *   isSelected
 *   onSelect
 *   onDragEnd
 *   onDoubleClick
 *   tool
 */
export default function EREntity({ shape, isSelected, onSelect, onDragEnd, onDoubleClick, tool }) {
    const fields = shape.fields || [];
    const totalHeight = HEADER_HEIGHT + Math.max(fields.length, 1) * ROW_HEIGHT + 4;

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
                fill="rgba(0,0,0,0.3)"
                cornerRadius={6}
            />

            {/* Background */}
            <Rect
                width={TABLE_WIDTH}
                height={totalHeight}
                fill="#14141f"
                stroke={isSelected ? '#6366f1' : '#2a2a3e'}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={6}
            />

            {/* Header */}
            <Rect
                width={TABLE_WIDTH}
                height={HEADER_HEIGHT}
                fill="#1e1e30"
                cornerRadius={[6, 6, 0, 0]}
            />
            <Text
                x={10}
                y={8}
                text={shape.tableName || 'table'}
                fill="#f1f5f9"
                fontSize={14}
                fontStyle="bold"
                fontFamily="Inter, sans-serif"
                width={TABLE_WIDTH - 20}
            />

            {/* Header separator */}
            <Line
                points={[0, HEADER_HEIGHT, TABLE_WIDTH, HEADER_HEIGHT]}
                stroke="#2a2a3e"
                strokeWidth={1}
            />

            {/* Field rows */}
            {fields.length === 0 ? (
                <Text
                    x={10}
                    y={HEADER_HEIGHT + 4}
                    text="No fields — double-click to edit"
                    fill="#64748b"
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                />
            ) : (
                fields.map((field, i) => {
                    const rowY = HEADER_HEIGHT + i * ROW_HEIGHT;
                    return (
                        <Group key={i}>
                            {/* Row background on hover */}
                            <Rect
                                x={0}
                                y={rowY}
                                width={TABLE_WIDTH}
                                height={ROW_HEIGHT}
                                fill={i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                            />
                            {/* Field name */}
                            <Text
                                x={10}
                                y={rowY + 5}
                                text={field.name || 'field'}
                                fill={field.pk ? '#f59e0b' : '#e2e8f0'}
                                fontSize={12}
                                fontFamily="monospace"
                                width={COL_WIDTHS.name - 10}
                            />
                            {/* Field type */}
                            <Text
                                x={COL_WIDTHS.name}
                                y={rowY + 5}
                                text={field.type || 'string'}
                                fill="#64748b"
                                fontSize={11}
                                fontFamily="monospace"
                                width={COL_WIDTHS.type}
                            />
                            {/* PK / FK badge */}
                            {(field.pk || field.fk) && (
                                <Group>
                                    <Rect
                                        x={COL_WIDTHS.name + COL_WIDTHS.type}
                                        y={rowY + 3}
                                        width={32}
                                        height={18}
                                        fill={field.pk ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)'}
                                        cornerRadius={4}
                                    />
                                    <Text
                                        x={COL_WIDTHS.name + COL_WIDTHS.type + 4}
                                        y={rowY + 6}
                                        text={field.pk ? 'PK' : 'FK'}
                                        fill={field.pk ? '#f59e0b' : '#6366f1'}
                                        fontSize={10}
                                        fontStyle="bold"
                                        fontFamily="Inter, sans-serif"
                                    />
                                </Group>
                            )}
                            {/* Row separator */}
                            {i < fields.length - 1 && (
                                <Line
                                    points={[8, rowY + ROW_HEIGHT, TABLE_WIDTH - 8, rowY + ROW_HEIGHT]}
                                    stroke="rgba(255,255,255,0.05)"
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
