import { useEffect, useState } from "react";

import classNames from "classnames";
import { FormFeedback, Input, CustomInput, Label, FormGroup } from "reactstrap";

import Autocomplete from "@src/@core/components/autocomplete";
import useDebounce from "@src/@core/components/datatable2/deboucehook";
import InputPasswordToggle from "@src/@core/components/input-password-toggle";

export const InputField = ({
  name,
  label,
  onChange,
  placeholder,
  error,
  register,
  labelClassName = "",
  type = "text",
  formGroupClass = "",
  passwordToggle = false,
  isInvalid = false,
  ...rest
}) => (
  <FormGroup className={formGroupClass}>
    {label && (
      <Label className={classNames({ [labelClassName]: labelClassName })} for={name}>
        {label}
      </Label>
    )}
    {type === "password" && passwordToggle ? (
      <InputPasswordToggle
        name={name}
        id={name}
        type="password"
        onChange={onChange}
        className={classNames({ "is-invalid": error, "input-group-merge": true })}
        innerRef={register ? ("current" in register ? register : register()) : null}
      />
    ) : (
      <Input
        name={name}
        id={name}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        className={classNames({ "is-invalid": error || isInvalid })}
        innerRef={register ? ("current" in register ? register : register()) : null}
        {...rest}
      />
    )}
    {error && <FormFeedback>{error["message"]}</FormFeedback>}
  </FormGroup>
);

export const CheckBoxField = ({
  name,
  label,
  onChange,
  error,
  register,
  defaultChecked = false,
  checked = false,
  className = "",
  ...rest
}) => (
  <FormGroup className={className}>
    <CustomInput
      type="checkbox"
      className="custom-control-Primary"
      id={name}
      name={name}
      label={label}
      defaultChecked={register ? defaultChecked : undefined}
      onChange={onChange}
      innerRef={register ? register() : null}
      checked={register ? undefined : checked}
      {...rest}
    />
    {error && <FormFeedback>{error["message"]}</FormFeedback>}
  </FormGroup>
);

export const UploadField = ({ name, label, onChange, error, register }) => (
  <FormGroup>
    <Label for={name}>{label}</Label>
    <CustomInput
      type="file"
      className="custom-control-Primary"
      id={name}
      name={name}
      onChange={onChange}
      innerRef={register()}
      accept=".bin,.bin.signed"
    />
    {error && <FormFeedback>{error["message"]}</FormFeedback>}
  </FormGroup>
);

export const SelectField = ({
  name,
  label,
  onChange,
  error,
  options,
  register,
  labelClassName = "",
  placeholder,
  formText = <></>,
  ...rest
}) => (
  <FormGroup>
    {label && (
      <Label className={classNames({ [labelClassName]: labelClassName })} for={name}>
        {label}
      </Label>
    )}
    <Input
      type="select"
      name={name}
      id={name}
      onChange={onChange}
      className={classNames({ "is-invalid": error })}
      innerRef={register ? register() : null}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled className="placeholder-option">
          {placeholder}
        </option>
      )}
      {options.map(({ _id, name }) => (
        <option key={_id} value={_id}>
          {name}
        </option>
      ))}
    </Input>

    {formText}
    {error && <FormFeedback>{error["message"]}</FormFeedback>}
  </FormGroup>
);

export const SelectFieldCustom = ({
  name,
  label,
  onChange,
  error,
  options,
  register,
  labelClassName = "",
  placeholder,
  additionalJXS = null,
  formText = <></>,
  ...rest
}) => (
  <FormGroup>
    {label && (
      <Label className={classNames({ [labelClassName]: labelClassName })} for={name}>
        {label}
      </Label>
    )}
    <div className="d-flex">
      <Input
        type="select"
        name={name}
        id={name}
        onChange={onChange}
        className={classNames({ "is-invalid": error })}
        style={additionalJXS ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}}
        innerRef={register ? register() : null}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled className="placeholder-option">
            {placeholder}
          </option>
        )}
        {options.map(({ _id, name }) => (
          <option key={_id} value={_id}>
            {name}
          </option>
        ))}
      </Input>
      {additionalJXS}
    </div>
    {formText}
    {error && <FormFeedback>{error["message"]}</FormFeedback>}
  </FormGroup>
);

export const AutocompleteField = ({
  onSearch,
  onSearchClick,
  displayKey = undefined,
  customRender = undefined,
  searchButton = undefined,
  className = "",
  reset = false,
  _searchTerm = "",
  isSearchOnEnter = true,
  filterKey = "name",
  addItemToList = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(_searchTerm);
  const [searchResults, setSearchResults] = useState([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    setSearchTerm(_searchTerm);
  }, [_searchTerm]);

  useEffect(() => {
    //console.log("useEffect reset", reset);
    if (reset === true) {
      //console.log("clearing ...");
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [reset]);

  useEffect(() => {
    onSearch(debouncedSearchTerm, (results) => {
      setSearchResults(results);
    });
  }, [debouncedSearchTerm]);

  return (
    <Autocomplete
      name="symbolSearch"
      onSuggestionClick={onSearchClick}
      defaultValue=""
      filterKey={filterKey}
      placeholder={`Type here to search...`}
      onChange={handleInputChange}
      suggestions={searchResults}
      // style={{ textTransform: "uppercase", width: "auto" }}
      value={searchTerm}
      suggestionLimit={10}
      customRender={customRender}
      displayKey={displayKey}
      className={className}
      searchButton={searchButton}
      reset={reset}
      isSearchOnEnter={isSearchOnEnter}
    />
  );
};

// export const ReactSelectField = ({
//   name,
//   label,
//   onChange,
//   error,
//   options,
//   register,
//   labelClassName = "",
//   placeholder,
//   CustomOption,
//   ...rest
// }) => (
//   <FormGroup>
//     {label && (
//       <Label className={classNames({ [labelClassName]: labelClassName })} for={name}>
//         {label}
//       </Label>
//     )}
//     <Select
//       name={name}
//       id={name}
//       styles={BootstrapReactSelectStyle}
//       onChange={onChange}
//       placeholder={placeholder}
//       className={classNames({ "is-invalid": error })}
//       options={options.map(({ _id, name, flag }) => ({ value: _id, name, flag }))}
//       components={{
//         Option: CustomOption,
//         DropdownIndicator,
//       }}
//       isSearchable={false}
//       {...rest}
//     />
//   </FormGroup>
// );

// const DropdownIndicator = () => null;

// const BootstrapReactSelectStyle = {
//   control: (provided, state) => ({
//     ...provided,
//     padding: "0.438rem 1rem",
//     backgroundColor: "#fff",
//     backgroundClip: "padding-box",
//     border: state.isFocused || state.isHover ? "1px solid #0eb663;" : "1px solid #d8d6de",
//     boxShadow: state.isFocused ? "" : "",
//     "&:hover": {
//       border: state.isFocused ? "1px solid #0eb663" : "1px solid #d8d6de",
//     },
//     borderRadius: "0.357rem",
//     backgroundPosition: "calc(100% - 12px) 13px, calc(100% - 20px) 13px, 100% 0",
//     paddingRight: "1.5rem",
//     backgroundImage:
//       "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d8d6de' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-down'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
//     backgroundSize: "18px 14px, 18px 14px",
//     backgroundRepeat: "no-repeat",
//     display: "block",
//     width: "100%",
//     height: "2.714rem",
//     fontSize: "1rem",
//     fontWeight: "400",
//     lineHeight: "1.45",
//     color: "#6e6b7b",
//     transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
//     display: "flex",
//   }),
//   valueContainer: (provided) => ({
//     ...provided,
//     margin: "0px",
//   }),
//   input: (provided) => ({
//     ...provided,
//     margin: "0px",
//   }),
//   indicatorSeparator: (state) => ({
//     display: "none",
//   }),
//   indicatorsContainer: (provided) => ({
//     ...provided,
//     height: "30px",
//   }),
//   // menu: (provided) => ({
//   //   ...provided,
//   //   backgroundColor: "#ffdddf", // change this to your desired color
//   //   padding: "0.438rem 1rem",
//   // }),
//   // option: (provided, state) => ({
//   //   ...provided,
//   //   color: state.isSelected ? "#fff" : "#6c757d", // change these to your desired colors
//   //   backgroundColor: state.isSelected ? "#0eb663" : "#f8f9fa",
//   // }),
// };

// {
//   /* <Input
//         name="symbolSearch"
//         placeholder={`Type here to search for coins`}
//         onChange={handleInputChange}
//         style={{ textTransform: "uppercase" }}
//         value={searchTerm}
//       />

//       <ul>
//         {searchResults.map((result) => (
//           <li key={result.symbol}>
//             {result.symbol} - {result.name}
//           </li>
//         ))}
//       </ul> */
// }
