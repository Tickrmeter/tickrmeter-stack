import classNames from "classnames";
import { Controller } from "react-hook-form";

import { FormFeedback, Input, Label, FormGroup } from "reactstrap";

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

export const SelectField = ({
  name,
  onChange,
  register,
  formGroupClass = "",
  labelProps = {},
  validationProps = {},
  selectProps = {},
  ...rest
}) => {
  const { error, isInvalid = false, formText = <></> } = validationProps;
  const { placeholder, options = [] } = selectProps;

  const inputProps = {
    type: "select",
    name,
    id: name,
    placeholder,
    className: classNames({ "is-invalid": error || isInvalid }),
    ...rest,
    children: [
      placeholder && (
        <option value="" disabled className="placeholder-option">
          {placeholder}
        </option>
      ),
      ...options.map(({ _id, name }) => (
        <option key={_id} value={_id}>
          {name}
        </option>
      )),
    ],
  };
  if (register) {
    const { ref, ...registerField } = register(name);
    inputProps.innerRef = ref;
    inputProps.onChange = registerField.onChange;
  } else {
    inputProps.onChange = onChange;
  }
  return (
    <FormGroup className={formGroupClass}>
      <LabelComponent {...labelProps} name={name} />
      <Input {...inputProps}>
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
      {error && <FormFeedback>{error["message"]}</FormFeedback>}
      {!register && formText}
    </FormGroup>
  );
};

export const SelectFieldControl = ({ name, control, labelProps, placeholder, options, error, register, ...rest }) => {
  return (
    <FormGroup>
      <LabelComponent {...labelProps} name={name} />
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <Input
              type="select"
              id={name}
              {...field} // Spread the field methods from RHF into Input
              {...rest} // Spread any additional props passed down
              invalid={!!error} // Highlight the input if there's an error
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

            {/* Error message */}
            {error && <FormFeedback>{error.message}</FormFeedback>}
          </>
        )}
      />
    </FormGroup>
  );
};
