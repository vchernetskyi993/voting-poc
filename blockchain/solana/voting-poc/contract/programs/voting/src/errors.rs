use anchor_lang::error_code;

#[error_code]
pub enum VotingErrors {
    #[msg("Only owner is allowed to execute")]
    OnlyOwner,
    #[msg("At least 2 candidates are required")]
    InvalidCandidatesCount,
    #[msg("Start date should be in the future")]
    InvalidStartDate,
    #[msg("End date should be after start")]
    InvalidEndDate,
    #[msg("Create election costs 0.01 SOL")]
    InsufficientFundsToCreateElection,
}
