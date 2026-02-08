import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Typography } from "@mui/material";

type AdvancedSectionProps = {
  subtleBorder: string;
  cardBg: string;
  mutedText: string;
  backfillLoading: boolean;
  backfillMessage: string | null;
  onBackfill: () => void;
};

export function AdvancedSection({
  subtleBorder,
  cardBg,
  mutedText,
  backfillLoading,
  backfillMessage,
  onBackfill,
}: AdvancedSectionProps) {
  return (
    <Accordion
      defaultExpanded={false}
      sx={{
        mt: 4,
        mb: 4,
        border: `1px solid ${subtleBorder}`,
        borderRadius: 2,
        background: cardBg,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        sx={{ paddingX: 2, paddingY: 1 }}
        expandIcon={<span style={{ fontSize: "1.2rem", color: mutedText }}>+</span>}
      >
        <Typography variant="h6">Advanced</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ paddingX: 2, paddingBottom: 2 }}>
        <Typography sx={{ mb: 2, color: mutedText }}>
          Backfill folder-user mappings from the current user pool.
        </Typography>
        <Button
          variant="outlined"
          onClick={onBackfill}
          disabled={backfillLoading}
        >
          {backfillLoading ? "Backfilling..." : "Backfill Folder Users"}
        </Button>
        {backfillMessage && (
          <Box sx={{ mt: 2, color: mutedText }}>{backfillMessage}</Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
