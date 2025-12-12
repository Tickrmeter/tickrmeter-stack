import React, {useEffect, useState} from "react";
import {Button, Col, Popover, PopoverBody, PopoverHeader} from 'reactstrap';
import Cookies, {useCookies} from "react-cookie";

const PopoverSetup = ({
                          triggeringCookie,
                          placement,
                          target,
                          body,
                          title,
                          nextCookieValue,
                          icon,
                          confirmButtonTitle = "Yes!",
                          showConfirmBtn = true,
                          onClickConfirm = () => {
                          },
                      }) => {
    const [showPopover, setShowPopover] = useState(false);
    const [cookies, setCookie, removeCookie] = useCookies(['setupGuide']);
    useEffect(() => {
        setTimeout(()=> {
            const cookieValue = cookies.setupGuide
            if (cookieValue === triggeringCookie) {
                setShowPopover(true);
            }
            if (!cookieValue) {
                setShowPopover(false);
            }
        }, 700);
    }, [cookies]);
    const onClickOk = () => {
        setShowPopover(false);
        setCookie('setupGuide', nextCookieValue, {path: '/'});
    };
    const onClickClose = () => {
        setShowPopover(false);
        removeCookie('setupGuide')
    };
    return (
        <Popover className={`setup-popover ${triggeringCookie}`} placement={placement} isOpen={showPopover}
                 target={target} toggle={() => {
        }}>
            <PopoverHeader>{title}<Button type="button" className="close-btn" aria-label="Close" onClick={onClickClose}><span
                aria-hidden="true">&times;</span></Button></PopoverHeader>
            <PopoverBody>{body}</PopoverBody>
            <Col className={'popover-footer'}>
                {showConfirmBtn && (
                    <Button color="green" onClick={onClickOk}>
                        {confirmButtonTitle}
                        {icon}
                    </Button>
                )}
            </Col>
        </Popover>
    );
};
export default PopoverSetup;
