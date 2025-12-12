import classNames from "classnames";

import { FormFeedback, Input, Label, FormGroup, CustomInput } from "reactstrap";

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

const handleRegister = (register, name, onChange) => {
  if (register) {
    const { ref, ...registerField } = register(name);
    return { innerRef: ref, onChange: registerField.onChange };
  } else {
    return { onChange };
  }
};

export const InputField = ({
  name,
  onChange,
  register,
  formGroupClass = "",
  labelProps = {},
  validationProps = {},
  inputProps = {},
  ...rest
}) => {
  const { error, isInvalid = false } = validationProps;
  const { placeholder, type = "text", passwordToggle = false, readOnly } = inputProps;

  const registerProps = handleRegister(register, name, onChange);

  const inputInnerProps = {
    name,
    id: name,
    type,
    placeholder,
    readOnly,
    className: classNames({ "is-invalid": error || isInvalid }),
    ...rest,
    ...registerProps,
  };

  return (
    <FormGroup className={formGroupClass}>
      <LabelComponent {...labelProps} name={name} />
      {type === "password" && passwordToggle ? (
        <InputPasswordToggle
          {...inputInnerProps}
          className={classNames({ "is-invalid": error, "input-group-merge": true })}
        />
      ) : (
        <Input {...inputInnerProps} />
      )}
      {error && <FormFeedback>{error["message"]}</FormFeedback>}
    </FormGroup>
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

  const registerProps = handleRegister(register, name, onChange);

  const selectInnerProps = {
    type: "select",
    name,
    id: name,
    placeholder,
    className: classNames({ "is-invalid": error || isInvalid }),
    ...rest,
    ...registerProps,
  };

  return (
    <FormGroup className={formGroupClass}>
      <LabelComponent {...labelProps} name={name} />
      <Input {...selectInnerProps}>
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

export const CheckBoxField = ({
  name,
  label,
  onChange,
  error,
  register,
  defaultChecked = false,
  checked = false,
  ...rest
}) => {
  const registerProps = handleRegister(register, name, onChange);

  const innerCheckBoxProps = {
    type: "checkbox",
    className: "custom-control-Primary",
    id: name,
    name,
    label,
    onChange,
    defaultChecked: register ? defaultChecked : undefined,
    checked: register ? undefined : checked,
    ...rest,
    ...registerProps,
  };

  return (
    <FormGroup>
      <CustomInput {...innerCheckBoxProps} />
      {error && <FormFeedback>{error["message"]}</FormFeedback>}
    </FormGroup>
  );
};

// <FormGroup>
//     <Input
//       type="checkbox"
//       className={`custom-control-Primary ${error ? "is-invalid" : ""}`}
//       id={name}
//       name={name}
//       label={label}
//       defaultChecked={register ? defaultChecked : undefined}
//       onChange={onChange}
//       innerRef={register ? register() : null}
//       checked={register ? undefined : checked}
//       {...rest}
//     />
//     {label && (
//       <Label for={name} className="ms-1 cursor-hand">
//         {label}
//       </Label>
//     )}
//     {error && <FormFeedback>{error["message"]}</FormFeedback>}
//   </FormGroup>
