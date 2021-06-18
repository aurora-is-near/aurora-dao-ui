import React, {useEffect, useState} from 'react'
import Navbar from "./Navbar";
import Footer from "./Footer";
import useRouter from './utils/use-router'
import {useParams} from "react-router-dom";

import {
  MDBBox,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBCol,
  MDBContainer,
  MDBInput,
  MDBMask,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader,
  MDBNotification,
  MDBRow,
  MDBView
} from "mdbreact";
import {useGlobalMutation, useGlobalState} from './utils/container'
import {Decimal} from 'decimal.js';
import Selector from "./Selector";
import {
  convertDuration,
  proposalsReload,
  timestampToReadable,
  updatesJsonUrl,
  yoktoNear,
  parseForumUrl
} from './utils/funcs'
import getConfig from "./config";
import * as nearApi from "near-api-js";
import {Contract} from "near-api-js";
import {Proposal} from './ProposalPage';
import Loading from "./utils/Loading";
import * as url from "url";


const Dao = () => {
  const routerCtx = useRouter()
  const stateCtx = useGlobalState()
  const mutationCtx = useGlobalMutation()
  const [numberProposals, setNumberProposals] = useState(0);
  const [proposals, setProposals] = useState(null);
  const [council, setCouncil] = useState([]);
  const [bond, setBond] = useState(0);
  const [daoVotePeriod, setDaoVotePeriod] = useState(0);
  const [showError, setShowError] = useState(null);
  const [addProposalModal, setAddProposalModal] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  
  const [showAddMemberToRole, setShowAddMemberToRole] = useState(true);
  const [showChangeConfig, setShowChangeConfig] = useState(false);
  const [showRemoveMemberFromRole, setShowRemoveMemberFromRole] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  
  const [selectDao, setSelectDao] = useState(false);
  const [showNewProposalNotification, setShowNewProposalNotification] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [daoState, setDaoState] = useState(0);
  const [daoConfig, setDaoConfig] = useState({name:"", purpose: "", metadata: ""});
  const [availableAmount, setAvailableAmount] = useState(null);
  const [delegationTotalSupply, setDelegationTotalSupply] = useState(null);


  let {dao} = useParams();

  const [proposalTarget, setProposalTarget] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalDescription, setProposalDescription] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalMemberRole, setProposalMemberRole] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalMemberId, setProposalMemberId] = useState({
    value: "",
    valid: true,
    message: "",
  }); 
  
  const [proposalChangeConfigName, setProposalChangeConfigName] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalChangeConfigPurpose, setProposalChangeConfigPurpose] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalChangeConfigMetadata, setProposalChangeConfigMetadata] = useState({
    value: "",
    valid: true,
    message: "",
  });

  const [proposalRemoveMemberId, setProposalRemoveMemberId] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalRemoveMemberRole, setProposalRemoveMemberRole] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalTransferToken, setProposalTransferToken] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalTransferReceiver, setProposalTransferReceiver] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalTransferAmount, setProposalTransferAmount] = useState({
    value: "",
    valid: true,
    message: "",
  });
  const [proposalTransferMessage, setProposalTransferMessage] = useState({
    value: "",
    valid: true,
    message: "",
  });  


  useEffect(
    () => {
      if (stateCtx.config.contract === "") {
        if (dao !== undefined) {
          mutationCtx.updateConfig({
            contract: dao,
          })
        } else {
          setSelectDao(true);
        }
      } else {
        window.contract = new Contract(window.walletConnection.account(), stateCtx.config.contract, {
          viewMethods: ['get_available_amount', 'get_config', 'delegation_total_supply', 'get_policy', 'get_proposals'],
          changeMethods: ['add_proposal', 'act_proposal'],
        })
      }
    },
    [stateCtx.config.contract]
  )


  useEffect(
    () => {
      if (stateCtx.config.contract !== "" && dao !== stateCtx.config.contract && dao !== undefined) {
        mutationCtx.updateConfig({
          contract: "",
        });
        location.reload();
      }
    },
    [stateCtx.config.contract]
  )


  const toggleProposalModal = () => {
    setAddProposalModal(!addProposalModal);
  }

  const nearConfig = getConfig(process.env.NODE_ENV || 'development')
  const provider = new nearApi.providers.JsonRpcProvider(nearConfig.nodeUrl);
  const connection = new nearApi.Connection(nearConfig.nodeUrl, provider, {});

  async function accountExists(accountId) {
    try {
      await new nearApi.Account(connection, accountId).state();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async function getDaoState(dao) {
    try {
      const state = await new nearApi.Account(connection, dao).state();
      const amountYokto = new Decimal(state.amount);
      return amountYokto.div(yoktoNear).toFixed(2);
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  const submitProposal = async (e) => {
    e.preventDefault();
    e.persist();

    const nearAccountValid = window.walletConnection.getAccountId();
    let validateDescription = validateField("proposalDescription", proposalDescription.value);
    let validateProposalMemberRole = validateField("proposalMemberRole", proposalMemberRole.value);
    let validateProposalMemberId = validateField("proposalMemberId", proposalMemberId.value);

    let validateProposalChangeConfigName = validateField("proposalChangeConfigName", proposalChangeConfigName.value);
    let validateProposalChangeConfigPurpose = validateField("proposalChangeConfigPurpose", proposalChangeConfigPurpose.value);
    let validateProposalChangeConfigMetadata = validateField("proposalChangeConfigMetadata", proposalChangeConfigMetadata.value);

    let validateProposalRemoveMemberId = validateField("proposalRemoveMemberId", proposalRemoveMemberId.value);
    let validateProposalRemoveMemberRole = validateField("proposalRemoveMemberRole", proposalRemoveMemberRole.value);
    let validateProposalTransferToken = validateField("proposalTransferToken", proposalTransferToken.value);
    let validateProposalTransferReceiver = validateField("proposalTransferReceiver", proposalTransferReceiver.value);
    let validateProposalTransferAmount = validateNumber("proposalTransferAmount", proposalTransferAmount.value);
    let validateProposalTransferMessage = validateField("proposalChangeConfigMetadata", proposalTransferMessage.value);

    if (!validateDescription) {
      e.target.proposalDescription.className += " is-invalid";
      e.target.proposalDescription.classList.remove("is-valid");
    } else {
      e.target.proposalDescription.classList.remove("is-invalid");
      e.target.proposalDescription.className += " is-valid";
    }

    // 30 TGas
    const gas = new Decimal("30000000000000");
    const amountYokto = new Decimal("1");

    if (showAddMemberToRole) {
      if (!validateProposalMemberRole) {
        e.target.proposalMemberRole.className += " is-invalid";
        e.target.proposalMemberRole.classList.remove("is-valid");
      } else {
        e.target.proposalMemberRole.classList.remove("is-invalid");
        e.target.proposalMemberRole.className += " is-valid";
      }
      if (!validateProposalMemberId) {
        e.target.proposalMemberId.className += " is-invalid";
        e.target.proposalMemberId.classList.remove("is-valid");
      } else {
        e.target.proposalMemberId.classList.remove("is-invalid");
        e.target.proposalMemberId.className += " is-valid";
      }
    }

    if (showAddMemberToRole && !!nearAccountValid &&
        validateDescription && validateProposalMemberRole && validateProposalMemberId) {
      try {
        console.log("AddMemberToRole...")
        setShowSpinner(true);
        let args = {
          "proposal": {
            "description": proposalDescription.value.trim(),
            "kind": {
              "AddMemberToRole": {
                "member_id": proposalMemberId.value,
                "role": proposalMemberRole.value,
              },
            },
          }
        };
        await window.contract.add_proposal(args, gas.toString(), amountYokto.toString());
      } catch (e) {
        console.log(e);
        setShowError(e);
      } finally {
        setShowSpinner(false);
      }
    }

    if (showChangeConfig && !!nearAccountValid && validateDescription &&
        validateProposalChangeConfigName && validateProposalChangeConfigPurpose && validateProposalChangeConfigMetadata) {
      try {
        console.log("ChangeConfig...")
        setShowSpinner(true);
        let args = {
          "proposal": {
            "description": proposalDescription.value.trim(),
            "kind": {
              "ChangeConfig": {
                "config": {
                  "name": proposalChangeConfigName.value,
                  "purpose": proposalChangeConfigPurpose.value,
                  "metadata": proposalChangeConfigMetadata.value,
                },
              },
            },
          },
        };
        await window.contract.add_proposal(args, gas.toString(), amountYokto.toString());
      } catch (e) {
        console.log(e);
        setShowError(e);
      } finally {
        setShowSpinner(false);
      }
    }

    if (showRemoveMemberFromRole && !!nearAccountValid &&
        validateDescription && validateProposalRemoveMemberId && validateProposalRemoveMemberRole) {
      try {
        console.log("RemoveMemberFromRole...")
        setShowSpinner(true);
        let args = {
          "proposal": {
            "description": proposalDescription.value.trim(),
            "kind": {
              "RemoveMemberFromRole": {
                "member_id": proposalRemoveMemberId.value,
                "role": proposalRemoveMemberRole.value,
              },
            },
          }
        };
        await window.contract.add_proposal(args, gas.toString(), amountYokto.toString());
      } catch (e) {
        console.log(e);
        setShowError(e);
      } finally {
        setShowSpinner(false);
      }
    }

    if (showTransfer && !!nearAccountValid &&
        validateDescription && validateProposalTransferToken && validateProposalTransferReceiver && validateProposalTransferAmount && validateProposalTransferMessage) {
      try {
        console.log("Transfer...")
        setShowSpinner(true);
        let args = {
          "proposal": {
            "description": proposalDescription.value.trim(),
            "kind": {
              "Transfer": {
                "token_id": proposalTransferToken.value,
                "receiver_id": proposalTransferReceiver.value,
                "amount": new Decimal(proposalTransferAmount.value),
                "msg": proposalTransferMessage.value,
              },
            },
          }
        };
        await window.contract.add_proposal(args, gas.toString(), amountYokto.toString());
      } catch (e) {
        console.log(e);
        setShowError(e);
      } finally {
        setShowSpinner(false);
      }
    }

  }        

  const [firstRun, setFirstRun] = useState(true);


  const getProposals = () => {
    if (stateCtx.config.contract !== "") {
      let fromIndex = 0;
      window.contract.get_proposals({from_index: fromIndex, limit: 100})
        .then(list => {
          const t = []
          setNumberProposals(list.length);
          list.map((item, key) => {
            const t2 = {}
            Object.assign(t2, {key: fromIndex + key}, item);
            t.push(t2);
          })
          setProposals(t);
          setShowLoading(false);
        }).catch((e) => {
          console.log(e);
          setShowError(e);
          setShowLoading(false);
        })
    }
  }

  async function fetchUrl() {
    const sputnikDao = stateCtx.config.contract;
    const response = await fetch(updatesJsonUrl + Math.floor(Math.random() * 10000) + 1);
    const json = await response.json();
    return json[sputnikDao];
  }

  useEffect(() => {
    if (!firstRun) {
      const interval = setInterval(() => {
        fetchUrl().then((json) => {
          if (stateCtx.config.lastJsonData === 0 || stateCtx.config.lastJsonData !== json) {
            mutationCtx.updateConfig({
              lastJsonData: json !== undefined ? json : 0,
            })
          }
        }).catch((e) => {
          console.log(e);
        });
      }, proposalsReload);
    } else {
      setFirstRun(false);
      getProposals();
    }
  }, [stateCtx.config.contract, firstRun]);

  useEffect(
    () => {
      getProposals();
    },
    [stateCtx.config.contract, stateCtx.config.lastJsonData]
  )

  useEffect(
    () => {
      if (!firstRun) {
        const interval = setInterval(() => {
          console.log('loading proposals')
          getProposals();
        }, proposalsReload);
        return () => clearInterval(interval);
      } else {
        getProposals();
        setFirstRun(false);
      }
    },
    [stateCtx.config.contract, firstRun]
  )

  useEffect(
    () => {
      if (stateCtx.config.contract !== "") {
        getDaoState(stateCtx.config.contract).then(r => {
          setDaoState(r);
        }).catch((e) => {
          console.log(e);
          setShowError(e);
        })
      }
    },
    [stateCtx.config.contract]
  )

  useEffect(
    () => {
      if (stateCtx.config.contract !== "") {
        window.contract.delegation_total_supply()
          .then(r => {
            setDelegationTotalSupply(r);
          }).catch((e) => {
          console.log(e);
          setShowError(e);
        })
      }
    },
    [stateCtx.config.contract]
  )

  useEffect(
      () => {
        if (stateCtx.config.contract !== "") {
          window.contract.get_policy()
              .then((data) => {
                setBond(data.proposal_bond);
              }).catch((e) => {
            console.log(e);
            setShowError(e);
          })
        }
      },
      [stateCtx.config.contract]
  )
  
  useEffect(
      () => {
        if (stateCtx.config.contract !== "") {
          window.contract.get_policy()
              .then((data) => {
                setDaoVotePeriod(data.proposal_period);
              }).catch((e) => {
            console.log(e);
            setShowError(e);
          })
        }
      },
      [stateCtx.config.contract]
  )
  
  useEffect(
      () => {
        if (stateCtx.config.contract !== "") {
          window.contract.get_policy()
              .then((data) => {
                var roles = [];
                data.roles.map((item, _) => {
                  if (item.name === 'council') {
                    roles =item.kind.Group;
                  }
                });
                setCouncil(roles);
              }).catch((e) => {
            console.log(e);
            setShowError(e);
          })
        }
      },
      [stateCtx.config.contract]
  )

  useEffect(
      () => {
        if (stateCtx.config.contract !== "") {
          window.contract.get_config().then((data) => {
              setDaoConfig({
                name: data.name,
                purpose: data.purpose,
                metadata: Buffer.from(data.metadata, 'base64').toString()
              });
          }).catch((e) => {
            console.log(e);
            setShowError(e);
          })
        }
      }, 
      [stateCtx.config.contract]
  )
  
  useEffect(
      () => {
        if (stateCtx.config.contract !== "") {
          window.contract.get_available_amount()
              .then(r => {
                setAvailableAmount(r);
              }).catch((e) => {
            console.log(e);
            setShowError(e);
          })
        }
      },
      [stateCtx.config.contract]
  )

  const handleDaoChange = () => {
    mutationCtx.updateConfig({
      contract: '',
    })
    routerCtx.history.push('/')
  }

  const validateString = (field, name, showMessage) => {
    if (name && name.length >= 1) {
      return true;
    } else {
      return false;
    }
  }
  const validateLongString = (field, name, showMessage) => {
    if (name && name.length >= 3 && name.length <= 240) {
      return true;
    } else {
      return false;
    }
  }
  const validateNumber = (field, name, showMessage) => {
    if (name && !isNaN(name) && name.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  const validateField = (field, value) => {
    switch (field) {
      case "proposalDescription":
      case "proposalMemberRole":
      case "proposalMemberId":
      case "proposalChangeConfigName":
      case "proposalChangeConfigPurpose":
      case "proposalChangeConfigMetadata":
      case "proposalRemoveMemberId":
      case "proposalRemoveMemberRole":
      case "proposalTransferToken":
      case "proposalTransferReceiver":
      case "proposalTransferMessage":
        return validateString(field, value, showMessage.bind(this));
      case "amount":
        return validateNumber(field, value, showMessage.bind(this));
    }
  };

  const changeSelectHandler = (event) => {
/*
Roles Kinds:    
    ChangeConfig
    ChangePolicy
    AddMemberToRole
    RemoveMemberFromRole
    FunctionCall
    UpgradeSelf
    UpgradeRemote
    Transfer
    SetStakingContract
    AddBounty
    BountyDone 
    Vote
*/    
    console.log(event.target.value);
    if (event.target.value === "AddMemberToRole") {
      setShowAddMemberToRole(true);
      setShowChangeConfig(false);
      setShowRemoveMemberFromRole(false);
      setShowTransfer(false);
    }
    if (event.target.value === "ChangeConfig") {
      setShowAddMemberToRole(false);
      setShowChangeConfig(true);
      setShowRemoveMemberFromRole(false);
      setShowTransfer(false);
    }
    if (event.target.value === "RemoveMemberFromRole") {
      setShowAddMemberToRole(false);
      setShowChangeConfig(false);
      setShowRemoveMemberFromRole(true);
      setShowTransfer(false);
    }
    if (event.target.value === "Transfer") {
      setShowAddMemberToRole(false);
      setShowChangeConfig(false);
      setShowRemoveMemberFromRole(false);
      setShowTransfer(true);
    }
  };

  const changeHandler = (event) => {
    if (event.target.name === "proposalDescription") {
      setProposalDescription({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalDescription.message
      });
    }
    if (event.target.name === "proposalMemberRole") {
      setProposalMemberRole({
        value: event.target.value, 
        valid: !!event.target.value, 
        message: proposalMemberRole.message
      });
    }
    if (event.target.name === "proposalMemberId") {
      setProposalMemberId({
        value: event.target.value, 
        valid: !!event.target.value, 
        message: proposalMemberId.message
      });
    }

    if (event.target.name === "proposalChangeConfigName") {
      setProposalChangeConfigName({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalChangeConfigName.message
      });
    }
    if (event.target.name === "proposalChangeConfigPurpose") {
      setProposalChangeConfigPurpose({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalChangeConfigPurpose.message
      });
    }
    if (event.target.name === "proposalChangeConfigMetadata") {
      setProposalChangeConfigMetadata({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalChangeConfigMetadata.message
      });
    }

    if (event.target.name === "proposalRemoveMemberId") {
      setProposalRemoveMemberId({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalRemoveMemberId.message
      });
    }
    if (event.target.name === "proposalRemoveMemberRole") {
      setProposalRemoveMemberRole({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalRemoveMemberRole.message
      });
    }
    if (event.target.name === "proposalTransferToken") {
      setProposalTransferToken({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalTransferToken.message
      });
    }
    if (event.target.name === "proposalTransferReceiver") {
      setProposalTransferReceiver({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalTransferReceiver.message
      });
    }
    if (event.target.name === "proposalTransferAmount") {
      setProposalTransferAmount({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalTransferAmount.message
      });
    }
    if (event.target.name === "proposalTransferMessage") {
      setProposalTransferMessage({
        value: event.target.value,
        valid: !!event.target.value,
        message: proposalTransferMessage.message
      });
    }
  };

  const showMessage = (message, type, field) => {
    message = message.trim();
    if (message) {
        
    }
  };

  const [switchState, setSwitchState] = useState({
    switchAll: stateCtx.config.filter.switchAll,
    switchInProgress: stateCtx.config.filter.switchInProgress,
    switchDone: stateCtx.config.filter.switchDone,
    switchNew: stateCtx.config.filter.switchNew,
    switchExpired: stateCtx.config.filter.switchExpired,
  });

  const handleSwitchChange = switchName => () => {
    let switched = {}
    switch (switchName) {
      case 'switchAll':
        switched = {
          switchAll: !switchState.switchAll,
          switchInProgress: false,
          switchDone: false,
          switchNew: false,
          switchExpired: false,
        }
        break;

      case 'switchInProgress':
        switched = {
          switchAll: false,
          switchInProgress: !switchState.switchInProgress,
          switchDone: switchState.switchDone,
          switchNew: false,
          switchExpired: false,
        }
        break;

      case 'switchDone':
        switched = {
          switchAll: false,
          switchInProgress: switchState.switchInProgress,
          switchDone: !switchState.switchDone,
          switchNew: false,
          switchExpired: false,
        }
        break;

      case 'switchNew':
        switched = {
          switchAll: false,
          switchInProgress: false,
          switchDone: false,
          switchNew: !switchState.switchNew,
          switchExpired: false,
        }
        break;

      case 'switchExpired':
        switched = {
          switchAll: false,
          switchInProgress: false,
          switchDone: false,
          switchNew: false,
          switchExpired: !switchState.switchExpired,
        }
        break;

      default:
        switched = {
          switchAll: true,
          switchInProgress: false,
          switchDone: false,
          switchNew: false,
        }
        break;


    }
    setSwitchState(switched);
    mutationCtx.updateConfig({filter: switched})
  }

  const detectLink = (string) => {
    let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;

    if (!urlRegex.test(string)) {
      return false;
    } else {
      console.log(string.match(urlRegex))
      return string.match(urlRegex);
    }
  }


  return (
    <MDBView className="w-100 h-100" style={{minHeight: "100vh"}}>
      <MDBMask className="d-flex justify-content-center grey lighten-2 align-items-center gradient"/>
      <Navbar/>
      <MDBContainer style={{minHeight: "100vh"}} className="">
        {stateCtx.config.contract && !selectDao ?
          <>
            <MDBRow>
              <MDBCol className="col-12 p-3 mx-auto">
                <MDBCard>
                  <MDBCardBody>
                    <MDBRow>
                      <MDBCol>
                        <MDBCard className="p-0 m-2">
                          <MDBCardHeader className="h4-responsive">Council:</MDBCardHeader>
                          <MDBCardBody className="p-4">
                            {council ? council.map(item => (
                              <li>{item}</li>
                            )) : ''}
                          </MDBCardBody>
                        </MDBCard>
                      </MDBCol>
                      <MDBCol className="col-12 col-md-6">
                        <MDBCard className="p-0 m-2">
                          <MDBCardHeader className="h5-responsive">
                            <MDBRow>
                              <MDBCol>
                                Properties:
                              </MDBCol>
                              <MDBCol className="">
                                <MDBBox className="text-right">
                                  <MDBBtn size="sm" onClick={handleDaoChange} color="secondary">Change DAO</MDBBtn>
                                </MDBBox>
                              </MDBCol>
                            </MDBRow>
                          </MDBCardHeader>
                          <MDBCardBody className="p-2">


                            <ul>
                              <li>Network: <a target="_blank"
                                              href={stateCtx.config.network.explorerUrl}>{stateCtx.config.network.networkId}</a>
                              </li>
                              <li>DAO: {stateCtx.config.contract}</li>
                              <li>Purpose:{" "}
                                {
                                  daoConfig.purpose.split(" ").map((item, key) => (
                                    /(((https?:\/\/)|(www\.))[^\s]+)/g.test(item) ?
                                      <a target="_blank" href={item}>{item}{" "}</a> : <>{item}{" "}</>
                                  ))
                                }
                              </li>
                              <li>Metadata:{daoConfig.metadata}</li>
                              <li>Vote Period: {daoVotePeriod ? timestampToReadable(daoVotePeriod) : ''}</li>
                              <li>Proposal Bond: Ⓝ {bond !== null ? (new Decimal(bond.toString()).div(yoktoNear)).toFixed(2).toString() : ''}</li>
                              <li>Available amount: Ⓝ {availableAmount !== null ? (new Decimal(availableAmount.toString()).div(yoktoNear)).toFixed(2).toString() : ''}</li>
                              <li>Delegation total supply: Ⓝ {delegationTotalSupply !== null ? (new Decimal(delegationTotalSupply.toString()).div(yoktoNear)).toFixed(2).toString() : ''}</li>
                              <li>DAO Funds: Ⓝ {daoState ? daoState : ''}</li>
                            </ul>
                          </MDBCardBody>
                        </MDBCard>
                      </MDBCol>
                    </MDBRow>
                    {window.walletConnection.getAccountId() ?
                      <MDBRow className="mx-auto p-2">
                        <MDBCol className="text-center">
                          <MDBBtn style={{borderRadius: 10}} size="sm" onClick={toggleProposalModal} color="unique">ADD
                            NEW PROPOSAL</MDBBtn>
                        </MDBCol>
                      </MDBRow>
                      : null}
                  </MDBCardBody>
                </MDBCard>
              </MDBCol>
            </MDBRow>

            <MDBRow>
              <MDBCol className="col-12 p-3 mx-auto">
                <MDBCard>
                  <MDBCardBody>
                    <MDBRow center>
                      <MDBCard className="p-2 mr-2 mb-2 green lighten-5">
                        <div className='custom-control custom-switch mr-2'>
                          <input
                            type='checkbox'
                            className='custom-control-input'
                            id='switchAll'
                            checked={switchState.switchAll}
                            onChange={handleSwitchChange('switchAll')}
                            readOnly
                          />
                          <label className='custom-control-label' htmlFor='switchAll'>
                            Show All
                          </label>
                        </div>
                      </MDBCard>
                      <MDBCard className="p-2 mr-2 mb-2">
                        <div className='custom-control custom-switch mr-2'>
                          <input
                            type='checkbox'
                            className='custom-control-input'
                            id='switchInProgress'
                            checked={switchState.switchInProgress}
                            onChange={handleSwitchChange('switchInProgress')}
                            readOnly
                          />
                          <label className='custom-control-label' htmlFor='switchInProgress'>
                            In Progress
                          </label>
                        </div>
                      </MDBCard>
                      <MDBCard className="p-2 mr-2 mb-2">
                        <div className='custom-control custom-switch mr-2'>
                          <input
                            type='checkbox'
                            className='custom-control-input'
                            id='switchDone'
                            checked={switchState.switchDone}
                            onChange={handleSwitchChange('switchDone')}
                            readOnly
                          />
                          <label className='custom-control-label' htmlFor='switchDone'>
                            Done
                          </label>
                        </div>
                      </MDBCard>
                      {/*
                      <MDBCard className="p-2 mb-2 mr-2">
                        <div className='custom-control custom-switch mr-2'>
                          <input
                            type='checkbox'
                            className='custom-control-input'
                            id='switchNew'
                            checked={switchState.switchNew}
                            onChange={handleSwitchChange('switchNew')}
                            readOnly
                          />
                          <label className='custom-control-label' htmlFor='switchNew'>
                            New
                          </label>
                        </div>
                      </MDBCard>
                      */}
                      <MDBCard className="p-2 mb-2">
                        <div className='custom-control custom-switch mr-2'>
                          <input
                            type='checkbox'
                            className='custom-control-input'
                            id='switchExpired'
                            checked={switchState.switchExpired}
                            onChange={handleSwitchChange('switchExpired')}
                            readOnly
                          />
                          <label className='custom-control-label' htmlFor='switchExpired'>
                            Expired
                          </label>
                        </div>
                      </MDBCard>

                    </MDBRow>
                  </MDBCardBody>
                </MDBCard>
              </MDBCol>
            </MDBRow>

            <MDBRow className="">
              {numberProposals > 0 && proposals !== null ?
                proposals.sort((a, b) => b.key >= a.key ? 1 : -1).map((item, key) => (
                  <>
                    {
                        <Proposal dao={stateCtx.config.contract} data={item} key={key} id={item.key} council={council}
                                  setShowError={setShowError}/>
                    }
                  </>
                ))
                : null
              }
            </MDBRow>
            {showError !== null ?
              <MDBNotification
                autohide={36000}
                bodyClassName="p-5 font-weight-bold white-text"
                className="stylish-color-dark"
                closeClassName="white-text"
                fade
                icon="bell"
                iconClassName="orange-text"
                message={showError.toString().trim()}
                show
                text=""
                title=""
                titleClassName="elegant-color-dark white-text"
                style={{
                  position: "fixed",
                  top: "60px",
                  right: "10px",
                  zIndex: 9999
                }}
              />
              : null
            }

            {showNewProposalNotification ?
              <MDBNotification
                autohide={36000}
                bodyClassName="p-5 font-weight-bold white-text"
                className="stylish-color-dark"
                closeClassName="white-text"
                fade
                icon="bell"
                iconClassName="orange-text"
                message="A new proposal has been added!"
                show
                text=""
                title=""
                titleClassName="elegant-color-dark white-text"
                style={{
                  position: "fixed",
                  top: "60px",
                  left: "10px",
                  zIndex: 9999
                }}
              />
              : null
            }

            <MDBModal isOpen={addProposalModal} toggle={toggleProposalModal} centered position="center" size="lg">
              <MDBModalHeader className="text-center" titleClass="w-100 font-weight-bold" toggle={toggleProposalModal}>
                Add New Proposal
              </MDBModalHeader>
              <form className="needs-validation mx-3 grey-text"
                    name="proposal"
                    noValidate
                    method="post"
                    onSubmit={submitProposal}
              >
                <MDBModalBody>
                  <div className="pl-3 pr-3 mb-2">
                    <select onChange={changeSelectHandler} name="proposalKind" required
                            className="browser-default custom-select">
                      {/*<option value="false">Choose proposal type</option>*/}
                      <option value="AddMemberToRole">Add Member To Role</option>
                      <option value="ChangeConfig">Change Config</option>
                      <option value="RemoveMemberFromRole">Remove Member From Role</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>
                  <MDBInput name="proposalDescription" value={proposalDescription.value} onChange={changeHandler}
                            required label="Proposal description (max 240 chars)" group>
                    <div className="invalid-feedback">
                      {proposalDescription.message}
                    </div>
                  </MDBInput>
                  {showAddMemberToRole ?
                      <>
                      <MDBInput value={proposalMemberId.value} name="proposalMemberId" onChange={changeHandler} required
                                label="Member ID" group>
                        <div className="invalid-feedback">
                          {proposalMemberId.message}
                        </div>
                      </MDBInput>
                      <MDBInput value={proposalMemberRole.value} name="proposalMemberRole" onChange={changeHandler} required
                                label="Member role" group>
                        <div className="invalid-feedback">
                          {proposalMemberRole.message}
                        </div>
                      </MDBInput>
                      </>
                    : null}
                  {showChangeConfig ?
                      <>
                        <>
                          <MDBInput value={proposalChangeConfigName.value} name="proposalChangeConfigName" onChange={changeHandler} required
                                    label="Name" group>
                            <div className="invalid-feedback">
                              {proposalChangeConfigName.message}
                            </div>
                          </MDBInput>
                          <MDBInput value={proposalChangeConfigPurpose.value} name="proposalChangeConfigPurpose" onChange={changeHandler} required
                                    label="Purpose" group>
                            <div className="invalid-feedback">
                              {proposalChangeConfigPurpose.message}
                            </div>
                          </MDBInput>
                          <MDBInput value={proposalChangeConfigMetadata.value} name="proposalChangeConfigMetadata" onChange={changeHandler} required
                                    label="Metadata" group>
                            <div className="invalid-feedback">
                              {proposalChangeConfigMetadata.message}
                            </div>
                          </MDBInput>
                        </>
                      </>
                      : null}
                  {showRemoveMemberFromRole ?
                      <>
                        <MDBInput value={proposalRemoveMemberId.value} name="proposalRemoveMemberId" onChange={changeHandler} required
                                  label="Member ID" group>
                          <div className="invalid-feedback">
                            {proposalRemoveMemberId.message}
                          </div>
                        </MDBInput>
                        <MDBInput value={proposalRemoveMemberRole.value} name="proposalRemoveMemberRole" onChange={changeHandler} required
                                  label="Member role" group>
                          <div className="invalid-feedback">
                            {proposalRemoveMemberRole.message}
                          </div>
                        </MDBInput>
                      </>
                      : null}
                  {showTransfer ?
                      <>
                        <MDBInput value={proposalTransferToken.value} name="proposalTransferToken" onChange={changeHandler} required
                                  label="Token ID" group>
                          <div className="invalid-feedback">
                            {proposalTransferToken.message}
                          </div>
                        </MDBInput>
                        <MDBInput value={proposalTransferReceiver.value} name="proposalTransferReceiver" onChange={changeHandler} required
                                  label="Receiver ID" group>
                          <div className="invalid-feedback">
                            {proposalTransferReceiver.message}
                          </div>
                        </MDBInput>
                        <MDBInput value={proposalTransferAmount.value} name="proposalTransferAmount" onChange={changeHandler} required
                                  label="Amount" group>
                          <div className="invalid-feedback">
                            {proposalTransferAmount.message}
                          </div>
                        </MDBInput>
                        <MDBInput value={proposalTransferMessage.value} name="proposalTransferMessage" onChange={changeHandler} required
                                  label="Message" group>
                          <div className="invalid-feedback">
                            {proposalTransferMessage.message}
                          </div>
                        </MDBInput>
                      </>
                      : null}
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
          </>
          : null}
        {selectDao ?
          <Selector setShowError={setShowError} setSelectDao={setSelectDao}/>
          : null
        }
      </MDBContainer>
      <Footer/>
    </MDBView>
  )
}

export default Dao;
