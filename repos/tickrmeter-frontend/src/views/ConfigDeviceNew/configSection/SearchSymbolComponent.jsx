import { useState, useEffect } from "react";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";
import http from "@src/utility/http";
import { AutocompleteField } from "@src/utility/input-fields";
import classNames from "classnames";
import countries from "@src/assets/data/countries.json";
import { SYMBOL_TYPES, SYMBOL_TYPES_LIST } from "../helper2";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

const SearchSymbolComponent = ({
  symbolType,
  onSearchClick,
  searchButton,
  reset,
  _searchTerm,
  isSearchOnEnter = true,
  addItemToList = false,
}) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const { dataStream, dataMarket } = symbolDetails;

  const handleSearch = async (searchTerm, setSearchResults) => {
    try {
      if (searchTerm.trim().length < 1) return setSearchResults([]);

      if (
        [SYMBOL_TYPES.STOCK, SYMBOL_TYPES.INDICES, SYMBOL_TYPES.ETF].includes(symbolType || symbolDetails.symbolType)
      ) {
        //onConfigChange({ name: "searchSymbol", value: searchTerm.toUpperCase() });
        setSymbolDetails({ ...symbolDetails, searchSymbol: searchTerm.toUpperCase() });
      }

      const _type = SYMBOL_TYPES_LIST.find((s) => s.value === symbolType)?.title || symbolType;

      const url = `${ApiEndPoint(
        API_PATHS.AUTO_COMPELETE_SEARCH
      )}/${dataStream}/${dataMarket}?q=${searchTerm}&t=${_type}`;

      const response = await http.get(url);

      const data = response?.data || [];

      //check if exact match is not found in the list, add the search term to the list
      if (data.length === 0 && symbolDetails.symbolType === SYMBOL_TYPES.CRYPTO) {
        const newItem = {
          id: searchTerm,
          symbol: searchTerm,
          name: searchTerm,
        };
        data.push(newItem);
      }

      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <AutocompleteField
        name="symbolSearch"
        onSearch={(searchTerm, setSearchResults) => handleSearch(searchTerm, setSearchResults)}
        onSearchClick={onSearchClick}
        customRender={renderSymbolAutoComp}
        displayKey={"symbol"}
        searchButton={searchButton}
        className="search-symbol-auto"
        reset={reset}
        _searchTerm={_searchTerm}
        isSearchOnEnter={isSearchOnEnter}
        addItemToList={addItemToList}
      />
    </>
  );
};

export default SearchSymbolComponent;

export const renderSymbolAutoComp = (
  item,
  i,
  filteredData,
  activeSuggestion,
  onSuggestionItemClick,
  onSuggestionItemHover
) => {
  return (
    <li
      className={classNames(
        "suggestion-item",
        {
          active: filteredData.indexOf(item) === activeSuggestion,
        },
        { "d-flex justify-content-between align-items-center": true }
      )}
      key={`suggestion-${i}`}
      onClick={(e) => onSuggestionItemClick(item, e)}
      onMouseEnter={() => onSuggestionItemHover(filteredData.indexOf(item))}
    >
      <div>
        {item?.symbol} - {item?.name}
      </div>
      {(item?.currency || item?.country_code) && (
        <div className="small w-50 text-right">
          <strong>{item?.currency}</strong>
          <br /> {item?.country_code && <LocaleFlag code={item?.country_code} />}
        </div>
      )}
    </li>
  );
};

const LocaleFlag = ({ code }) => {
  const [flag, setFlag] = useState();
  useEffect(() => {
    const loadSvg = async () => {
      const cc = countries.find((c) => c.code === code)?.code2.toLowerCase();
      const { default: response } = await import(`svg-country-flags/svg/${cc}.svg`);

      setFlag(response);
    };
    loadSvg();
  }, [code]);
  return <img src={flag} height={24} />;
};
