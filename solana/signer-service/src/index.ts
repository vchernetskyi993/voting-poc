import "dotenv/config";
import { server } from "./server";
import { env } from "./utils";

const app = server(env("ORG_PRIVATE_KEY_PATH"), env("CLIENT_URL"));
const port = env("SERVER_PORT");
app.listen(port, () => {
  console.log(`Signer app listening on port ${port}`);
});
