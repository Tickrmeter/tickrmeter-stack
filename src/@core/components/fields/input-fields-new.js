import { useEffect, useState } from "react";

import classNames from "classnames";
import { FormFeedback, Input, Label, FormGroup, CustomInput } from "reactstrap";

import Autocomplete from "@src/@core/components/autocomplete";
import useDebounce from "@src/@core/components/datatable2/deboucehook";
import InputPasswordToggle from "./input-password-toggle";
import { Controller } from "react-hook-form";

// export const FormInputField = ({ register, name, ...rest }) => {
//   const { ref, ...registerField } = register(name);

//   return <Input innerRef={ref} {...registerField} {...rest} />;
// };

const LabelComponent = ({ label, labelType, labelClassName, name }) => {
  if (!label) return null;

  if (labelType === "component") {
    return <>{label}</>;
  }

  return (
    <Label className={labelClassName} htmlFor={name}>
      {label}
    </Label>
  );
};

export const InputField = ({
  name,
  onChange,
  register,
  formGroupClass = "",
  error = null,
  label,
  labelProps = {},
  inputProps = {},
  ...rest
}) => {
  const { placeholder, type = "text", passwordToggle = false } = inputProps;

  const isInvalid = error ?? false;

  const inputFieldProps = {
    name,
    id: name,
    type,
    placeholder,
    className: classNames({ "is-invalid": error || isInvalid }),
    ...rest,
  };

  if (register) {
    const { ref, ...registerField } = register(name);
    inputFieldProps.innerRef = ref;
    inputFieldProps.onChange = registerField.onChange;
  } else {
    inputFieldProps.onChange = onChange;
  }

  return (
    <FormGroup className={formGroupClass}>
      <LabelComponent label={label} {...labelProps} name={name} />
      {type === "password" && passwordToggle ? (
        <InputPasswordToggle
          {...inputFieldProps}
          className={classNames({ "is-invalid": error, "input-group-merge": true })}
        />
      ) : (
        <Input {...inputFieldProps} />
      )}
      {error && <FormFeedback>{error["message"]}</FormFeedback>}
    </FormGroup>
  );
};

export const CheckBoxFieldControl = ({
  name,
  label,
  control, // Use control here from RHF
  error,
  labelProps = {},
  defaultChecked = false,
  ...rest
}) => {
  return (
    <FormGroup>
      <Controller
        name={name}
        control={control} // Pass control to the Controller
        defaultValue={defaultChecked} // Set initial default value for checkbox
        render={({ field }) => (
          <CustomInput
            {...field} // Bind all the necessary field props (checked, onChange, etc.)
            checked={field.value || false}
            type="checkbox"
            className={`custom-control-primary ${error ? "is-invalid" : ""}`}
            id={name}
            label={<LabelComponent label={label} {...labelProps} name={name} />}
            {...rest} // Spread any other props (like additional attributes)
          />
        )}
      />
      {error && <FormFeedback>{error.message}</FormFeedback>}
    </FormGroup>
  );
};

export const CheckBoxField = ({
  name,
  label,
  onChange,
  error,
  register,
  labelProps = {},
  defaultChecked = false,
  checked = false,
  ...rest
}) => (
  <FormGroup>
    <CustomInput
      type="checkbox"
      className={`custom-control-primary ${error ? "is-invalid" : ""}`}
      id={name}
      name={name}
      label={<LabelComponent {...labelProps} name={name} />}
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
    <Input
      type="file"
      className="form-control"
      id={name}
      name={name}
      onChange={onChange}
      innerRef={register ? register() : null}
      accept=".bin,.bin.signed"
    />
    {error && <FormFeedback>{error["message"]}</FormFeedback>}
  </FormGroup>
);

export const UploadFieldControl = ({
  name,
  label,
  control, // Use control here from RHF
  error,
  labelProps = {},

  ...rest
}) => {
  return (
    <FormGroup>
      <Controller
        name={name}
        control={control} // Pass control to the Controller
        render={({ field }) => (
          <CustomInput
            {...field}
            type="file"
            className={`custom-control-primary ${error ? "is-invalid" : ""}`}
            id={name}
            name={name}
            accept=".bin,.bin.signed"
            label={<LabelComponent label={label} {...labelProps} name={name} />}
            {...rest} // Spread any other props (like additional attributes)
          />
        )}
      />
      {error && <FormFeedback>{error.message}</FormFeedback>}
    </FormGroup>
  );
};

export const AutocompleteField = ({
  onSearch,
  onSearchClick,
  displayKey = undefined,
  customRender = undefined,
  searchButton = undefined,
  className = "",
  reset = false,
  _searchTerm = "",
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
      filterKey={"name"}
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
