import { useState } from "react";
import { AlertCircle } from "react-feather";
import { Alert, Col, Row } from "reactstrap";

import { SYMBOL_TYPES } from "@device-config/helper2";
import { DeviceConfigProvider, useDeviceConfig } from "@device-config/contexts/DeviceConfigContext";

import MultiplierSection from "@device-config/configSection/common/MultiplierSection";
import GainTrackingSection from "@device-config/configSection/common/GainTrackingSection";
import { useDeviceConfigActions } from "@device-config/hooks/useDeviceConfigActions";

import SymbolTypeSelection from "@device-config/configSection/a_SymbolTypeAndMarketSelection";

import AddItemToPlaylist from "./AddItemToPlaylist";
import SearchSymbolForm from "@device-config/configSection/b_SearchSymbolForm";

const PlaylistConfig = ({ playlistState, plErrorState, isMusicCreatorPlaylist }) => {
  return (
    <DeviceConfigProvider>
      <PlaylistConfigContent
        playlistState={playlistState}
        plErrorState={plErrorState}
        isMusicCreatorPlaylist={isMusicCreatorPlaylist}
      />
    </DeviceConfigProvider>
  );
};

const PlaylistConfigContent = ({ playlistState, plErrorState, isMusicCreatorPlaylist }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const { playlistError } = plErrorState;

  const [resetAutoComplete, setResetAutoComplete] = useState(false);

  return (
    <>
      <div className="m-1 p-1" style={{ border: "1px solid #ccc", borderRadius: "10px" }}>
        {playlistError && (
          <Alert color="danger" isOpen={playlistError !== null} fade={true}>
            <div className="alert-body">
              <AlertCircle size={15} />
              <span className="ml-1">{playlistError}</span>
            </div>
          </Alert>
        )}
        <SymbolTypeSelection
          resetFuncs={{ setResetAutoComplete }}
          mode="playlist"
          isMusicCreatorPlaylist={isMusicCreatorPlaylist}
        />
        <SearchSymbolForm
          resetAutoCompleteState={{ resetAutoComplete, setResetAutoComplete }}
          mode="playlist"
          playlistFuncs={{ playlistState, plErrorState }}
        />

        {symbolDetails.symbolType !== SYMBOL_TYPES.MUSIC_CREATORS && (
          <GainTrackingSection symbolDetailsState={{ symbolDetails, setSymbolDetails }} />
        )}

        {symbolDetails.symbolType === SYMBOL_TYPES.CRYPTO && (
          <MultiplierSection symbolDetailsState={{ symbolDetails, setSymbolDetails }} />
        )}

        {!isMusicCreatorPlaylist && (
          <Row className="justify-content-center">
            <Col className="mt-1">
              <AddItemToPlaylist
                playlistState={playlistState}
                plErrorState={plErrorState}
                resetAutoCompleteState={{ resetAutoComplete, setResetAutoComplete }}
              />
            </Col>
          </Row>
        )}
      </div>
    </>
  );
};

export default PlaylistConfig;
