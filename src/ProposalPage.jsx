import React, {useEffect, useState} from 'react'
import {Contract} from "near-api-js";

import {
  MDBBadge,
  MDBBox,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardHeader, MDBCardText, MDBCol,
  MDBContainer, MDBIcon, MDBLink, MDBMask,
  MDBModal,
  MDBModalBody,
  MDBModalFooter,
  MDBModalHeader, MDBPopover, MDBPopoverBody, MDBRow, MDBTooltip, MDBView
} from "mdbreact";
import {useGlobalState} from './utils/container'
import {convertDuration, timestampToReadable, yoktoNear} from './utils/funcs'
import Navbar from "./Navbar";
import Footer from "./Footer";
import {useParams} from "react-router-dom";

export const Proposal = (props) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const stateCtx = useGlobalState();
  const [votedWarning, setVotedWarning] = useState(false);

  const vote = async (vote) => {
    try {
      setShowSpinner(true);
      await window.contract.vote({
        id: props.id,
        vote: vote,
      })
    } catch (e) {
      console.log(e);
      props.setShowError(e);
    } finally {
      setShowSpinner(false);
    }
  }

  const finalize = async () => {
    try {
      setShowSpinner(true);
      await window.contract.finalize({
        id: props.id,
      })
    } catch (e) {
      console.log(e);
      props.setShowError(e);
    } finally {
      setShowSpinner(false);
    }
  }

  const handleVoteYes = () => {

    if (props.data.votes[window.walletConnection.getAccountId()] === undefined) {
      vote('Yes').then().catch((e) => {
        console.log(e);
      });
    } else {
      setVotedWarning(true);
    }
  }

  const handleVoteNo = () => {
    if (props.data.votes[window.walletConnection.getAccountId()] === undefined) {
      vote('No').then().catch((e) => {
        console.log(e);
      });
    } else {
      setVotedWarning(true);
    }
  }

  const handleFinalize = () => {
    finalize().then().catch((e) => {
      console.log(e);
    });
  }

  const toggleVoteWarningOff = () => {
    setVotedWarning(false);
  }


  return (
    <MDBCol className="col-12 col-sm-8 col-lg-6 mx-auto">

      <MDBModal modalStyle="danger" centered size="sm" isOpen={votedWarning} toggle={toggleVoteWarningOff}>
        <MDBModalHeader>Warning!</MDBModalHeader>
        <MDBModalBody className="text-center">
          You are already voted
        </MDBModalBody>
        <MDBModalFooter>
          <MDBBtn className="w-100" color="info" onClick={toggleVoteWarningOff}>Close</MDBBtn>
        </MDBModalFooter>
      </MDBModal>

      <MDBCard className="mb-5">
        <MDBCardHeader className="text-center h4-responsive">
          {props.data.kind.type === 'ChangePurpose' ? "Change DAO Purpose: " + props.data.kind.purpose : null}
          {props.data.kind.type === 'NewCouncil' ? "New Council Member: " + props.data.target : null}
          {props.data.kind.type === 'RemoveCouncil' ? "Remove Council Member: " + props.data.target : null}
          {props.data.kind.type === 'ChangeVotePeriod' ? "Change Vote Period: " + `${props.data.kind.vote_period / 1e9 / 60 / 60 ^ 0}h ` + (props.data.kind.vote_period / 1e9 / 60 % 60).toFixed(0) + 'm' : null}

          {props.data.kind.type === "Payout" ?
            <div>
              <div className="float-left">
                Payout:
              </div>
              <div className="float-right font-weight-bold" style={{fontSize: 25}}>
                <span style={{fontSize: 22, marginRight: 2}}>Ⓝ</span>
                {(props.data.kind.amount / yoktoNear).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </div>
            </div>
            : null}
          <div className="clearfix"/>

        </MDBCardHeader>
        <MDBCardBody>
          <div className="float-left">
            {(convertDuration(props.data.vote_period_end) < new Date() && props.data.status === 'Vote') ?
              <h4><MDBBadge color="danger">Expired</MDBBadge></h4>
              :
              <>
                {props.data.status === 'Fail' ?
                  <h4><MDBBadge color="danger">{props.data.status}</MDBBadge></h4>
                  :
                  null
                }
                {props.data.status === 'Success' ?
                  <h4><MDBBadge color="green">Passed / {props.data.status}</MDBBadge>{" "}<MDBIcon
                    className="amber-text"
                    icon="crown"/></h4>
                  :
                  null
                }
                {props.data.status === 'Vote' ?
                  <h4><MDBBadge color="green">Active / {props.data.status}</MDBBadge></h4>
                  :
                  null
                }
                {props.data.status === 'Reject' ?
                  <h4><MDBBadge color="danger">Passed / {props.data.status}</MDBBadge></h4>
                  :
                  null
                }
              </>
            }
          </div>
          <div className="float-right h4-responsive"><a href={"#/" + props.dao + "/" + props.id}
                                                        target="_blank"><MDBIcon icon="link"/></a> #{props.id}</div>
          <div className="clearfix"/>
          <MDBCardText>
            <MDBBox
              className="h4-responsive black-text">{props.data.description.split('/t/')[0]}</MDBBox>
            {props.data.description.split('/t/')[1] ?
              <a target="_blank"
                 href={"https://gov.near.org/t/" + props.data.description.split('/t/')[1]}
                 rel="nofollow">{"https://gov.near.org/t/" + props.data.description.split('/t/')[1]}</a>
              : null}
            <hr/>
            <div className="float-left text-muted h4-responsive">proposer</div>
            <MDBBox className="float-right h4-responsive" style={{width: '80%'}}>
              <a className="text-right float-right" target="_blank" style={{wordBreak: "break-word"}}
                 href={stateCtx.config.network.explorerUrl + "/accounts/" + props.data.proposer.toLowerCase()}>{props.data.proposer.toLowerCase()}</a>
            </MDBBox>
            <br/>
            <div className="clearfix"/>
            <div className="float-left text-muted h4-responsive">target</div>
            <MDBBox className="float-right h4-responsive" style={{width: '80%'}}>
              <a className="text-right float-right" target="_blank" style={{wordBreak: "break-word"}}
                 href={stateCtx.config.network.explorerUrl + "/accounts/" + props.data.target.toLowerCase()}>{props.data.target.toLowerCase()}</a>
            </MDBBox>
            <div className="clearfix"/>
          </MDBCardText>

          {props.council.includes(window.walletConnection.getAccountId()) ?
            <MDBTooltip
              tag="span"
              placement="top"
            >
              <MDBBtn
                style={{borderRadius: 50}}
                disabled={showSpinner || convertDuration(props.data.vote_period_end) < new Date() || props.data.status !== 'Vote'}
                onClick={handleVoteYes}
                floating
                color="green darken-1"
                className='h5-responsive'
                size="sm">
                <MDBIcon icon='thumbs-up' size="2x" className='white-text m-2 p-2'/>
              </MDBBtn>
              <span>Vote YES</span>
            </MDBTooltip>
            : null}

          {(window.walletConnection.getAccountId() && convertDuration(props.data.vote_period_end) < new Date() && props.data.status === 'Vote') ?
            <MDBTooltip
              tag="span"
              placement="top"
            >
              <MDBBtn
                style={{borderRadius: 50}}
                disabled={showSpinner}
                onClick={handleFinalize}
                color="info"
                floating
                className='h5-responsive float-right'
                size="sm">
                <MDBIcon icon="check-circle" size="2x" className='white-text m-2 p-2'/>
              </MDBBtn>
              <span>Finalise</span>
            </MDBTooltip>
            : null}

          {props.council.includes(window.walletConnection.getAccountId()) ?
            <MDBTooltip
              tag="span"
              placement="top"
            >
              <MDBBtn
                style={{borderRadius: 50}}
                disabled={showSpinner || convertDuration(props.data.vote_period_end) < new Date() || props.data.status !== 'Vote'}
                onClick={handleVoteNo}
                color="red"
                floating
                className='h5-responsive float-right'
                size="sm">
                <MDBIcon icon='thumbs-down' size="2x" className='white-text m-2 p-2'/>
              </MDBBtn>
              <span>Vote NO</span>
            </MDBTooltip>
            : null}

        </MDBCardBody>
        <div className='rounded-bottom mdb-color lighten-3 text-center pt-3 pl-5 pr-5'>
          <ul className='list-unstyled list-inline font-small'>
            <li className='list-inline-item pr-2 white-text h4-responsive'>
              <MDBIcon far
                       icon='clock'/>{" "}{convertDuration(props.data.vote_period_end).toLocaleDateString()} {convertDuration(props.data.vote_period_end).toLocaleTimeString()}
            </li>

            <li className='list-inline-item pr-2'>
              <div>
                {props.data.votes !== undefined && Object.keys(props.data.votes).length !== 0 && Object.values(props.data.votes).includes('Yes') ?
                  <MDBPopover
                    placement="top"
                    popover
                    clickable
                    domElement='div'
                    id="popover1"
                  >
                    <div className="d-inline-block">
                      <MDBIcon icon='thumbs-up' size="2x" className='lime-text mr-1'/>
                    </div>
                    <div>
                      <MDBPopoverBody>
                        <div className="h4-responsive">
                          {
                            Object.keys(props.data.votes).map((item, key) => (
                              <>
                                {props.data.votes[item] === 'Yes' ?
                                  <li key={key}>{item}</li>
                                  : null
                                }
                              </>
                            ))

                          }
                        </div>
                      </MDBPopoverBody>
                    </div>
                  </MDBPopover>
                  :
                  <MDBIcon icon='thumbs-up' size="2x" className='lime-text mr-1'/>
                }
                <span className="white-text h3-responsive">{props.data.vote_yes}</span>
              </div>
            </li>

            <li className='list-inline-item pr-2'>
              <div>
                {props.data.votes !== undefined && Object.keys(props.data.votes).length !== 0 && Object.values(props.data.votes).includes('No') ?
                  <MDBPopover
                    placement="top"
                    popover
                    clickable
                    domElement='div'
                    id="popover1"
                  >
                    <div className="d-inline-block">
                      <MDBIcon icon='thumbs-down' size="2x" className='amber-text mr-1'/>
                    </div>
                    <div>
                      <MDBPopoverBody>
                        <div className="h4-responsive">
                          {
                            Object.keys(props.data.votes).map((item, key) => (
                              <>
                                {props.data.votes[item] === 'No' ?
                                  <li key={key}>{item}</li>
                                  : null
                                }
                              </>
                            ))

                          }
                        </div>
                      </MDBPopoverBody>
                    </div>
                  </MDBPopover>
                  :
                  <MDBIcon icon='thumbs-down' size="2x" className='amber-text mr-1'/>
                }
                <span className="white-text h3-responsive">{props.data.vote_no}</span>
              </div>
            </li>
          </ul>
        </div>
      </MDBCard>
      {/*<QuestionModal show={showModal} text={modalText} handleVoteYes={handleVoteYes}/>*/}
    </MDBCol>
  )


}

const ProposalPage = () => {
  const [proposals, setProposals] = useState(null);
  const [council, setCouncil] = useState([]);

  let {dao, proposal} = useParams();
  const [showError, setShowError] = useState(null);


  useEffect(
    () => {
      window.contract = new Contract(window.walletConnection.account(), dao, {
        viewMethods: ['get_council', 'get_bond', 'get_proposal', 'get_num_proposals', 'get_proposals', 'get_vote_period', 'get_purpose'],
        changeMethods: ['vote', 'add_proposal', 'finalize'],
      })
    },
    [dao]
  )

  useEffect(
    () => {
      window.contract.get_council()
        .then(r => {
          setCouncil(r);
        }).catch((e) => {
        console.log(e);
        setShowError(e);
      })
    },
    [dao]
  )


  useEffect(
    () => {
      window.contract.get_proposals({from_index: parseInt(proposal), limit: 1})
        .then(list => {
          console.log(list)
          const t = []
          list.map((item, key) => {
            const t2 = {}
            Object.assign(t2, {key: key}, item);
            t.push(t2);
          })
          setProposals(t);
        })
    },
    [dao, proposal]
  )

  console.log(proposals)

  return (
    <MDBView className="w-100 h-100" style={{minHeight: "100vh"}}>
      <MDBMask className="d-flex justify-content-center grey lighten-2 align-items-center gradient"/>
      <Navbar/>
      <MDBContainer style={{minHeight: "100vh"}} className="mt-5">
        <MDBCol className="col-12 col-sm-8 col-lg-6 mx-auto mb-3">
          <MDBCard>
            <MDBCardBody className="text-left p-4 m-4">
              <MDBBox><b>Proposal DAO:</b> {dao}</MDBBox>
              <MDBBox><b>Council:</b> {council.map((item, key) => (<span>{item}{" "}</span>))}</MDBBox>
              <hr/>
              <MDBLink to={"/" + dao} className="btn-secondary text-center">BACK TO DAO</MDBLink>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        {proposals !== null ?
          proposals.map((item, key) => (
            <Proposal data={item} key={parseInt(proposal)} id={parseInt(proposal)} council={council}
                      setShowError={setShowError} dao={dao}/>
          ))
          : null
        }

        {proposals !== null && proposals.length === 0 ?
          <MDBCard className="text-center p-4 m-4">
            <MDBBox>Sorry, nothing was found</MDBBox>
          </MDBCard>
          : null}

      </MDBContainer>
      <Footer/>
    </MDBView>
  );

}

export default ProposalPage;


