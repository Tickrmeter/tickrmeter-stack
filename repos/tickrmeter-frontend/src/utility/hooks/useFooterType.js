// ** React Imports
import { useState } from 'react'

// ** Configs
import themeConfig from '@configs/themeConfig'
import { handleFooterType } from "@src/redux/actions/layout";
import { useDispatch, useSelector } from "react-redux";

export const useFooterType = () => {
  // ** Store Vars
  const dispatch = useDispatch();
  const layoutStore = useSelector((state) => state.layout);

  const setFooter = (val) => dispatch(handleFooterType(val));

  // ** State
  const [footerType, setFooterType] = useState(() => {
    try {
      return themeConfig.layout.footer.type;
    } catch (error) {
      // ** If error also initialValue
      //console.log(error)
      return themeConfig.layout.footer.type;
    }
  });

  // ** Return a wrapped version of useState's setter function
  const setValue = (value) => {
    try {
      // ** Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(footerType) : value;
      setFooter(valueToStore);
      // ** Set state
      setFooterType(valueToStore);
    } catch (error) {
      // ** A more advanced implementation would handle the error case
      //console.log(error)
    }
  };

  return [footerType, setValue];
};
