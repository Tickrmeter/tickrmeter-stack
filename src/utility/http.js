import axios from "axios";

const getDispatch = async (url, dispatch, action, config = {}) =>
  await axios.get(url, config).then(({ data }) =>
    dispatch({
      type: action,
      data,
    })
  );

const get = async (url, config = {}) => await axios.get(url, config).then(({ data }) => data);

const post = async (url, data) =>
  await axios
    .post(url, data)
    .then((res) => res?.data || res)
    .catch((error) => {
      if (error.response) return error.response.data;
      return error;
    });

const put = async (url, data) =>
  await axios
    .put(url, data)
    .then((res) => res?.data || res)
    .catch((error) => (error.response ? error.response.data : error));

const deleteIt = async (url, data) => {
  return await axios
    .delete(url, { data })
    .then((res) => res?.data || res)
    .catch((error) => {
      if (error.response) return error.response.data;
      return error;
    });
};

const download = async (url, filename) => {
  return await axios
    .get(url, { responseType: "blob" })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.setAttribute("download", filename); //or any other extension
      document.body.appendChild(link);
      link.click();
    })
    .catch((error) => (error.response ? error.response.data : error));
};

const getWithCancelToken = async (url, cancelToken) => await axios.get(url, { cancelToken }).then(({ data }) => data);

export default {
  get,
  getDispatch,
  post,
  put,
  delete: deleteIt,
  download,
  getWithCancelToken,
};
