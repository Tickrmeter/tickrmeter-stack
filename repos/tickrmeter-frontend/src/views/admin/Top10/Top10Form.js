import { useState } from "react";
import csvParser from "papaparse";
import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle } from "react-feather";

import {
  Label,
  CustomInput,
  Card,
  Spinner,
  CardHeader,
  Form,
  FormGroup,
  Button,
  CardBody,
  CardTitle,
  Row,
  Col,
  Alert,
  Table,
  FormText,
} from "reactstrap";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";
import { checkForEmptyValues } from "@src/utility/Utils";

const CSVCols = ["Symbol", "Name", "Price", "Percent", "Date", "Currency"];

const Top10Form = () => {
  // ** Component States

  const [top10Details, setTop10Details] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // const [headings, setHeadings] = useState([]);

  // ** Form Events
  const onFileSelect = (e) => {
    csvParser.parse(e.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        processData(results.data);
      },
    });
  };

  const processData = (data) => {
    if (data.length === 0) return;

    setTop10Details(data);
  };

  //

  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      //check if there is no empty value in top10Details
      const hasEmptyValues = !checkForEmptyValues(top10Details, CSVCols);
      if (hasEmptyValues) {
        setServerError("Data has some empty values, select file again to process");
        return;
      }

      const { success, message, type } = await http.post(ApiEndPoint(API_PATHS.UPLOAD_TOP10_DATA), top10Details);

      if (success) {
        showToast();
        // postSubmit(!refreshGrid);
        resetForm();
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      console.error(error);
      setServerError("There is an error processing your request, Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTop10Details([]);
    setServerError(null);
    const fileInput = document.getElementById("top10CSVFile");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const showToast = () => {
    toast.success(<ToastContent type="success" title="Success!" body={`Top10 uploaded successfully!`} />, {
      transition: Slide,
      hideProgressBar: true,
      autoClose: 2000,
    });
  };

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={onSubmit}>
      <Row>
        <Col md="12" sm="12">
          <FormGroup>
            <Label for={"top10CSVFile"}>Upload new CSV file</Label>
            <CustomInput
              type="file"
              className="custom-control-Primary"
              id={"top10CSVFile"}
              name={"top10CSVFile"}
              onChange={onFileSelect}
              accept=".csv"
            />
            <FormText> CSV format is {CSVCols.join(", ")}</FormText>
          </FormGroup>
        </Col>

        <Col sm="12">
          <FormGroup className="d-flex mb-0">
            {isLoading ? (
              <Spinner color="primary" className="mr-50" />
            ) : (
              <Button.Ripple className="mr-1" color="primary" type="submit" disabled={top10Details.length === 0}>
                Submit
              </Button.Ripple>
            )}
            <Button.Ripple outline color="secondary" type="reset" onClick={resetForm}>
              Reset
            </Button.Ripple>
          </FormGroup>
        </Col>
      </Row>
    </Form>
  );

  const renderTable = () => (
    <Col sm="12">
      <Table striped style={{ width: "90%", maxWidth: "1920px", margin: "40px auto " }}>
        <thead>
          <tr>
            {CSVCols.map((heading, idx) => (
              <th key={`c${idx}`}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {top10Details.map((data, idx) => (
            <tr key={`r${idx}`}>
              {CSVCols.map((heading, idx) => (
                <td key={`d${idx}`}>{data[heading]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Col>
  );

  return (
    <Card>
      <CardHeader className={"border-bottom"}>
        <CardTitle className={"d-flex w-100 justify-content-between"}>
          <>
            <h4>Upload New File</h4>
          </>
        </CardTitle>
      </CardHeader>

      <SlideDown className={"react-slidedown"}>
        <CardBody>
          {serverError && (
            <Alert color="danger" isOpen={serverError !== null} fade={true}>
              <div className="alert-body">
                <AlertCircle size={15} />
                <span className="ml-1">{serverError}</span>
              </div>
            </Alert>
          )}
          <Row className="justify-content-center">
            <Col xl="5" lg="6" md="8" sm="12">
              {renderForm()}
            </Col>
          </Row>

          {top10Details.length > 0 && <Row>{renderTable()}</Row>}
        </CardBody>
      </SlideDown>
    </Card>
  );
};

export default Top10Form;
