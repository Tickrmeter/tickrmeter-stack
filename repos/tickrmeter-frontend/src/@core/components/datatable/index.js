// ** React Imports
import { Fragment, useState, useEffect, memo } from "react";

// ** Redux Hooks
import { useSelector, useDispatch } from "react-redux";

// ** Third Party Components
import { ChevronDown } from "react-feather";
import DataTable from "react-data-table-component";

import { Card, CardHeader, CardTitle, Input, Label, Row, Col } from "reactstrap";
import { searchArrayObject } from "@src/utility/Utils";

import "@styles/react/libs/tables/react-dataTable-component.scss";

const DataTableServerSide = ({
  columns,
  getData,
  title,
  titleType = "string",
  storekey,
  onRowClicked,
  search = true,
  headerBackground = "#f3f2f7",
}) => {
  // ** Store Vars
  //const dispatch = useDispatch();

  const store = useSelector((state) => state.data);

  // ** States
  const [searchValue, setSearchValue] = useState("");

  // ** Function to handle filter
  const handleFilter = (e) => setSearchValue(e.target.value);

  // ** Table data to render
  const dataToRender = () => {
    const isFiltered = searchValue.length > 1;

    const storeData = store[storekey];

    if (isFiltered) {
      //show the filtered result
      const filteredData = searchArrayObject(searchValue, storeData);
      return filteredData;
    } else {
      return storeData;
    }
  };
  const paginationComponentOptions = {
    selectAllRowsItem: true,
    selectAllRowsItemText: "All",
  };

  return (
    <Fragment>
      <Card>
        <CardHeader className="border-bottom">
          {titleType === "string" ? (
            <CardTitle tag="h4">{title}</CardTitle>
          ) : (
            <CardTitle tag="div" className="w-100">
              {title}
            </CardTitle>
          )}
        </CardHeader>
        {search && (
          <Row className="mx-0 mt-1 mb-50">
            <Col sm="6"></Col>
            <Col className="d-flex align-items-center justify-content-sm-end mt-sm-0 mt-1" sm="6">
              <Label className="mr-1" for="search-input">
                Search
              </Label>
              <Input
                className="dataTable-filter"
                type="text"
                bsSize="sm"
                id="search-input"
                value={searchValue}
                onChange={handleFilter}
              />
            </Col>
          </Row>
        )}
        <DataTable
          noHeader
          pagination={true}
          className="react-dataTable"
          columns={columns}
          sortIcon={<ChevronDown size={10} />}
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 15, 20]}
          paginationComponentOptions={paginationComponentOptions}
          data={dataToRender()}
          onRowClicked={onRowClicked ? onRowClicked : () => {}}
          responsive={true}
        />
      </Card>
    </Fragment>
  );
};

export default DataTableServerSide;
