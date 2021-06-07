import React, {useEffect, useState} from 'react'
import {Contract} from "near-api-js";

import {
  MDBBadge,
  MDBBox,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBIcon,
  MDBInput,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader,
  MDBCol, MDBContainer, MDBRow,
} from "mdbreact";
import {useGlobalMutation, useGlobalState} from './utils/container'
import useRouter from "./utils/use-router";
import {Decimal} from "decimal.js";
import {timestampToReadable, yoktoNear} from './utils/funcs'
import Loading from "./utils/Loading";
import * as nearApi from "near-api-js";
import getConfig from "./config";


const NewDao = (props) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNewDao, setShowNewDao] = useState(true);


  const [daoName, setDaoName] = useState({
    value: "",
    valid: true,
    message: "",
  });

  const [purpose, setPurpose] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [amount, setAmount] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [council, setCouncil] = useState({
    value: "",
    valid: true,
    message: "",
  });

  const [bond, setBond] = useState({
    value: "",
    valid: true,
    message: "",
  });

  const [votePeriod, setVotePeriod] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [gracePeriod, setGracePeriod] = useState({
    value: "",
    valid: true,
    message: "",
  });

  const toggleNewDaoModal = () => {
    setShowNewDao(!showNewDao);
  }


  const submitNewDao = async (e) => {
    e.preventDefault();
    e.persist();

    let validatePurpose = validateField("purpose", purpose.value);
    let validateDaoName = validateField("daoName", daoName.value);
    let validateAmount = validateField("amount", amount.value);
    let validateCouncil = validateField("council", council.value);
    let validateBond = validateField("bond", bond.value);
    let validateVotePeriod = validateField("votePeriod", votePeriod.value);
    let validateGracePeriod = validateField("gracePeriod", gracePeriod.value);


    if (!validateDaoName) {
      e.target.daoName.className += " is-invalid";
      e.target.daoName.classList.remove("is-valid");
    } else {
      e.target.daoName.classList.remove("is-invalid");
      e.target.daoName.className += " is-valid";
    }

    if (!validatePurpose) {
      e.target.purpose.className += " is-invalid";
      e.target.purpose.classList.remove("is-valid");
    } else {
      e.target.purpose.classList.remove("is-invalid");
      e.target.purpose.className += " is-valid";
    }

    if (!validateAmount) {
      e.target.amount.className += " is-invalid";
      e.target.amount.classList.remove("is-valid");
    } else {
      e.target.amount.classList.remove("is-invalid");
      e.target.amount.className += " is-valid";
    }

    if (!validateBond) {
      e.target.bond.className += " is-invalid";
      e.target.bond.classList.remove("is-valid");
    } else {
      e.target.bond.classList.remove("is-invalid");
      e.target.bond.className += " is-valid";
    }

    if (!validateVotePeriod) {
      e.target.votePeriod.className += " is-invalid";
      e.target.votePeriod.classList.remove("is-valid");
    } else {
      e.target.votePeriod.classList.remove("is-invalid");
      e.target.votePeriod.className += " is-valid";
    }

    if (!validateGracePeriod) {
      e.target.gracePeriod.className += " is-invalid";
      e.target.gracePeriod.classList.remove("is-valid");
    } else {
      e.target.gracePeriod.classList.remove("is-invalid");
      e.target.gracePeriod.className += " is-valid";
    }


    if (validatePurpose && validateAmount && validateBond && validateGracePeriod && validateVotePeriod) {

      const argsList = {
        "purpose": purpose.value,
        "council": council.value.split('\n'),
        "bond": new Decimal(bond.value).mul(yoktoNear).toFixed(),
        "vote_period": new Decimal(votePeriod.value).mul('3.6e12').toFixed(),
        "grace_period": new Decimal(gracePeriod.value).mul('3.6e12').toFixed()
      }


      try {
        setShowSpinner(true);
        const a = new Decimal(amount.value);
        const amountYokto = a.mul(yoktoNear).toFixed();
        const args = Buffer.from(JSON.stringify(argsList)).toString('base64')


        await window.factoryContract.create({
            "name": daoName.value,
            "args": args,
          },
          new Decimal("45000000000000").toString(), amountYokto.toString(),
        )
      } catch (e) {
        console.log(e);
        props.setShowError(e);
      } finally {
        setShowSpinner(false);
      }


    }


  }

  const validateCouncil = (field, name, showMessage) => {
    if (name && name.indexOf(',') === -1) {
      return true;
    } else {
      showMessage("Please enter correct list of accounts", 'warning', field);
      return false;
    }
  }

  const validatePurpose = (field, name, showMessage) => {
    if (name && name.length >= 10 && name.length <= 280) {
      return true;
    } else {
      showMessage("Please enter between 10 and 280 chars", 'warning', field);
      return false;
    }
  }

  const validateName = (field, name, showMessage) => {
    const allowedChars = /^(?=[0-9a-zA-Z])(?=.*[0-9a-zA-Z]$)(?!.*__.*)(?!.*--.*)[0-9a-zA-Z_\-]*$/;
    if (name && name.length >= 2 && name.length <=35 && allowedChars.test(name)) {
      return true;
    } else {
      showMessage("Please enter between 2 and 35 chars, lowercase characters (a-z), digits (0-9),(_-) can be used as separators ", 'warning', field);
      return false;
    }
  }

  const validateAmount = (field, name, showMessage) => {
    if (name && !isNaN(name) && name >= 3.5) {
      return true;
    } else {
      showMessage("Minimum amount is 3.5 NEAR", 'warning', field);
      return false;
    }
  }

  const validateNumber = (field, name, showMessage) => {
    if (name && !isNaN(name) && name.length > 0) {
      return true;
    } else {
      showMessage("Please enter a valid number", 'warning', field);
      return false;
    }
  }

  const showMessage = (message, type, field) => {
    message = message.trim();
    if (message) {
      switch (field) {
        case "purpose":
          setPurpose({message: message});
          break;
        case "daoName":
          setDaoName({message: message});
          break;
        case "amount":
          setAmount({message: message});
          break;
        case "council":
          setCouncil({message: message});
          break;
        case "bond":
          setBond({message: message});
          break;
        case "votePeriod":
          setVotePeriod({message: message});
          break;
        case "gracePeriod":
          setGracePeriod({message: message});
          break;

      }
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case "daoName":
        return validateName(field, value, showMessage.bind(this));
      case "council":
        return validateCouncil(field, value, showMessage.bind(this));
      case "purpose":
        return validatePurpose(field, value, showMessage.bind(this));
      case "amount":
        return validateAmount(field, value, showMessage.bind(this));
      case "bond":
      case "votePeriod":
      case "gracePeriod":
        return validateNumber(field, value, showMessage.bind(this));
    }
  };


  const changeHandler = (event) => {
    if (event.target.name === "daoName") {
      setDaoName({value: event.target.value.toLocaleLowerCase(), valid: !!event.target.value});
    }
    if (event.target.name === "purpose") {
      setPurpose({value: event.target.value, valid: !!event.target.value});
    }
    if (event.target.name === "amount") {
      setAmount({value: event.target.value, valid: !!event.target.value});
    }
    if (event.target.name === "council") {
      setCouncil({value: event.target.value.toLowerCase(), valid: !!event.target.value});
    }
    if (event.target.name === "bond") {
      setBond({value: event.target.value, valid: !!event.target.value});
    }
    if (event.target.name === "votePeriod") {
      setVotePeriod({value: event.target.value, valid: !!event.target.value});
    }
    if (event.target.name === "gracePeriod") {
      setGracePeriod({value: event.target.value, valid: !!event.target.value});
    }

    if (event.target.name !== "council") {
      if (!validateField(event.target.name, event.target.value)) {
        event.target.className = "form-control is-invalid";
      } else {
        event.target.className = "form-control is-valid";
      }
    } else {
      if (!validateField(event.target.name, event.target.value)) {
        event.target.className = "form-control is-invalid";
      } else {
        event.target.className = "form-control";
      }
    }
  };


  return (

    <MDBModal isOpen={showNewDao} toggle={() => {
    }} centered position="center" size="lg">
      <MDBModalHeader className="text-center" titleClass="w-100 font-weight-bold" toggle={toggleNewDaoModal}>
        Add New DAO
      </MDBModalHeader>
      <form className="needs-validation mx-3 grey-text"
            name="newDao"
            noValidate
            method="post"
            onSubmit={submitNewDao}
      >
        <MDBModalBody>

          <MDBInput name="daoName" value={daoName.value}
                    onChange={changeHandler} label="Enter DAO Name (will be prefix of .sputnikdao.near)"
                    required group>
            <div className="invalid-feedback">
              {daoName.message}
            </div>
          </MDBInput>
          <MDBInput name="purpose" value={purpose.value}
                    onChange={changeHandler} label="Enter Purpose"
                    required group>
            <div className="invalid-feedback">
              {purpose.message}
            </div>
          </MDBInput>

          <MDBInput name="council" value={council.value}
                    onChange={changeHandler} label="Enter Council (one account per line)"
                    required group type="textarea">
            <div className="invalid-feedback">
              {council.message}
            </div>
          </MDBInput>

          <MDBInput name="bond" value={bond.value}
                    onChange={changeHandler} label="Enter Bond in NEAR"
                    required group>
            <div className="invalid-feedback">
              {bond.message}
            </div>
          </MDBInput>

          <MDBInput name="votePeriod" value={votePeriod.value}
                    onChange={changeHandler} label="Enter Vote Period in hours"
                    required group>
            <div className="invalid-feedback">
              {votePeriod.message}
            </div>
          </MDBInput>

          <MDBInput name="gracePeriod" value={gracePeriod.value}
                    onChange={changeHandler} label="Enter Grace Period in hours"
                    required group>
            <div className="invalid-feedback">
              {gracePeriod.message}
            </div>
          </MDBInput>

          <MDBInput
            value={amount.value}
            onChange={changeHandler} label="Amount to transfer to the DAO (minimum 3.5 NEAR for storage)"
            name="amount" group>
            <div className="invalid-feedback">
              {amount.message}
            </div>
          </MDBInput>
        </MDBModalBody>
        <MDBModalFooter className="justify-content-center">
          <MDBBtn color="unique" type="submit">
            Submit
            {showSpinner ?
              <div className="spinner-border spinner-border-sm ml-2" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              : null}
          </MDBBtn>
        </MDBModalFooter>
      </form>
    </MDBModal>


  )


}


async function getDaoState(dao) {
  const nearConfig = getConfig(process.env.NODE_ENV || 'development')
  const provider = new nearApi.providers.JsonRpcProvider(nearConfig.nodeUrl);
  const connection = new nearApi.Connection(nearConfig.nodeUrl, provider, {});
  try {
    const state = await new nearApi.Account(connection, dao).state();
    const amountYokto = new Decimal(state.amount);
    return amountYokto.div(yoktoNear).toFixed(2);
  } catch (error) {
    console.log(error);
    return 0;
  }
}

const DaoInfo = (props) => {
  const contractId = props.item;
  const [council, setCouncil] = useState([]);
  const [bond, setBond] = useState(null);
  const [votePeriod, setVotePeriod] = useState(null);
  const [gracePeriod, setGracePeriod] = useState(null);
  const [purpose, setPurpose] = useState(null);
  const [collapseState, setCollapseState] = useState(false);
  const [daoState, setDaoState] = useState(0);


  const contract = new Contract(window.walletConnection.account(), contractId, {
    viewMethods: ['get_council', 'get_bond', 'get_num_proposals', 'get_purpose', 'get_vote_period'],
    changeMethods: [],
  })


  useEffect(
    () => {
      if (contractId !== "") {
        getDaoState(contractId).then(r => {
          setDaoState(r);
        }).catch((e) => {
          console.log(e);
        })
      }
    },
    []
  )

  useEffect(
    () => {
      contract.get_bond().then((data) => {
        setBond(data);
      });
    }, [])


  useEffect(
    () => {
      contract.get_vote_period().then((data) => {
        setVotePeriod(data);
      });
    }, [])

  useEffect(
    () => {
      contract.get_purpose().then((data) => {
        setPurpose(data);
      });
    }, [])


  const toggleCollapse = () => {
    contract.get_council().then((data) => {
      setCouncil(data);
    });
    setCollapseState(!collapseState);
  }

  return (
    <>
      <div className="text-left">
        <h6 className="" color="light">purpose: {purpose}</h6>
        <div className="float-left">
          <MDBBadge className="mr-2 p-2" color="primary" pill>Bond:
            Ⓝ {bond !== null ? (new Decimal(bond.toString()).div(yoktoNear)).toString() : ''}</MDBBadge>
          <MDBBadge className="m-2 p-2" color="primary" pill>Vote
            Period: {votePeriod ? timestampToReadable(votePeriod) : ''}</MDBBadge>
          {gracePeriod ? '<MDBBadge className="m-2 p-2" color="primary" pill>Grace Period: {gracePeriod ? timestampToReadable(gracePeriod) : null}</MDBBadge>' : null}
          <MDBBadge className="m-2 p-2" color="info" pill>DAO Funds: <b>Ⓝ {daoState}</b></MDBBadge>
        </div>
        <div className="float-right">
          <MDBBtn
            outline
            color="primary"
            size="sm"
            onClick={toggleCollapse}
          >
            view council{" "}
            <MDBIcon icon={!collapseState ? "arrow-down" : "arrow-up"}/>
          </MDBBtn>
        </div>
        <div className="clearfix"/>
      </div>
      {collapseState ?
        <div>
          <hr/>
          <MDBCol>
            {council.map((item, key) => <div className="text-right" key={key}>{item}</div>)}
          </MDBCol>
        </div>
        : null}
    </>
  );
}

const Selector = (props) => {
  const routerCtx = useRouter()
  const stateCtx = useGlobalState()
  const mutationCtx = useGlobalMutation()
  const [daoList, setDaoList] = useState([]);
  const [showNewDaoModal, setShowNewDaoModal] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(
    () => {
      window.factoryContract.get_dao_list()
        .then(r => {
          setDaoList(r);
          setShowLoading(false);
        }).catch((e) => {
        setShowLoading(false);
        console.log(e);
        mutationCtx.toastError(e);
      })
    },
    []
  )

  const handleSelect = async (e) => {
    e.preventDefault();
    mutationCtx.updateConfig({
      contract: e.target.name,
      bond: '',
      purpose: '',
      votePeriod: '',
      lastShownProposal: 0,
      lastJsonData: 0,
    });
    props.setSelectDao(false);
    routerCtx.history.push('/' + e.target.name);
    window.location.reload();
    return false;
  }

  const toggleNewDao = () => {
    setShowNewDaoModal(!showNewDaoModal);
  }


  return (
    <div>
      <MDBCard className="p-md-3 m-md-3">
        <MDBCardHeader className="text-center" titleClass="w-100" tag="p">
          Please select DAO
          <hr/>
          <MDBBtn color="red" onClick={toggleNewDao}
                  className="">CREATE NEW DAO</MDBBtn>
          <MDBBox className="text-muted text-center">Attention! Required minimum 3.5 NEAR for the storage.</MDBBox>
        </MDBCardHeader>
        {showLoading ? <Loading/> : null}
        <MDBCardBody className="text-center">
          {daoList ? daoList.map((item, key) => (
            <MDBCard className="m-2" key={key}>
              <MDBCardHeader color="white-text unique-color" className="h5-responsive">{item}</MDBCardHeader>
              <MDBCardBody>
                <DaoInfo item={item}/>
                <hr/>
                <MDBBtn name={item} onClick={handleSelect} color="secondary" size="sm"
                        className="float-right">SELECT</MDBBtn>
              </MDBCardBody>
            </MDBCard>
          )) : null}
        </MDBCardBody>
      </MDBCard>
      {showNewDaoModal ?
        <NewDao setShowError={props.setShowError} toggleNewDao={toggleNewDao}/>
        : null}
    </div>

  )
}

export default Selector;
