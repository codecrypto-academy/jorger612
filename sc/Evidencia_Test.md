rjorgea@LAPTOP-ATPQUCMA:~/dao-main/sc$ forge test --match-path test/DAOVoting.t.sol
[⠊] Compiling...
[⠃] Compiling 25 files with Solc 0.8.30
[⠊] Solc 0.8.30 finished in 836.87ms
Compiler run successful!

Ran 15 tests for test/DAOVoting.t.sol:DAOVotingTest
[PASS] testCanExecute() (gas: 330868)
[PASS] testChangeVote() (gas: 289404)
[PASS] testCreateProposal() (gas: 206013)
[PASS] testCreateProposalFailsWithInsufficientBalance() (gas: 52597)
[PASS] testDeposit() (gas: 50119)
[PASS] testExecuteApprovedProposal() (gas: 390354)
[PASS] testExecuteFailsBeforeDeadline() (gas: 265290)
[PASS] testExecuteFailsBeforeExecutionDelay() (gas: 266273)
[PASS] testExecuteFailsWhenNotApproved() (gas: 321804)
[PASS] testGetBalance() (gas: 8012)
[PASS] testReceiveEther() (gas: 50312)
[PASS] testVoteAgainst() (gas: 274281)
[PASS] testVoteFailsAfterDeadline() (gas: 200726)
[PASS] testVoteFailsWithInsufficientBalance() (gas: 231711)
[PASS] testVoteFor() (gas: 277243)
Suite result: ok. 15 passed; 0 failed; 0 skipped; finished in 13.06ms (14.31ms CPU time)

Ran 1 test suite in 22.08ms (13.06ms CPU time): 15 tests passed, 0 failed, 0 skipped (15 total tests)
rjorgea@LAPTOP-ATPQUCMA:~/dao-main/sc$ 