import { Fragment, useState } from "react";
import { ChevronDown, Search } from "react-feather";
import PropTypes from "prop-types";
import DataTable from "react-data-table-component";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Col,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  Label,
  Row,
  Spinner,
} from "reactstrap";

import "@styles/react/libs/tables/react-dataTable-component.scss";
import classNames from "classnames";

/**
 * Datatable Component with server side paging
 */

const DataTableSSPaging = ({ loading, columns, title, data, getData, titleType, sort, onRowClicked, search }) => {
  const [pagingData, setPagingData] = useState({
    page: 1,
    size: 10,
    sort,
  });

  const [searchValue, setSearchValue] = useState("");

  const handlePageChange = (page) => {
    setPagingData({ ...pagingData, page });
    getData(page, pagingData.size, pagingData.sort);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPagingData({ ...pagingData, size: newPerPage });
    getData(page, newPerPage, pagingData.sort);
  };

  const handleSort = async (column, sortDirection) => {
    const sort = `${column.selector}:${sortDirection}`;

    setPagingData({ ...pagingData, sort });
    getData(pagingData.page, pagingData.size, sort);
  };

  //avoid multiple calls for search with min 3 chars and one second delay
  // const [searchValue, setSearchValue] = useState("");
  const handleSearch = ({ target: { value } }) => {
    if (value.length > 3) {
      //setSearchValue(value);
      //getData(pagingData.page, pagingData.size, pagingData.sort, value);
      search.onSearch(value);
    }
  };

  return (
    <Fragment>
      <Card>
        <CardHeader className="border-bottom">
          {titleType === "string" ? (
            <CardTitle tag="h4">{title}</CardTitle>
          ) : (
            <CardTitle tag="div" className="w-100">
              <div className="d-flex justify-content-between align-items-center">
                <h4>{title}</h4>
                <div>{loading && <Spinner color="primary" size="md" />}</div>
              </div>
            </CardTitle>
          )}
        </CardHeader>
        {search.enabled && (
          <Row className="mx-0 mt-1 mb-50">
            <Col sm="8"></Col>
            <Col className="d-flex align-items-center justify-content-sm-end mt-sm-0 mt-1" sm="4">
              <Label className="mr-1" for="search-input">
                Search
              </Label>
              <InputGroup>
                <Input
                  name="searchValue"
                  placeholder={search.placeholder}
                  onChange={({ target }) => setSearchValue(target.value)}
                  value={searchValue}
                  className={"search-value"}
                />
                <InputGroupAddon addonType="append">
                  <FormGroup className="d-flex mb-0">
                    <Button.Ripple
                      color="primary"
                      type="button"
                      className={classNames("search-button", { loader: loading })}
                      onClick={() => search.onSearch(searchValue)}
                    >
                      {!loading ? (
                        <>
                          <Search className="d-block " size={16} />
                        </>
                      ) : (
                        <Spinner type="grow" color="white" style={{ width: "1rem", height: "1rem" }} />
                      )}
                    </Button.Ripple>
                  </FormGroup>
                </InputGroupAddon>
              </InputGroup>
            </Col>
          </Row>
        )}
        <DataTable
          noHeader
          data={data.d}
          pagination={true}
          columns={columns}
          onSort={handleSort}
          // defaultSortFieldId={"name"}
          // defaultSortAsc={false}
          //loading={loading}
          progressPending={loading}
          sortIcon={<ChevronDown size={10} />}
          sortServer={true}
          className="react-dataTable"
          paginationServer={true}
          paginationTotalRows={data.t}
          onChangeRowsPerPage={handlePerRowsChange}
          onChangePage={handlePageChange}
          onRowClicked={onRowClicked ? onRowClicked : () => {}}
        />
      </Card>
    </Fragment>
  );
};

export default DataTableSSPaging;

//** PropTypes */
DataTableSSPaging.propTypes = {
  loading: PropTypes.bool.isRequired,
  columns: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  getData: PropTypes.func.isRequired,
  titleType: PropTypes.string,
  sort: PropTypes.string,
  onRowClicked: PropTypes.func,
  search: PropTypes.shape({
    enabled: PropTypes.bool,
    placeholder: PropTypes.string,
    onSearch: PropTypes.func,
  }),
};

DataTableSSPaging.defaultProps = {
  titleType: "string",
  onRowClicked: null,
  sort: "id:desc",
  search: {
    enabled: false,
  },
};
