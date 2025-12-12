import React, { useState } from "react";
import { Edit2, Save, X } from "react-feather";
import { Button } from "reactstrap";
import { isValidAmount, isValidFolatingNumber } from "../ConfigDeviceNew/helper";
import { InputField } from "@src/utility/input-fields";

function PurchasePriceCell({ purchasePrice, onSave, isEditing, setIsEditing, index, noOfStocks }) {
  const [value, setValue] = useState(purchasePrice);

  const handleEditClick = () => {
    setIsEditing(index);
  };

  const handleSaveClick = () => {
    setIsEditing(-1);
    setValue("");
    onSave(value);
  };

  const handleCancelClick = () => {
    setIsEditing(-1);
    setValue(purchasePrice);
  };

  return (
    <div className="playlist-purchase-price">
      {isEditing === index ? (
        <div>
          <InputField
            name="purchasePrice"
            placeholder="Enter average purchase price"
            onChange={({ target }) => {
              const val = target.value;

              if (!isValidAmount(val)) return false;

              const pp = parseFloat(val.replace(",", "."));

              if (isNaN(pp) && val !== "") return false;
              else if (pp < 0) return false;
              else return setValue(val);
            }}
            value={value || ""}
          />

          <Button.Ripple className="btn-icon" outline color="primary" onClick={handleSaveClick}>
            <Save size={16} />
          </Button.Ripple>
          <Button.Ripple className="btn-icon" outline color="secondary" onClick={handleCancelClick}>
            <X size={16} />
          </Button.Ripple>
        </div>
      ) : (
        <>
          <div>
            {purchasePrice} {noOfStocks ? <>({noOfStocks})</> : ""}
          </div>
          <div className="playlist-edit-button" onClick={handleEditClick}>
            <Edit2 size={18} />
          </div>
        </>
      )}
    </div>
  );
}

export default PurchasePriceCell;
