import classNames from "classnames";

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
  const { placeholder, type = "text", passwordToggle = false } = inputProps;

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
      <LabelComponent {...labelProps} name={name} />
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
