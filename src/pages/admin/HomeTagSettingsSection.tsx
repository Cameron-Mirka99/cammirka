import { Box, Chip, List, ListItem, ListItemText, Switch, TextField, Typography } from "@mui/material";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import { alpha } from "@mui/material/styles";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TagCatalogEntry } from "./types";
import { usePrefersReducedMotion } from "../../utils/motion";

type HomeTagSettingsSectionProps = {
  tags: TagCatalogEntry[];
  loading: boolean;
  error: string | null;
  savingTagKey: string | null;
  mutedText: string;
  subtleBorder: string;
  cardBg: string;
  onToggle: (tag: TagCatalogEntry, showOnHome: boolean) => void;
  onReorder: (orderedTags: TagCatalogEntry[]) => void;
};

export function HomeTagSettingsSection({
  tags,
  loading,
  error,
  savingTagKey,
  mutedText,
  subtleBorder,
  cardBg,
  onToggle,
  onReorder,
}: HomeTagSettingsSectionProps) {
  const dragThreshold = 8;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [query, setQuery] = useState("");
  const [orderedTags, setOrderedTags] = useState<TagCatalogEntry[]>([]);
  const [pendingDrag, setPendingDrag] = useState<{
    tagKey: string;
    startOrder: string[];
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const [dragging, setDragging] = useState<{
    tagKey: string;
    startOrder: string[];
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const previousPositionsRef = useRef(new Map<string, number>());

  const sortedTags = useMemo(
    () =>
      tags.slice().sort((a, b) =>
      a.sortOrder === b.sortOrder
        ? a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
        : a.sortOrder - b.sortOrder,
      ),
    [tags],
  );

  useEffect(() => {
    if (!dragging && !pendingDrag) {
      setOrderedTags(sortedTags);
    }
  }, [dragging, pendingDrag, sortedTags]);

  useEffect(() => {
    if (!dragging && !pendingDrag) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging && pendingDrag) {
        const distance = Math.hypot(event.clientX - pendingDrag.startX, event.clientY - pendingDrag.startY);
        if (distance >= dragThreshold) {
          setDragging({
            tagKey: pendingDrag.tagKey,
            startOrder: pendingDrag.startOrder,
            currentX: event.clientX,
            currentY: event.clientY,
            offsetX: pendingDrag.offsetX,
            offsetY: pendingDrag.offsetY,
            width: pendingDrag.width,
            height: pendingDrag.height,
          });
          setPendingDrag(null);
        }
        return;
      }

      if (!dragging) {
        return;
      }

      setDragging((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentX: event.clientX,
          currentY: event.clientY,
        };
      });

      setOrderedTags((prev) => {
        const sourceIndex = prev.findIndex((entry) => entry.tagKey === dragging.tagKey);
        if (sourceIndex < 0) return prev;

        const next = prev.slice();
        const [draggedEntry] = next.splice(sourceIndex, 1);

        let targetIndex = next.length;
        for (let index = 0; index < next.length; index += 1) {
          const node = rowRefs.current.get(next[index].tagKey);
          if (!node) continue;
          const rect = node.getBoundingClientRect();
          if (event.clientY < rect.top + rect.height / 2) {
            targetIndex = index;
            break;
          }
        }

        next.splice(targetIndex, 0, draggedEntry);
        const hasChanged = next.some((entry, index) => entry.tagKey !== prev[index]?.tagKey);
        return hasChanged ? next : prev;
      });
    };

    const handlePointerUp = () => {
      if (dragging) {
        const didChange = orderedTags.some((entry, index) => entry.tagKey !== dragging.startOrder[index]);
        if (didChange) {
          onReorder(
            orderedTags.map((entry, index) => ({
              ...entry,
              sortOrder: index,
            })),
          );
        }
      }
      setPendingDrag(null);
      setDragging(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [dragThreshold, dragging, onReorder, orderedTags, pendingDrag]);

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      previousPositionsRef.current = new Map(
        orderedTags.map((tag) => [tag.tagKey, rowRefs.current.get(tag.tagKey)?.getBoundingClientRect().top ?? 0]),
      );
      return;
    }

    orderedTags.forEach((tag) => {
      const node = rowRefs.current.get(tag.tagKey);
      if (!node) return;
      const previousTop = previousPositionsRef.current.get(tag.tagKey);
      const nextTop = node.getBoundingClientRect().top;

      if (typeof previousTop === "number") {
        const delta = previousTop - nextTop;
        if (Math.abs(delta) > 1) {
          node.style.transition = "none";
          node.style.transform = `translate3d(0, ${delta}px, 0)`;
          requestAnimationFrame(() => {
            node.style.transition = "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
            node.style.transform = "translate3d(0, 0, 0)";
          });
        }
      }
    });

    previousPositionsRef.current = new Map(
      orderedTags.map((tag) => [tag.tagKey, rowRefs.current.get(tag.tagKey)?.getBoundingClientRect().top ?? 0]),
    );
  }, [orderedTags, prefersReducedMotion]);

  const filteredTags = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return orderedTags;
    }

    return orderedTags.filter((tag) =>
      `${tag.label} ${tag.tagKey}`.toLowerCase().includes(normalizedQuery),
    );
  }, [orderedTags, query]);

  const visibleCount = tags.filter((tag) => tag.showOnHome).length;
  const draggedTagKey = dragging?.tagKey ?? null;
  const draggedTag = draggedTagKey
    ? orderedTags.find((entry) => entry.tagKey === draggedTagKey) ?? null
    : null;

  const beginPendingDrag = (tag: TagCatalogEntry, event: React.PointerEvent<HTMLElement>) => {
    if (savingTagKey === tag.tagKey) return;
    const row = rowRefs.current.get(tag.tagKey);
    if (!row) return;
    const rect = row.getBoundingClientRect();
    setPendingDrag({
      tagKey: tag.tagKey,
      startOrder: orderedTags.map((entry) => entry.tagKey),
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const renderRowContent = (tag: TagCatalogEntry, isOverlay = false) => (
    <>
      <ListItemText
        primary={tag.label}
        secondary={`Position ${tag.sortOrder + 1}${tag.showOnHome ? " | Visible on home" : " | Hidden from home"}`}
        secondaryTypographyProps={{ sx: { color: mutedText } }}
        sx={{
          opacity: isOverlay ? 1 : undefined,
        }}
      />
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Box
          data-drag-handle="true"
          onPointerDown={(event) => {
            event.stopPropagation();
            beginPendingDrag(tag, event);
          }}
          sx={{
            width: 34,
            height: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 2,
            color: mutedText,
            backgroundColor: isOverlay ? alpha("#F7F1E3", 0.08) : alpha("#191713", 0.04),
            border: `1px solid ${alpha("#B88A2A", isOverlay ? 0.18 : 0.1)}`,
            userSelect: "none",
          }}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Switch
          edge="end"
          checked={tag.showOnHome}
          disabled={savingTagKey === tag.tagKey || isOverlay}
          onChange={(_event, checked) => onToggle(tag, checked)}
        />
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        border: `1px solid ${subtleBorder}`,
        borderRadius: 5,
        p: 2.5,
        background: cardBg,
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 1 }}>
        Home Collections
      </Typography>
      <Typography variant="h6" sx={{ mb: 0.75, fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
        Choose which tags appear on the home screen
      </Typography>
      <Typography sx={{ mb: 2.5, color: mutedText, maxWidth: 760 }}>
        Home tiles are driven by tags. Turn collections on or off here to control what visitors can browse from the landing page.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={`${visibleCount} on home`} size="small" />
        <Chip label={`${tags.length} total tags`} size="small" variant="outlined" />
      </Box>

      <TextField
        label="Search tags"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        size="small"
        fullWidth
        helperText="Search by tag name."
      />

      {error && (
        <Box sx={{ mt: 2, color: mutedText }}>
          {error}
        </Box>
      )}

      <List
        disablePadding
        sx={{
          mt: 2,
          border: `1px solid ${subtleBorder}`,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: alpha("#191713", 0.03),
        }}
      >
        {loading ? (
          <ListItem>
            <ListItemText primary="Loading tags..." />
          </ListItem>
        ) : filteredTags.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={tags.length === 0 ? "No tags have been created yet." : "No tags match this search."}
              secondary={tags.length === 0 ? "Create or assign tags to images first." : undefined}
            />
          </ListItem>
        ) : (
          filteredTags.map((tag, index) => (
            <ListItem
              key={tag.tagKey}
              ref={(node: HTMLLIElement | null) => {
                if (node) {
                  rowRefs.current.set(tag.tagKey, node);
                } else {
                  rowRefs.current.delete(tag.tagKey);
                }
              }}
              divider={index < filteredTags.length - 1}
              disableGutters
              sx={{
                py: 1.2,
                px: 2,
                cursor: savingTagKey === tag.tagKey ? "default" : "inherit",
                minHeight: 72,
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                borderRadius: 0,
                backgroundColor: draggedTagKey === tag.tagKey ? alpha("#B88A2A", 0.06) : "transparent",
                opacity: draggedTagKey === tag.tagKey ? 0.14 : 1,
                boxShadow: draggedTagKey === tag.tagKey ? `inset 0 0 0 1px ${alpha("#B88A2A", 0.28)}` : "none",
                transition: "background-color 160ms ease, opacity 160ms ease, box-shadow 160ms ease",
                "& [data-drag-handle='true']": {
                  cursor: savingTagKey === tag.tagKey ? "default" : draggedTagKey === tag.tagKey ? "grabbing" : "grab",
                },
              }}
            >
              {renderRowContent(tag)}
            </ListItem>
          ))
        )}
      </List>
      {dragging && draggedTag ? (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            top: 0,
            width: dragging.width,
            minHeight: dragging.height,
            px: 2,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            borderRadius: 3,
            border: `1px solid ${alpha("#B88A2A", 0.26)}`,
            background: alpha("#201A10", 0.96),
            boxShadow: "0 26px 56px rgba(0, 0, 0, 0.32)",
            pointerEvents: "none",
            zIndex: 1500,
            transform: `translate3d(${dragging.currentX - dragging.offsetX}px, ${dragging.currentY - dragging.offsetY}px, 0) scale(1.025) rotate(-0.7deg)`,
          }}
        >
          {renderRowContent(draggedTag, true)}
        </Box>
      ) : null}
    </Box>
  );
}
