// ** Router Import
import Router from "./router/Router";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCheckCircle, faTimesCircle, faEdit, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faSpinner, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

library.add(faCheckCircle, faTimesCircle, faEdit, faTrashAlt, faSpinner);

const App = (props) => <Router />;

export default App;
