import { useState } from "react";
import { Button, Table } from "reactstrap";
import useIsLargeScreen from "@src/utility/hooks/useIsLargeScreen";
import { DATA_STREAMS, SYMBOL_TYPES_LIST } from "../ConfigDeviceNew/helper2";
import PurchasePriceCell from "./purchsePriceCell";
import { X } from "react-feather";

const PlaylistSymbolsTable = ({ playlist, setPlaylist, isMusicCreatorPlaylist }) => {
  const isLargeScreen = useIsLargeScreen(815);
  const [isEditing, setIsEditing] = useState(-1);

  const handlePurchasePriceSave = (index, value) => {
    const newPlaylist = [...playlist];
    if (newPlaylist[index].purchasePrice !== "") {
      newPlaylist[index].gainTrackingEnabled = true;
      newPlaylist[index].purchasePrice = value;
    } else {
      newPlaylist[index].gainTrackingEnabled = false;
      newPlaylist[index].purchasePrice = "";
    }
    setPlaylist(newPlaylist);
  };

  const removeSymbolFromList = (symbol, currency, type, timeFrame) => {
    const newPlaylists = playlist.filter((playlist) =>
      type === "music"
        ? playlist.symbol !== symbol ||
          playlist.extraConfig.displaySource !== currency ||
          playlist.extraConfig.displayTimeFrame !== timeFrame
        : playlist.symbol !== symbol || playlist.currency !== currency
    );

    setPlaylist([...newPlaylists]);
  };

  const getTableHeaders = () => {
    if (isMusicCreatorPlaylist) {
      return [
        { title: "Artist/Track" },
        { title: "Service" },
        { title: "Data Point" },

        { title: "Value" },
        { title: "Remove" },
      ];
    } else {
      return [
        { title: "Symbol" },
        { title: "Type" },
        { title: "Current Price" },
        { title: "Purchase Price" },
        { title: "Remove" },
      ];
    }
  };

  const getFinancialRow = (item, index) => {
    return (
      <tr key={index}>
        {!isLargeScreen ? (
          <td style={{ padding: "0.72rem 0.5rem" }}>
            {/* <div className="mb-quaterrem">{item.name}</div> */}
            <div className="font-weight-bold text-primary mb-quaterrem">
              {[DATA_STREAMS.COINGECKO].includes(item.dataStream) ? `${item.symbol}/${item.currency}` : item.symbol}
            </div>
            <div className="mb-quarterrem">{SYMBOL_TYPES_LIST.find((s) => s.value === item.symbolType).title}</div>
            <div>
              {item.price} {item.multiplierEnabled ? <>(x{item.multiplier})</> : ""}
            </div>
            <div>
              {item.purchasePrice} {item.noOfStocks ? `(${item.noOfStocks})` : ""}
            </div>
          </td>
        ) : (
          <>
            {/* <td>{item.name}</td> */}
            <td>
              {[DATA_STREAMS.COINGECKO].includes(item.dataStream) ? `${item.symbol}/${item.currency}` : item.symbol}
            </td>
            <td>{SYMBOL_TYPES_LIST.find((s) => s.value === (item.symbolType === 5 ? 1 : item.symbolType))?.title}</td>
            <td>
              {item.price} {item.multiplierEnabled ? <>(x{item.multiplier})</> : ""}
            </td>
            <td>
              <PurchasePriceCell
                purchasePrice={item.purchasePrice}
                onSave={(value) => handlePurchasePriceSave(index, value)}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                index={index}
                noOfStocks={item.noOfStocks}
                isShortSell={item.isShortSell}
              />
            </td>
          </>
        )}
        <td style={{ padding: "0.72rem 0.5rem", width: "50px" }}>
          <Button.Ripple
            className="btn-icon"
            outline
            color="primary"
            onClick={() => removeSymbolFromList(item.symbol, item.currency)}
          >
            <X size={16} />
          </Button.Ripple>
        </td>
      </tr>
    );
  };

  const getMusicCreatorRow = (item, index) => {
    const extra = item.extraConfig || item.extras || {};
    return (
      <tr key={index}>
        {!isLargeScreen ? (
          <td style={{ padding: "0.72rem 0.5rem" }}>
            <div className="font-weight-bold text-primary mb-quaterrem">{item.symbol}</div>
            <div className="mb-quarterrem">{extra.displaySource}</div>
            <div>{extra.displayLabel}</div>
            {extra.value && <div>{extra.value}</div>}
          </td>
        ) : (
          <>
            <td>{item.symbol || item.searchSymbol}</td>
            <td>{extra.displaySource}</td>
            <td>
              {extra.displayTimeFrame.toLowerCase() === "all time" ? "Total " : "Daily "} {extra.displayLabel}
            </td>
            <td>{item.value}</td>
          </>
        )}
        <td style={{ padding: "0.72rem 0.5rem", width: "50px", textAlign: "center" }}>
          <Button.Ripple
            className="btn-icon"
            outline
            color="primary"
            onClick={() => removeSymbolFromList(item.symbol, extra.displaySource, "music", extra.displayTimeFrame)}
          >
            <X size={16} />
          </Button.Ripple>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <Table striped responsive>
        <thead>
          <tr style={{ color: "white" }}>
            {!isLargeScreen ? (
              <>
                <th>Playlist Symbols</th>
                <th></th>
              </>
            ) : (
              <>
                {getTableHeaders().map((col, index) => (
                  <th key={index} style={{ width: col.width || "auto" }}>
                    {col.title}
                  </th>
                ))}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {playlist.map((item, index) => (
            <>{isMusicCreatorPlaylist ? getMusicCreatorRow(item, index) : getFinancialRow(item, index)}</>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default PlaylistSymbolsTable;
