use anchor_lang::error_code;

#[error_code]
pub enum GeneralErrors {
    #[msg("Only owner is allowed to execute")]
    OnlyOwner,
}

#[error_code]
pub enum ElectionErrors {
    #[msg("At least 2 candidates are required")]
    InvalidCandidatesCount,
    #[msg("Start date should be in the future")]
    InvalidStartDate,
    #[msg("End date should be after start")]
    InvalidEndDate,
    #[msg("Create election costs 0.01 SOL")]
    InsufficientFundsToCreateElection,
}

#[error_code]
pub enum VotingErrors {
    #[msg("Votes are accepted only between start and end dates")]
    InvalidCurrentDate,
}
