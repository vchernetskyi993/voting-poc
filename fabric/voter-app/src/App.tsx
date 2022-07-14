import { Box } from "@mui/material";
import { Election, ElectionsClient } from "./elections/contract";
import React from "react";
import ElectionsTable from "./elections/ElectionsTable";
import Title from "./elections/Title";
import VotingModal from "./elections/VotingModal";
import Login from "./Login";
import { ReactSession } from "react-client-session";

function App() {
  ReactSession.setStoreType("localStorage");

  const [open, setOpen] = React.useState(false);
  const [candidates, setCandidates] = React.useState<string[]>([]);
  const [electionId, setElectionId] = React.useState<number>();
  const [username, setUsername] = React.useState<string | undefined>(
    ReactSession.get("username")
  );
  const persistUsername = (username: string | undefined) => {
    ReactSession.set("username", username);
    setUsername(username);
  };
  const [password, setPassword] = React.useState<string | undefined>(
    ReactSession.get("password")
  );
  const persistPassword = (password: string | undefined) => {
    ReactSession.set("password", password);
    setPassword(password);
  };
  const [loggedIn, setLoggedIn] = React.useState<boolean>(
    ReactSession.get("loggedIn") ?? false
  );
  const persistLoggedIn = (loggedIn: boolean) => {
    ReactSession.set("loggedIn", loggedIn);
    setLoggedIn(loggedIn);
  };
  const client = React.useMemo<ElectionsClient | undefined>(() => {
    if (username && password) {
      return new ElectionsClient(username, password);
    }
  }, [username, password]);
  const [elections, setElections] = React.useState<Election[]>([]);
  React.useEffect(() => {
    if (client && loggedIn) {
      client.getElections().then(setElections);
    }
  }, [client, loggedIn]);

  if (!loggedIn) {
    return (
      <Login
        username={username}
        password={password}
        setUsername={persistUsername}
        setPassword={persistPassword}
        setLoggedIn={persistLoggedIn}
      />
    );
  }

  const logout = () => {
    persistPassword(undefined);
    persistUsername(undefined);
    persistLoggedIn(false);
  };
  const openVotingModal = (candidates: string[], electionId: number) => {
    setOpen(true);
    setCandidates(candidates);
    setElectionId(electionId);
  };
  const closeVotingModal = () => {
    setOpen(false);
    setCandidates([]);
    client!.getElections().then(setElections);
  };

  return (
    <Box>
      <Title username={ReactSession.get("username")} logout={logout} />
      <ElectionsTable elections={elections} openVotingModal={openVotingModal} />
      <VotingModal
        open={open}
        closeVotingModal={closeVotingModal}
        candidates={candidates}
        client={client!}
        electionId={electionId!}
      />
    </Box>
  );
}

export default App;
