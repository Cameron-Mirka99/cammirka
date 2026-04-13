import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

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
        border: `1px solid ${subtleBorder}`,
        borderRadius: 5,
        background: cardBg,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        sx={{ px: 2.5, py: 1.25 }}
        expandIcon={<span style={{ fontSize: "1.1rem", color: mutedText }}>+</span>}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ color: "primary.main", mb: 0.25 }}>
            Advanced
          </Typography>
          <Typography variant="h6">Maintenance tools</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
        <Box
          sx={{
            px: 2,
            py: 1.75,
            borderRadius: 3,
            border: `1px solid ${alpha("#B88A2A", 0.18)}`,
            backgroundColor: alpha("#B88A2A", 0.06),
          }}
        >
          <Typography sx={{ mb: 1, color: "text.primary", fontWeight: 700 }}>
            Backfill folder-user mappings
          </Typography>
          <Typography sx={{ mb: 2, color: mutedText }}>
            Rebuild folder access records from the current user pool. Use this when mappings fall out of sync.
          </Typography>
          <Button variant="outlined" onClick={onBackfill} disabled={backfillLoading}>
            {backfillLoading ? "Backfilling..." : "Run backfill"}
          </Button>
          {backfillMessage && <Box sx={{ mt: 2, color: mutedText }}>{backfillMessage}</Box>}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
