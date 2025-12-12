import { useEffect, useState } from "react";

import DataTable from "@components/datatable2";
//import DataTable from "react-data-table-component";
import { getAllUsers } from "@store/actions/data";
import { GetActionCol } from "@src/utility/datatable-common";
import { columns } from "./helper";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import UserForm from "./UserForm";

const Users = () => {
  //const dispatch = useDispatch();

  const [users, setUsers] = useState({});

  const [loading, setLoading] = useState(false);

  //doing this to update the grid, need to come up with some other solution //Redux store didnt worked
  const [refreshGrid, setRefreshGrid] = useState(false);

  // ** set edit id here which is passed in ActionCol below for setting up the edit action in grid.
  const [editUserId, setEditUserId] = useState(null);

  // ** Get data on mount
  useEffect(() => {
    getUsers(1, 10, "createdAt:desc");
  }, [refreshGrid]);

  const getUsers = async (_page, _pageSize, sortBy, searchText) => {
    try {
      setLoading(true);

      const API_URI = `${ApiEndPoint(API_PATHS.ALL_USERS)}?p=${_page}&ps=${_pageSize}&s=${sortBy}${
        searchText ? `&q=${searchText}` : ""
      }`;
      const { success, data, message, type } = await http.get(API_URI);

      if (success) {
        setUsers(data);
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to fetch users!"
            body={type === 1 ? message : "Unable to fetch users, please try again later"}
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }
    } catch (error) {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to fetch users!"
          body={"Error while fetching users, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchUser = (searchText) => {
    getUsers(1, 10, "createdAt:desc", searchText);
  };

  // ** Delete User API Call
  const deleteUser = async (id) => {
    const API_URI = `${ApiEndPoint(API_PATHS.DELETE_USER)}/${id}`;

    const { success, message, type } = await http.delete(API_URI, { _id: id });

    if (success) {
      toast.success(<ToastContent type="success" title="Success!" body={"User deleted successfully!"} />, {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 2000,
      });
      setRefreshGrid(!refreshGrid);
    } else {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to delete!"
          body={type === 1 ? message : "Unable to delete user, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  const ActionCol = GetActionCol({
    editAction: setEditUserId,
    deleteAction: deleteUser,
    nameKey: "name",
    msgSuffix: "user",
  });

  const userColumns = [...columns, ActionCol];

  return (
    <>
      <UserForm
        postSubmit={setRefreshGrid}
        refreshGrid={refreshGrid}
        editUserId={editUserId}
        setEditUserId={setEditUserId}
      />

      <DataTable
        title="Users"
        titleType="component"
        columns={userColumns}
        data={users}
        getData={getUsers}
        loading={loading}
        sort={"createdAt:desc"}
        search={{
          enabled: true,
          placeholder: "Search by email address",
          onSearch: (value) => searchUser(value),
        }}
      />
    </>
  );
};

export default Users;
