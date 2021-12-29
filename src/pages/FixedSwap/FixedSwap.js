import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  Fragment,
} from "react";
import { Row, Col, Button } from "react-bootstrap";
import Header from "../../components/Header/Header";
import Select from "react-select";
import Footer from "../../components/Footer/Footer";
import { ReactComponent as MaxIcon } from "../../Assets/Images/max.svg";
import "react-calendar/dist/Calendar.css";

import "./FixedSwap.scss";

import DateTimePicker from "react-datetime-picker";
import Calendar from "react-calendar";
import { Web3Context } from "../../context/web3Context";

import coinABI from "../../contracts/ERC20ABI";
import {
  fixedSwapABI,
  fixedSwapContractAddress,
} from "../../contracts/FixedSwap";

const poolOptions = [
  { value: "eth", label: "ETH" },
  { value: "usdt", label: "USDT" },
  { value: "avax", label: "AVAX" },
];

const Fixedswap = (props) => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenAllocation, setTokenAllocation] = useState(0);
  const [swapRatio, setSwapRatio] = useState(null);
  const [maxAmountPerWallet, setMaxAmountPerWallet] = useState(100000000000000);
  const [isOnlySeeHolder, setIsOnlySeedHolder] = useState(false);
  const [enableWhiteList, setEnableWhitelist] = useState(false);

  const [poolName, setPoolName] = useState("");
  const dateErrorRef = useRef(null);
  const isFirstRun = useRef(true);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [claimDate, setClaimDate] = useState(new Date());

  const [currency, setSelectedCurreny] = useState({
    value: "eth",
    label: "ETH",
  });

  const [passfield, setpassfield] = useState(false);
  const [limitfield, setlimitfield] = useState(false);

  const [currentBalance, setCurrentBalance] = useState("");

  const [isFromValid, setIsFromValid] = useState(false);

  const [web3, setWeb3] = useContext(Web3Context);
  const [address, setAddress] = useState(Web3Context);

  const [isTransferNotApproved, setTransferApproval] = useState(true);

  const [isWeb3Connected, setWeb3Status] = useState(false);

  const [whitelist, setWhitelist] = useState("");

  const [listdata, setListData] = useState([]);

  const [transactionFee, setTransactionFee] = useState(0);

  const getUserWalletAddress = async () => {
    if (web3) {
      let addressArray = await web3?.eth.getAccounts();
      setAddress(addressArray[0]);
      setWeb3Status(true);
      getTransactionFee();
    } else {
      alert("Please Connect Wallet");
      setWeb3Status(false);
    }
  };

  useEffect(() => {
    getUserWalletAddress();
  }, [web3, address]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (endDate < startDate) {
      setTransferApproval(false);
      dateErrorRef.current.innerText =
        "End date should be greater than start Date";
      return;
    }
    if (claimDate < endDate) {
      setTransferApproval(false);
      dateErrorRef.current.innerText =
        "Claim data should be greater than end Date";
      return;
    }
    setTransferApproval(true);
    dateErrorRef.current.innerText = "";
  }, [startDate, endDate, claimDate]);

  const getTimeStampsForDates = (date) => {
    return Math.ceil(new Date(date).getTime() / 1000);
  };

  const tokenAddressValidation = (address) => {
    if (address.length != 42) {
      return false;
    }

    // if (address.splice(0, 1) == "0x") return false;

    return true;
  };

  const getTokenName = async (address) => {
    let coinContract = new web3.eth.Contract(coinABI, address);
    setCurrentBalance(await getTokenBalance(address));
    return await coinContract.methods.name().call();
  };

  const getTransactionFee = async () => {
    let fixedSwapContract = new web3.eth.Contract(
      fixedSwapABI,
      fixedSwapContractAddress
    );

    let transFee = await fixedSwapContract.methods.getTransactionFee().call();

    setTransactionFee(web3.utils.fromWei(transFee));
  };

  const getTokenBalance = async (tokenAddress) => {
    let coinContract = new web3.eth.Contract(coinABI, tokenAddress);

    return await coinContract.methods.balanceOf(address).call();
  };

  const checkIfFromIsValid = () => {};

  const setToken = async (address) => {
    console.log(address);

    if (tokenAddressValidation(address)) {
      setTokenAddress(address);
      let name = await getTokenName(address);
      setTokenName(name);
    }
  };

  const getMaxBalanceForToken = async () => {
    setCurrentBalance(await getTokenBalance());
  };

  const approveTokenTransafer = async () => {
    let coinContract = new web3.eth.Contract(coinABI, tokenAddress);

    console.log(tokenAllocation);

    return await coinContract.methods
      .approve(fixedSwapContractAddress, tokenAllocation)
      .send({ from: address })
      .then(() => setTransferApproval(false))
      .catch((e) => setTransferApproval(true));
  };

  const validationForForm = (poolReq) => {};

  const setPoolType = (type) => {
    console.log(type);
    switch (type) {
      case "public":
        setIsOnlySeedHolder(false);
        setEnableWhitelist(false);
      case "whitelist":
        setEnableWhitelist(true);
    }
  };

  const makePool = async () => {
    let fixedSwapContract = new web3.eth.Contract(
      fixedSwapABI,
      fixedSwapContractAddress
    );

    const poolReq = [
      poolName,
      tokenAddress,
      parseInt(swapRatio),
      parseInt(maxAmountPerWallet),
      parseInt(tokenAllocation),
      getTimeStampsForDates(startDate),
      getTimeStampsForDates(endDate),
      getTimeStampsForDates(claimDate),
      isOnlySeeHolder,
      false,
      listdata,
    ];
    console.log(poolReq);

    await fixedSwapContract.methods
      .createLiquidityPool(
        poolName,
        tokenAddress,
        swapRatio,
        maxAmountPerWallet,
        tokenAllocation,
        getTimeStampsForDates(startDate),
        getTimeStampsForDates(endDate),
        getTimeStampsForDates(claimDate),
        isOnlySeeHolder,
        enableWhiteList,
        listdata
      )
      .send({ from: address });
  };

  const deleteItemFromArrayAtIndex = (index) => {
    const data = listdata.splice(index, 1);
    setListData(listdata);
  };

  return (
    <Fragment>
      <Header />
      <div className="fixed-swap-pool">
        <div className="fixed-swap-form-container">
          <form>
            <Row className="g-0">
              <Col>
                <div className="form-header">
                  Initial Token Offering
                  <div className="title">
                    Create a Fixed-swap Pool
                    <Button href="">How to Create a pool</Button>
                  </div>
                </div>
              </Col>
            </Row>
            <Row className="my-5 g-0">
              <Col md={7}>
                <div className="form-heading">Contract information</div>
              </Col>
              <Col md={5}>
                <span className="label">Token Contract address</span>
                <input
                  className="custom-input"
                  required
                  name="address"
                  defaultValue=""
                  onChange={(e) => setToken(e.target.value)}
                  disabled={!isWeb3Connected}
                />
              </Col>
            </Row>
            <div className="divder"></div>
            <Row>
              <Col md={7}>
                <div className="form-heading">Pool settings</div>
              </Col>
              <Col md={5}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="w-50 me-3">
                    <span className="label">From</span>
                    <input
                      className="custom-input"
                      required
                      name="from"
                      defaultValue={tokenName}
                      disabled={!isWeb3Connected}
                    />
                  </div>
                  <div className="w-50 to-select">
                    <span className="label">To</span>
                    <Select
                      options={poolOptions}
                      defaultValue={poolOptions[0]}
                      onChange={(e) => {
                        setSelectedCurreny(e);
                      }}
                    />
                  </div>
                </div>
                <div className="d-flex align-items-end my-5">
                  <div className="me-2">
                    <span className="label mb-2">Swap Ratio</span>
                    <h5>1 {currency.label} =</h5>
                  </div>

                  <input
                    className="custom-input"
                    required
                    name="swapratio"
                    defaultValue=""
                    onChange={(e) => setSwapRatio(e.target.value)}
                    disabled={!isWeb3Connected}
                  />
                </div>
                <div className="d-flex justify-content-between">
                  <span className="label">Amount</span>
                  <span className="label">Balance --</span>
                </div>
                <div className="position-relative">
                  <input
                    className="custom-input p28"
                    required
                    name="amount"
                    type="number"
                    defaultValue={""}
                    disabled={!isWeb3Connected}
                    max={currentBalance}
                    onChange={(e) => setTokenAllocation(e.target.value)}
                  />
                  <MaxIcon
                    className="max-icon"
                    onClick={() => {
                      getMaxBalanceForToken();
                    }}
                  />
                  <Button
                    className="sub-btn mt-3"
                    disabled={tokenAddress === "" ? true : false}
                    onClick={() => {
                      approveTokenTransafer();
                    }}
                  >
                    Approve For Transfer
                  </Button>
                </div>

                <div className="d-flex align-items-end my-4">
                  <div className="me-2">
                    <span className="label mb-3">
                      Maximum Allocation per Wallet
                    </span>
                    <div className="d-flex">
                      <label className="me-5">
                        <input
                          className="me-2"
                          required
                          onClick={(e) => setlimitfield(false)}
                          name="mapw"
                          type="radio"
                          defaultValue="No limits"
                          disabled={!isWeb3Connected}
                        />
                        No limits
                      </label>
                      <label>
                        <input
                          className="me-2"
                          required
                          name="mapw"
                          type="radio"
                          onClick={(e) => setlimitfield(true)}
                          defaultValue="No limits"
                          disabled={!isWeb3Connected}
                        />
                        {currency.label}
                      </label>
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-end my-4 ${
                    limitfield ? "" : "d-none"
                  }`}
                >
                  <div className="wka me-2">
                    <span className="label">Allocation</span>
                    <input
                      className="custom-input"
                      required
                      name="allocation"
                      type="number"
                      onChange={(e) => setMaxAmountPerWallet(e.target.value)}
                      disabled={!isWeb3Connected}
                    />
                  </div>
                  <h5>{currency.label}</h5>
                </div>
                <div className="divder"></div>
                <div className="d-flex align-items-end my-4">
                  <div className="me-2">
                    <span className="label mb-3">Participant</span>
                    <div className="d-flex">
                      <label className="me-5">
                        <input
                          className="me-2"
                          required
                          onClick={(e) => console.log(e.target.value)}
                          name="participant"
                          type="checkbox"
                          defaultValue="No limits"
                          disabled={!isWeb3Connected}
                        />
                        Seed holders
                      </label>
                      <label className="me-5">
                        <input
                          className="me-2"
                          required
                          onChange={(e) => setPoolType(e.target.value)}
                          name="participant"
                          type="radio"
                          value="public"
                          disabled={!isWeb3Connected}
                        />
                        Public
                      </label>
                      <label>
                        <input
                          className="me-2"
                          required
                          onChange={(e) => {
                            setPoolType(e.target.value);
                            setpassfield(true);
                          }}
                          name="participant"
                          type="radio"
                          value="whitelist"
                          disabled={!isWeb3Connected}
                        />
                        Whitelist
                      </label>
                    </div>
                  </div>
                </div>
                <div
                  className={`d-flex align-items-end my-4 ${
                    passfield ? "" : "d-none"
                  }`}
                >
                  <div className="wka me-2">
                    <span className="label">List</span>
                    <div className="d-flex position-relative">
                      <input
                        className="custom-input"
                        type="text"
                        required
                        name="password"
                        onChange={(e) => {
                          setWhitelist(e.target.value);
                        }}
                        value={whitelist}
                        disabled={!isWeb3Connected}
                      />
                      <Button
                        className="addlistbtn"
                        onClick={() => {
                          setListData((oldArray) => [...oldArray, whitelist]);
                          setWhitelist("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="listdiv mt-3">
                      {listdata.map((e, index) => (
                        <div className="my-2 d-flex align-items-center justify-content-between position-relative">
                          <div>{e}</div>
                          <Button
                            className="addlistbtn"
                            onClick={() => deleteItemFromArrayAtIndex(index)}
                          >
                            X
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="divder"></div>
                <span className="label">Pool Name</span>
                <input
                  className="custom-input"
                  required
                  name="poolname"
                  defaultValue=""
                  onChange={(e) => setPoolName(e.target.value)}
                  disabled={!isWeb3Connected}
                />

                <span className="label my-4">Pool Start Time</span>
                <div>
                  <DateTimePicker onChange={setStartDate} value={startDate} />
                  {/* <Calendar onChange={setStartDate} value={startDate} /> */}
                </div>
                <span className="label my-4">Pool Ending Time</span>
                <div className="d-flex align-items-center justify-content-between">
                  <DateTimePicker onChange={setEndDate} value={endDate} />
                  {/* <Calendar onChange={setEndDate} value={endDate} /> */}
                </div>
                <span className="label my-4">Claim Funds At</span>
                <div className="d-flex align-items-center justify-content-between">
                  <DateTimePicker onChange={setClaimDate} value={claimDate} />
                  {/* <Calendar onChange={setClaimDate} value={claimDate} /> */}
                </div>
                <div className="d-flex align-items-center">
                  <span className="label my-4">Transaction Fee :</span>
                  <span className="label my-4 ms-2">{transactionFee}</span>
                </div>
                <Button
                  className="sub-btn"
                  onClick={() => {
                    makePool();
                  }}
                  disabled={!isTransferNotApproved}
                >
                  Launch
                </Button>
                <p
                  ref={dateErrorRef}
                  style={{
                    color: "red",
                    marginTop: "5px",
                    textAlign: "center",
                  }}
                ></p>
                <p
                  style={{
                    color: "red",
                    marginTop: "5px",
                    textAlign: "center",
                  }}
                >
                  warning: SeedHub does not support deflationary tokens
                </p>
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
