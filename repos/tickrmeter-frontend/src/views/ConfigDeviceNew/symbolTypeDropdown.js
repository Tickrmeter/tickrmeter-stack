import { useState, memo } from "react";
import { SYMBOL_TYPES, SYMBOL_TYPES_LIST } from "./helper2";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label } from "reactstrap";

//? ****************************************************************************  */
//?                     THIS WILL DISPLAYED ON SMALLER DEVICES                    */
//? ****************************************************************************  */
//! ************************** NOT USED ANYMORE ********************************* */

const SymbolTypeDropDown = ({ symbolType, onSymbolTypeChange, showTop10, ...rest }) => {
  const [isDDOpen, toggleDropDown] = useState(false);

  const getSymbolTitle = SYMBOL_TYPES_LIST.find((s) => s.value === symbolType)?.title;

  const symbolTypesToShow = showTop10
    ? SYMBOL_TYPES_LIST
    : SYMBOL_TYPES_LIST.filter((item) => item.value !== SYMBOL_TYPES.TOP10);

  
  alert("render SymbolTypeDropDown");
  
  return (
    <>
      <FormGroup>
        <Label>Display:</Label>
        <Dropdown
          size="lg"
          isOpen={isDDOpen}
          toggle={() => toggleDropDown((prev) => !prev)}
          className="symbol-type-dropdown"
          {...rest}
        >
          <DropdownToggle color="primary" caret>
            {getSymbolTitle}
          </DropdownToggle>
          <DropdownMenu className="symbol-type-ddm m-0 p-0">
            {symbolTypesToShow.map((detail, index) => (
              <DropdownItem
                active={symbolType === detail.value}
                onClick={() => onSymbolTypeChange(detail.value)}
                className={`w-100 ${index === 0 ? "mt-quater" : ""}`}
                key={`st-${index.toString()}`}
              >
                {detail.title}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>{" "}
      </FormGroup>
    </>
  );
};

export default memo(SymbolTypeDropDown);
