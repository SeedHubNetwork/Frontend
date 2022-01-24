import React, {
  Fragment,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { ProgressBar } from "react-bootstrap";
import {
  fixedSwapABI,
  fixedSwapContractAddress,
} from "../../contracts/FixedSwap";
import coinABI from "../../contracts/ERC20ABI";
import { Web3Context } from "../../context/web3Context";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Countdown from "react-countdown";
import { ReactComponent as MaxIcon } from "../../Assets/Images/max.svg";
import "./PoolForm.scss";

// Countdown Timer
// const Completionist = () => <span>0 d : 0 h : 0 m : 0 s</span>;
const renderer = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return <></>;
  }
  // Render a countdown
  return (
    <span>
      <span className="mx-2">{days} d</span>:
      <span className="mx-2">{hours} h</span>:
      <span className="mx-2">{minutes} m</span>:
      <span className="mx-2">{seconds} s</span>
    </span>
  );
};

// const renderer2 = ({ days, hours, minutes, seconds }) => {
//   console.lo
//   // Render a countdown
//   return (
//     <span>
//       <span className="mx-2">{days} d</span>:
//       <span className="mx-2">{hours} h</span>:
//       <span className="mx-2">{minutes} m</span>:
//       <span className="mx-2">{seconds} s</span>
//     </span>
//   );
// };

const Fixedswap = (props) => {
  const [web3, setWeb3] = useContext(Web3Context);
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [currentBalance, setCurrentBalance] = useState("");
  const location = useLocation();
  const [amount, setAmount] = useState();
  const [bidPrice, setPriceAmount] = useState(0);
  const [isWeb3Connected, setWeb3Status] = useState(false);

  // const statusRef = useRef("");
  // useEffect(() => {
  //   const date = new Date(location.state.endAuctionAt * 1000);
  //   date < new Date()
  //     ? (statusRef.current.innerText = "Closed")
  //     : (statusRef.current.innerText = "Live");
  // }, []);
  // const date = new Date(location.state.endAuctionAt * 1000);
  // const statusObj =
  //   date < new Date()
  //     ? { status: "Closed", isClosed: true }
  //     : { status: "Live", isClosed: false };
  const getSymbol = async () => {
    if (web3?.eth) {
      const tokenContract = new web3.eth.Contract(
        coinABI,
        location.state.sellToken
      );
      await tokenContract.methods
        .symbol()
        .call()
        .then((e) => setTokenSymbol(e))
        .catch((e) => setError(e.message));
    }
  };

  const getDecimals = async () => {
    if (web3?.eth) {
      const tokenContract = new web3.eth.Contract(
        coinABI,
        location.state.sellToken
      );
      await tokenContract.methods
        .decimals()
        .call()
        .then((e) => setTokenDecimals(e))
        .catch((e) => setError(e.message));
    }
  };

  const getUserWalletAddress = async () => {
    if (web3) {
      let addressArray = await web3?.eth.getAccounts();
      setAddress(addressArray[0]);
      setWeb3Status(true);
    } else {
      alert("Please Connect Wallet");
      setWeb3Status(false);
    }
  };

  const getTokenBalance = () => {
    if (web3) {
      if (address) {
        web3.eth
          .getBalance(address)
          .then((e) => setCurrentBalance(web3.utils.fromWei(e)));
        // let coinContract = new web3.eth.Contract(
        //   coinABI,
        //   location.state.sellToken
        // );
        // coinContract.methods
        //   .balanceOf(address)
        //   .call()
        //   .then((e) => {
        //     console.log("Hello");
        //     setCurrentBalance(e);
        //   })
        //   .catch((e) => setError(e.message));
      }
    }
  };

  useEffect(() => {
    getUserWalletAddress();
    getSymbol();
    getDecimals();
    getTokenBalance();
    const endAuctionDate = new Date(location.state.endAuctionAt * 1000);
    const claimDate = new Date(location.state.claimAuctionFundsAt * 1000);
    const startDate = new Date(location.state.startAuctionAt * 1000);
    console.log(endAuctionDate.toString());
    console.log(claimDate.toString());
    console.log(startDate.toString());
    if (startDate < new Date()) {
      console.log("start");
      setIsStarted(true);
    }
    if (endAuctionDate < new Date()) {
      console.log("end auction");
      setIsClosed(true);
    }
    if (claimDate < new Date()) {
      console.log("expired");
      setIsExpired(true);
    }
  }, [web3, address]);

  function toFixed(x) {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split("e-")[1]);
      if (e) {
        x *= Math.pow(10, e - 1);
        x = "0." + new Array(e).join("0") + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split("+")[1]);
      if (e > 20) {
        e -= 20;
        x /= Math.pow(10, e);
        x += new Array(e + 1).join("0");
      }
    }
    return x;
  }

  const handleClick = async (e) => {
    e.preventDefault();
    const contract = new web3.eth.Contract(
      fixedSwapABI,
      fixedSwapContractAddress
    );
    console.log(amount * 10 ** tokenDecimals + "");

    let amountString = toFixed(amount * 10 ** tokenDecimals).toString();

    if (amountString.indexOf(".") !== -1) {
      let index = amountString.indexOf(".");
      amountString = Math.ceil(
        toFixed(amount * 10 ** tokenDecimals)
      ).toString();
    }

    await contract.methods
      .addBid(location.state.index, amountString)
      .send({
        from: address,
        value: web3.utils.toWei(bidPrice),
      })
      .then(() => alert("Bid added Successfully!!"))
      .catch(() => alert("Something went wrong"));
  };

  const calculateAmount = async (price) => {
    const contract = new web3.eth.Contract(
      fixedSwapABI,
      fixedSwapContractAddress
    );

    if (price !== "") {
      console.log(price, location.state.swapRatio);
      const Calamount = await contract.methods
        .calculateAmount(
          web3.utils.toWei(price),
          location.state.swapRatio,
          tokenDecimals
        )
        .call();
      console.log(Calamount);
      setAmount(Calamount / 10 ** tokenDecimals);
    }
  };

  const calculateAmountFromPrice = (price) => {
    setPriceAmount(price);
    calculateAmount(price);
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    const contract = new web3.eth.Contract(
      fixedSwapABI,
      fixedSwapContractAddress
    );
    console.log("=====>", contract.methods);
    await contract.methods
      .userWithDrawFunction(location.state.index)
      .send({
        from: address,
      })
      .then(() => alert("Claim Successfully!!"))
      .catch((e) => alert("Something went wrong", e));
  };
  return (
    <Fragment>
      <Header />
      <div className="pool-form">
        <div className="pool-form-container">
          <form>
            <Row className="g-0 mb-5">
              <Col>
                <div className="form-header">
                  SeedHub
                  <div className="title">{location.state.name}</div>
                  <div className="token-code text-break">
                    {location?.state?.sellToken}
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={6} lg={5}>
                <div className="leftcol">
                  <div className="card-head mb-4 d-flex flex-column">
                    <span>
                      <div
                        className={`${isClosed ? "dotClose" : "dotLive"} me-2`}
                      />
                      <div className={isClosed && "closed"}>
                        {isClosed ? "Closed" : "Live"}
                      </div>
                    </span>
                    <p>
                      <span>Participants</span>
                      <p>
                        {location.state.isOnlyWhiteList
                          ? "WhiteList "
                          : "Public "}
                        {location.state.isOnlySeed
                          ? "and for seed Holders"
                          : "Only"}
                      </p>
                    </p>
                  </div>
                  <p>Fixed Swap Ratio</p>
                  <h3>
                    1 ETH = {location.state.swapRatio} {tokenSymbol}
                  </h3>
                  <div className="divder"></div>
                  <div className="row">
                    <div className="col">
                      <p className="mb-3">Maximum Allocation per wallet</p>
                      <h3>
                        {web3?.utils.fromWei(location.state.maxAmountPerWallet)}{" "}
                        ETH
                      </h3>
                      <div className="divder"></div>
                    </div>
                  </div>
                  <div className="d-none flex-column">
                    <div className="d-flex justify-content-center">
                      <p className="me-2">Auction progress: 0 ETH</p>
                      <p> / 303 ETH</p>
                    </div>
                    <ProgressBar now={60} />
                  </div>
                </div>
              </Col>
              <Col
                md={6}
                lg={5}
                className="offset-lg-2 mt-4 mt-md-0 p-4 p-md-5 bg-off"
              >
                <div className="form-heading text-center mb-4">
                  {!isStarted
                    ? "Time Until Pool Launch"
                    : !isClosed
                    ? "Join The Pool"
                    : !isExpired
                    ? "Wait For Claim Time"
                    : "Claim Funds"}
                </div>
                <div className="text-center fs-6">
                  {!isStarted ? (
                    <Countdown
                      key={0}
                      date={new Date(location.state.startAuctionAt * 1000)}
                      renderer={renderer}
                      onComplete={() => {
                        setIsStarted(true);
                      }}
                    />
                  ) : !isClosed ? (
                    <Countdown
                      key={1}
                      renderer={renderer}
                      date={new Date(location.state.endAuctionAt * 1000)}
                      onComplete={() => {
                        setIsClosed(true);
                      }}
                    />
                  ) : !isExpired ? (
                    <Countdown
                      key={2}
                      renderer={renderer}
                      date={new Date(location.state.claimAuctionFundsAt * 1000)}
                      onComplete={() => {
                        setIsExpired(true);
                      }}
                    />
                  ) : (
                    <></>
                  )}
                  {/* <Countdown
                      key={0}
                      date={new Date(location.state.endAuctionAt * 1000)}
                      renderer={renderer}
                      onComplete={() => {
                        setIsClosed(true);
                      }}
                    /> */}
                </div>
                {!isClosed ? (
                  <>
                    <div className="divder"></div>
                    <div className="d-flex justify-content-between">
                      <span className="label">Amount</span>
                      <span className="label">
                        Balance: {parseFloat(currentBalance).toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="d-flex">
                      <input
                        className="custom-input me-3"
                        type="number"
                        min="0"
                        required
                        name="amount"
                        onKeyPress={(e) => {
                          if (
                            e.code === "Minus" ||
                            e.code === "NumpadSubtract" ||
                            e.code === "Comma" ||
                            e.code === "NumpadAdd"
                          ) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Bid Amount"
                        disabled={!isStarted}
                        onChange={(e) =>
                          calculateAmountFromPrice(e.target.value)
                        }
                      />
                      <input
                        className="custom-input ms-3"
                        disabled
                        type="number"
                        min="0"
                        onKeyPress={(e) => {
                          if (
                            e.code === "Minus" ||
                            e.code === "NumpadSubtract" ||
                            e.code === "Comma" ||
                            e.code === "NumpadAdd"
                          ) {
                            e.preventDefault();
                          }
                        }}
                        required
                        name="amount"
                        placeholder="Token Amount"
                        value={amount}
                      />
                    </div>
                  </>
                ) : (
                  <></>
                )}
                {!isClosed ? (
                  <>
                    <Button
                      onClick={handleClick}
                      disabled={amount > 0 && isWeb3Connected ? false : true}
                      className="sub-btn mt-3"
                    >
                      GO
                    </Button>
                    <p
                      style={{
                        color: "red",
                        marginTop: "5px",
                        textAlign: "center",
                        fontSize: "14px",
                      }}
                    >
                      warning: SeedHub does not support deflationary tokens
                    </p>
                  </>
                ) : (
                  <Button
                    onClick={handleClaim}
                    disabled={isExpired > 0 && isWeb3Connected ? false : true}
                    className="sub-btn mt-3"
                  >
                    Claim Funds
                  </Button>
                )}
              </Col>
            </Row>
          </form>
        </div>
      </div>
      <Footer />
    </Fragment>
  );
};

export default Fixedswap;
