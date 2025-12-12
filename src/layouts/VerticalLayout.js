// ** React Imports
import { Outlet } from "react-router-dom";

// ** Core Layout Import
// !Do not remove the Layout import
import Layout from "@layouts/VerticalLayout";

// ** Menu Items Array
import navigation from "@src/navigation/vertical";
import CustomFooter from "./components/Footer";

const VerticalLayout = (props) => {
  return (
    <Layout menuData={navigation} footer={(props) => <CustomFooter {...props} />} {...props}>
      <Outlet />
    </Layout>
  );
};

export default VerticalLayout;
