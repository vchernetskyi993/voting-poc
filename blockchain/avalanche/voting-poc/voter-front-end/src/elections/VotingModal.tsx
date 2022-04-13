import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Modal,
  Radio,
  RadioGroup,
} from "@mui/material";

function VotingModal({
  open,
  toggleVotingModal,
}: {
  open: boolean;
  toggleVotingModal: (open: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => toggleVotingModal(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          position: "absolute" as "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          border: "2px solid #000",
          boxShadow: 24,
          p: 4,
        }}
      >
        <form onSubmit={() => toggleVotingModal(false)}>
          <FormControl>
            <RadioGroup>
              {/* TODO: populate from actual candidates for election */}
              <FormControlLabel value="0" control={<Radio />} label="First" />
              <FormControlLabel value="1" control={<Radio />} label="Second" />
            </RadioGroup>
            {/* TODO: disable if no option selected */}
            {/* TODO: call vote function */}
            <Button type="submit" variant="outlined">
              Vote
            </Button>
          </FormControl>
        </form>
      </Box>
    </Modal>
  );
}

export default VotingModal;
