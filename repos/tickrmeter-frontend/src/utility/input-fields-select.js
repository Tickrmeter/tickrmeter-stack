import Select from "react-select";
import classNames from "classnames";
import { FormFeedback, Label, FormGroup } from "reactstrap";
// Import icon libraries that will be used

export const ReactSelect = ({
  name,
  label,
  onChange,
  error,
  options,
  register,
  labelClassName = "",
  placeholder,
  formText = <></>,
  iconMapType = "",
  value = "", // Add value prop with default empty string
  additionalJXS = null,
  ...rest
}) => {
  // Format options for react-select
  // const selectOptions = options.map(({ _id, name, img }) => ({
  //   value: _id,
  //   label: name,
  //   img,
  // }));

  // Find the selected option based on the value prop
  const selectedOption = options.find((option) => option.value === value) || null;
  const conditionalStyles = additionalJXS
    ? {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      }
    : {};

  // Custom styles to match the original design
  const customStyles = {
    //style={additionalJXS ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : {}}

    container: (provided) => ({
      width: "100%",
      ...provided,
    }),
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? "#dc3545" : provided.borderColor,
      "&:hover": {
        borderColor: error ? "#dc3545" : provided.borderColor,
      },
      height: "43.3px",

      ...conditionalStyles,
    }),
    menu: (provided) => ({
      ...provided,
      marginTop: "1px", // Reduce space between the field and dropdown list
    }),
  };

  // Format option label with icon if available - remove icon parameter
  const formatOptionLabel = (params) => {
    const { label, value, img } = params;
    // Get the selected icon map based on iconMapType, or empty object if not specified

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {img && <img src={img} style={{ marginRight: "10px", width: "18px" }} />}
        <span>{label}</span>
      </div>
    );
  };

  // Handle react-select onChange which returns the selected option
  const handleChange = (selectedOption) => {
    if (onChange) {
      // Create a synthetic event-like object for compatibility
      const syntheticEvent = {
        target: {
          name,
          value: selectedOption ? selectedOption.value : "",
        },
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <FormGroup>
      {label && (
        <Label className={classNames({ [labelClassName]: labelClassName })} for={name}>
          {label}
        </Label>
      )}
      <div className="d-flex">
        <Select
          id={name}
          name={name}
          options={options}
          placeholder={placeholder}
          onChange={handleChange}
          styles={customStyles}
          formatOptionLabel={formatOptionLabel}
          className={classNames({ "is-invalid": error })}
          classNamePrefix="select"
          value={selectedOption} // Set the value prop to the selected option
          {...rest}
        />
        {additionalJXS}
      </div>
      {formText}
      {error && <FormFeedback style={{ display: "block" }}>{error["message"]}</FormFeedback>}
    </FormGroup>
  );
};
