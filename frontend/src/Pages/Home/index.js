import { withAuth0 } from "@auth0/auth0-react";
import { Home } from "./Home";


export default withAuth0(Home);